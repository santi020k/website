#!/usr/bin/env python3
"""
Generate static Montserrat weight instances from the variable font.

Run this once whenever you need a new weight, or if the generated
TTF files go missing. Requires fonttools:

    pip install fonttools

Usage:
    python3 scripts/generate-fonts.py
"""

import sys
from pathlib import Path

try:
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
except ImportError:
    sys.exit("fonttools is required: pip install fonttools")

FONTS_DIR = Path(__file__).parent.parent / "public" / "fonts"
VAR_FONT   = FONTS_DIR / "montserrat-variable-font-wght.ttf"

WEIGHTS = {
    "Montserrat-SemiBold.ttf": 600,
    "Montserrat-Bold.ttf":     700,
}

for filename, weight in WEIGHTS.items():
    out = FONTS_DIR / filename
    font = TTFont(str(VAR_FONT))
    instantiateVariableFont(font, {"wght": weight})
    font.save(str(out))
    print(f"  {filename} ({weight}w) → {out}")

print("Done.")
