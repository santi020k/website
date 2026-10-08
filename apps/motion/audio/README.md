<!-- cspell:ignore Holizna holiznacc0 chills afade loudnorm LRA LUFS kbps libmp3lame -->
# Soundtrack provenance

**Chills — Holizna**, published by the artist on OpenGameArt on April 11, 2024.

- Source: https://opengameart.org/content/chills
- Original file: https://opengameart.org/sites/default/files/01_holiznacc0_-_chills_0.mp3
- License: **CC0 1.0 Universal**, verified on the source page on October 8, 2026.
- License deed: https://creativecommons.org/publicdomain/zero/1.0/
- Legal text: https://creativecommons.org/publicdomain/zero/1.0/legalcode

CC0 permits copying, editing, and distribution, including commercial use, without
requiring attribution. The preview and this record credit Holizna voluntarily.
No endorsement by the artist is implied. The website code's license does not
replace the soundtrack's CC0 dedication.

The committed `chills-history-edit.mp3` uses the first 30 seconds, with an 0.8-second
fade in, a 3-second fade out, and a normalized level targeting -18 LUFS. It is
48 kHz stereo MP3 at 192 kbps. All three exports use this identical local file.

SHA-256 of original download:
`88cf8c964ea08b7eca071332ce57ebb33a09838f02cccda0ade8e792c6bc6e2c`

SHA-256 of edited file:
`894411fd1bd0e1be9c0e85d1496ed91ece1bb04a60e07fe53c57c72f6929cdcf`

To reproduce after downloading the original to a temporary path:

```bash
ffmpeg -y -i /tmp/holizna-chills-original.mp3 -t 30 \
  -af 'afade=t=in:st=0:d=0.8,afade=t=out:st=27:d=3,loudnorm=I=-18:TP=-1.5:LRA=11' \
  -ar 48000 -ac 2 -codec:a libmp3lame -b:a 192k \
  apps/motion/audio/chills-history-edit.mp3
```

Suggested publication credit: Music: “Chills” by Holizna — CC0 1.0, via OpenGameArt.
