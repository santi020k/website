#!/usr/bin/env python3
"""
Generate static Montserrat TTF files used by generate-cv.py.

Run this once if the Bold or ExtraBold TTF files go missing.
Requires: fonttools and the @fontsource/montserrat npm package.

    npm pack @fontsource/montserrat          # downloads the tgz
    tar -xzf fontsource-montserrat-*.tgz     # extracts to ./package/
    python3 scripts/py/generate-fonts.py

How it works:
    Converts the proper Google Fonts static WOFF files (from fontsource) to
    plain TTF by stripping the WOFF wrapper. This is more reliable than
    instantiating the variable font, which produces incorrect rendering.

Files generated in public/fonts/:
    Montserrat-Regular.ttf   (400) — already shipped with the site
    Montserrat-Bold.ttf      (700)
    Montserrat-ExtraBold.ttf (800)
"""

import sys
import glob
from pathlib import Path

try:
    from fontTools.ttLib import TTFont
except ImportError:
    sys.exit("fonttools is required: pip install fonttools")

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
FONTS_DIR = PROJECT_ROOT / "public" / "fonts"
VAR_FONT   = FONTS_DIR / "montserrat-variable-font-wght.ttf"

# Locate the extracted fontsource tgz (run from project root after npm pack)
tgz_candidates = glob.glob("fontsource-montserrat-*.tgz") + glob.glob("package/files/*.woff")
files_dir = Path("package/files")

if not files_dir.exists():
    sys.exit(
        "Could not find extracted fontsource package.\n"
        "Run:\n"
        "  npm pack @fontsource/montserrat\n"
        "  tar -xzf fontsource-montserrat-*.tgz\n"
        "  python3 scripts/py/generate-fonts.py"
    )

CONVERSIONS = [
    ("montserrat-latin-400-normal.woff", "Montserrat-Regular.ttf"),
    ("montserrat-latin-600-normal.woff", "Montserrat-SemiBold.ttf"),
    ("montserrat-latin-700-normal.woff", "Montserrat-Bold.ttf"),
    ("montserrat-latin-900-normal.woff", "Montserrat-ExtraBold.ttf"),
]

for src_name, dst_name in CONVERSIONS:
    src = files_dir / src_name
    dst = FONTS_DIR / dst_name
    if not src.exists():
        print(f"  SKIP {src_name} — file not found")
        continue
    font = TTFont(str(src))
    font.flavor = None  # strip WOFF wrapper → plain TTF/OTF
    font.save(str(dst))
    print(f"  {src_name} → {dst_name}")

print("Done.")
