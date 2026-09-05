---
title: "How I Got R.E.P.O. Running on Mac Without Whisky"
description: "A tested Apple silicon setup for running R.E.P.O. through Silo, Wine, and DXMT, including the DirectX graphics failure and its exact fix."
publishDate: "2026-09-04T18:56:45.000Z"
draft: false
coverImage:
  alt: "A game artifact passing through a precise translation bridge from Windows graphics into a Metal-rendered environment"
  src: "./cover.webp"
tags: ["macos", "apple-silicon", "gaming", "wine", "dxmt"]
postType: "Guide"
---

<!-- cspell:words appmanifest CodeWeavers D3DMetal dxgi DXMT GPTK inspectable libraryfolders redistributables Sandboxed Steamworks userspace winemetal winetricks -->

R.E.P.O. does not have a native Mac release. Its Steam page lists Windows 10 or 11, DirectX, and a discrete Windows GPU.
That usually leaves Mac players choosing between a Windows PC, a paid compatibility product, or an old community guide
whose tools may no longer be maintained.

I wanted a fourth option: use the Mac I already own, keep the real Steam client and Steam ownership checks, and build the
setup entirely from free components I could inspect.

It works. The successful stack was **Silo + Wine + DXMT** on an Apple silicon Mac. The interesting part was not installing
Steam—it was diagnosing why the game initially crashed with a DirectX 11 error and selecting the correct 64-bit graphics
translation modules.

This guide documents the setup that worked for me on September 4, 2026. It is an independent compatibility experiment,
not an official Mac port or a promise that every Mac, game update, or Silo release will behave identically.

## The result

I tested the game on this machine:

- MacBook Pro with Apple M5 Pro
- 24 GB of unified memory
- macOS 27.0
- Silo 0.4.10, built locally from source
- Wine CX 26.3.0
- DXMT 0.72
- a legitimate Steam copy of R.E.P.O., app ID `3241660`

R.E.P.O. launched through the real Windows Steam client. Steamworks loaded, Direct3D negotiated feature level 11.1, and
the game remained running instead of exiting at graphics initialization.

That is narrower evidence than “R.E.P.O. supports Mac.” It proves this combination worked on one Apple silicon machine.

## Why I did not use Docker

Docker is useful for Linux services and reproducible build environments. It is the wrong abstraction for this job on a
Mac.

A Linux container on macOS runs inside a virtual machine. It does not give a Windows DirectX game the native Metal GPU
path, desktop integration, audio, input, and Steam compatibility environment it needs. Making a game window appear from
that stack would add virtualization and display layers without solving the DirectX-to-Metal problem.

The useful architecture is much simpler:

1. Wine provides the Windows userspace environment.
2. The real Windows Steam client runs inside the same Wine bottle as the game.
3. A graphics backend translates the game's Direct3D calls to Metal.
4. Silo manages those pieces and remembers a backend choice per game.

## Why Silo instead of Whisky

