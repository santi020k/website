#!/usr/bin/env bash
# Temporary diagnostics for the article's CI-only Total Blocking Time. Not for merging.
set -uo pipefail
out=/tmp/lh-out
mkdir -p "$out"
{
  nproc; free -m; google-chrome --version; fc-list | wc -l
  for family in 'Avenir Next' 'Segoe UI' 'SFMono-Regular' Menlo Consolas 'Liberation Mono' monospace sans-serif; do
    printf '%s -> ' "$family"; fc-match "$family"
  done
  fc-list : family | sort -u
} > "$out/env.txt" 2>&1
lh=$(ls -d node_modules/.pnpm/lighthouse@13.5.0*/node_modules/lighthouse | head -1)
python3 -m http.server 8080 --directory dist --bind 127.0.0.1 > "$out/server.log" 2>&1 &
sleep 2
url=http://127.0.0.1:8080/blog/playwright-accessibility-checks-that-teams-keep-running/
run() { # name, extra args...
  local name=$1; shift
  node "$lh/cli/index.js" "$url" --output=json --output-path="$out/$name.json" --quiet \
    --chrome-flags="--headless=new" "$@" || echo "run $name failed" >> "$out/errors.txt"
}
run default-1
run default-2
run default-trace --save-assets --additional-trace-categories=blink,fonts,base,toplevel
sans=$(fc-match sans-serif --format='%{file}')
mono=$(fc-match monospace --format='%{file}')
mkdir -p /tmp/fc/cache
cat > /tmp/fc/fonts.conf <<CONF
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>$(dirname "$sans")</dir>
  <dir>$(dirname "$mono")</dir>
  <cachedir>/tmp/fc/cache</cachedir>
</fontconfig>
CONF
cp /tmp/fc/fonts.conf "$out/minimal-fonts.conf"
FONTCONFIG_FILE=/tmp/fc/fonts.conf fc-list | wc -l > "$out/minimal-fonts-count.txt" 2>&1
export FONTCONFIG_FILE=/tmp/fc/fonts.conf
run minfonts-1
run minfonts-2
run minfonts-trace --save-assets --additional-trace-categories=blink,fonts,base,toplevel
unset FONTCONFIG_FILE
node "$lh/cli/index.js" http://127.0.0.1:8080/blog/ --output=json --output-path="$out/blog-index.json" --quiet \
  --chrome-flags="--headless=new" || echo "run blog-index failed" >> "$out/errors.txt"