[Whisky](https://github.com/Whisky-App/Whisky) made Windows gaming on Apple silicon approachable, and many older tutorials
still recommend it. Its repository was archived in May 2025, however, and its maintainers explicitly warn that it is no
longer actively maintained and that games may break.

[Silo](https://github.com/mikaelhug/Silo) is a newer open-source SwiftUI launcher built around the same practical goal. It
runs a real Windows Steam client in a shared Wine bottle, imports Apple's Game Porting Toolkit, installs DXMT, and can
choose or override the Metal graphics backend for each game. Its Wine runtime is built from CodeWeavers' published
CrossOver sources, and its runtime downloads are checksum-verified.

Silo is still a young community project. The app is ad-hoc signed, not distributed through the Mac App Store, and is not
App-Sandboxed because it must execute Wine and manage its bottle. Read its source and security notes before deciding
whether that trust model works for you.

## What you need

Before starting, have:

- an Apple silicon Mac
- a current version of macOS supported by Silo
- enough storage for Wine, Steam, translation runtimes, and the game
- a Steam account that owns R.E.P.O.
- a free Apple Developer account for the official Game Porting Toolkit download
- a backup of any existing Silo configuration you care about

The [R.E.P.O. Steam page](https://store.steampowered.com/app/3241660/repo/) lists 8 GB of RAM and 1 GB of storage as its
Windows minimums. Those are not Mac compatibility guarantees, and the complete Wine setup consumes more storage than the
game alone.

Do not use this process to bypass Steam ownership, DRM, anti-cheat, or multiplayer restrictions. The reason this setup is
useful is that the real Steam client and the game run together in the same bottle.

## Install Silo

The easiest route is the current build on [Silo's Releases page](https://github.com/mikaelhug/Silo/releases). Because its
downloaded app is ad-hoc signed, macOS may require **Control-click → Open** on first launch.

I preferred to build the exact source I was about to run. Silo requires a Swift 6 toolchain; Apple's Command Line Tools are
enough.

```sh
git clone https://github.com/mikaelhug/Silo.git
cd Silo
git checkout v0.4.10
./Scripts/test.sh
./Scripts/build-app.sh
ditto dist/Silo.app /Applications/Silo.app
open /Applications/Silo.app
```

The test script completed **525 tests across 71 suites** before I installed the app. That count belongs to version 0.4.10
and will naturally change as the project evolves.

Building from source does not make third-party code automatically safe. It does make the exact revision and build process
inspectable, which is the property I wanted.

## Import Apple's toolkit and set up Steam

Silo's first-run flow asks for Apple's Game Porting Toolkit, then downloads its Wine and DXMT runtimes and creates the
shared Steam bottle.

For a clean installation:

1. Download the current [Game Porting Toolkit from Apple](https://developer.apple.com/games/game-porting-toolkit/).
2. In Silo, select the downloaded `.dmg` when prompted.
3. Let Silo download Wine and its graphics runtimes.
4. Complete both Microsoft Visual C++ redistributable installers when they appear.
5. Sign in to the real Windows Steam client that Silo opens.

I already had an Apple-signed GPTK 3 runtime installed through Heroic, so I reused a copy for the initial experiment. New
users should follow Silo's supported `.dmg` import instead of depending on another launcher's private folder layout.

Apple describes GPTK as an evaluation and porting environment for running unmodified Windows executables on Apple
silicon. Silo turns that lower-level capability into a game launcher, but neither Apple nor the R.E.P.O. developers
officially support this specific setup.

## Install R.E.P.O. in the Windows Steam client

Use Steam inside Silo exactly as you would on Windows:

1. Find R.E.P.O. in your library.
2. Install it and wait for Steam to finish downloading and validating the files.
3. Return to Silo and refresh its library if the game does not appear immediately.
4. Open the game's settings in Silo and choose **DXMT** as its graphics backend.

Silo discovers installed games from Steam's `appmanifest_*.acf` and `libraryfolders.vdf` files. Starting the install is not
enough; the completed Steam manifest must exist before discovery can succeed.

## The graphics failure I hit

My first launch used the automatic/GPTK path and failed before the game window initialized:

```text
Failed to initialize graphics.
Make sure you have DirectX 11 installed, have up to date
drivers for your graphics card and have not disabled
3D acceleration in display settings.
InitializeEngineGraphics failed
```

The Wine crash log also contained a null page fault after loading `dxgi` and `d3d11`.

That message sounds like a missing Windows driver, but installing random DirectX redistributables would not address the
actual boundary. On this Mac, the failure happened while Wine was selecting and loading the layer responsible for
translating Direct3D 11 to Metal.

[DXMT](https://github.com/3Shain/dxmt) is specifically a Metal-based Direct3D 10 and 11 implementation for Wine. R.E.P.O.
is a 64-bit Unity game, so it needed DXMT's `x86_64-windows` modules. My Silo configuration pointed at the sibling
`i386-windows` directory instead.

## The fix: pin DXMT and verify the 64-bit path

First use Silo's per-game settings to set R.E.P.O.'s graphics backend to **DXMT**. In current Silo releases, that should be
the only manual change required.

If the same DirectX initialization error remains, fully quit both the game and Silo before inspecting the configuration:

```sh
silo_support="$HOME/Library/Application Support/Silo"
cp "$silo_support/config.json" "$silo_support/config.json.before-repo-dxmt"
open -e "$silo_support/config.json"
```

In the `backend` object, inspect `dxmtLibDirPath`. The final directory for this 64-bit game must be
`x86_64-windows/`, not `i386-windows/`. The surrounding runtime version will depend on the Silo release you installed:

```json
{
  "backend": {
    "dxmtLibDirPath": "file:///Users/you/Library/Application%20Support/Silo/Runtimes/dxmt-.../x86_64-windows/"
  }
}
```

Then find the game entry with `"appID": 3241660` and verify that it contains:

```json
{
  "appID": 3241660,
  "graphics": "dxmt"
}
```

Do not replace the rest of either object with these abbreviated examples. Preserve the existing keys, change only the
incorrect path segment or graphics value, save valid JSON, and reopen Silo. The backup makes the manual edit reversible.

Silo then created a DXMT-specific Wine runtime variant and launched the game with the 64-bit `wine64` executable.

## How I verified that it was actually fixed

The absence of the error dialog was encouraging, but the game log provided stronger evidence. Silo keeps a log per Steam
app ID. I checked R.E.P.O.'s with:

```sh
repo_log="$HOME/Library/Application Support/Silo/Logs/3241660.log"
grep -Ei 'feature level|winemetal|InitializeEngineGraphics|Unhandled page fault' "$repo_log"
```

The successful launch showed:

```text
Maximum supported feature level: D3D_FEATURE_LEVEL_11_1
Using feature level D3D_FEATURE_LEVEL_11_1
```

The same run loaded `steam_api64`, stayed alive beyond startup, and did not contain the earlier graphics initialization
failure or page fault. Together with the rendered game window, that was enough to call this setup working.

## Troubleshooting notes

### Silo does not show R.E.P.O.

Confirm that Steam finished the download, then refresh Silo's library. Look for Steam's manifest for app ID `3241660` if
discovery still fails.

### Steam opens with a blank or incomplete window

Quit Steam from Silo and reopen it. Silo launches Steam with compatibility flags for its Chromium-based interface; do not
add unrelated Wine overrides until the standard launch has had a chance to finish first-run setup.

### The DirectX 11 message returns

Confirm the game is pinned to DXMT and that `dxmtLibDirPath` ends in `x86_64-windows/`. Also check the newest game log;
an old crash log can make a repaired setup look broken.

### Voice chat cannot hear you

Allow microphone access for Silo when macOS asks. If the prompt was denied, review **System Settings → Privacy &
Security → Microphone** and relaunch the game.

### An update breaks the setup

Treat Silo, Wine, DXMT, Steam, macOS, and R.E.P.O. as separate moving parts. Record the versions that last worked, keep a
copy of `config.json`, and inspect the newest per-game log before changing multiple layers at once.

## What I would recommend now

For an Apple silicon owner who already owns the game and wants a free path, Silo is a more defensible starting point than
following an old Whisky recipe. It is active, open source, uses the real Steam client, and exposes the graphics choice that
made this repair possible.

It is not as polished or supported as buying a Windows PC or paying for a commercial compatibility product. Some games
will fail because of anti-cheat, unsupported graphics behavior, launchers, or future updates. R.E.P.O. itself could change.

But this result is useful precisely because it is reproducible and diagnosable. The winning move was not pretending the
game was native. It was giving each boundary a clear job—Steam for ownership, Wine for Windows behavior, DXMT for
Direct3D 11, and Metal for the Mac GPU—then reading the log when one boundary selected the wrong architecture.

That is a much healthier foundation than keeping an archived wrapper alive indefinitely.

## References

- [Silo source, setup, architecture, and security notes](https://github.com/mikaelhug/Silo)
- [DXMT source and documentation](https://github.com/3Shain/dxmt)
- [Apple Game Porting Toolkit](https://developer.apple.com/games/game-porting-toolkit/)
- [R.E.P.O. on Steam](https://store.steampowered.com/app/3241660/repo/)
- [Whisky maintenance notice](https://github.com/Whisky-App/Whisky)

If you enjoy the engineering side of making Mac software easier to install, I also wrote about [shipping macOS tools
with a personal Homebrew tap](/blog/shipping-macos-tools-with-a-homebrew-tap/).
