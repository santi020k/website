---
name: Automation Scripts
description: Guidelines for using JavaScript and Python utility scripts for site maintenance and content generation.
---

# Automation Scripts Skill

Use this skill when you need to run, modify, or troubleshoot the various utility scripts used for generating assets, fonts, and the personal CV.

## Directory Structure

All scripts are located in the `scripts/` directory, separated by language:

- `scripts/js/`: Node.js based scripts (ESM/JS).
- `scripts/py/`: Python 3 based scripts.

## JavaScript Scripts (pnpm shortcuts)

Most JS scripts are integrated into the `package.json` workflow.

| Task | Command | Script Path |
| --- | --- | --- |
| **Generate Favicons** | `pnpm run generate:icons` | `scripts/js/generate-favicons.mjs` |
| **Generate Fonts (subset)** | `pnpm run generate:fonts` | `scripts/js/generate-fonts.mjs` |
| **Generate OG Images** | `pnpm run generate:og` | `scripts/js/generate-og-images.js` (+ `og-render-worker.mjs` pool) |
| **Force Regenerate OG** | `pnpm run generate:og:force` | `scripts/js/generate-og-images.js` |
| **Refresh Project Covers** | `pnpm run refresh:covers` | `scripts/js/refresh-project-covers.mjs` |

### Prerequisites
- Node.js 24+
- `pnpm install` dependencies

**OG images:** Renders use a `worker_threads` pool (Satori/Resvg/Sharp per isolate). Set `OG_WORKER_THREADS` to cap parallelism on low-memory CI (default `min(8, os.availableParallelism())`).

---

## Python Scripts

Python scripts are used for specialized tasks like PDF generation and font weight instantiation.

| Task | Command | Script Path |
| --- | --- | --- |
| **Generate CV PDF** | `pnpm run generate:cv` | `scripts/py/generate-cv.py` |
| **Generate Font Weights** | `pnpm run generate:fonts:py` | `scripts/py/generate-fonts.py` |

### Prerequisites
- Python 3.9+
- Python packages (install as needed):
  ```bash
  pip install reportlab fonttools
  ```

### Usage Details

#### 1. Generating the CV
The `generate:cv` script reads `scripts/py/cv.md` (metadata) and produces `public/pdf/cv.pdf`. 
- **Fonts**: It requires `Montserrat-Bold.ttf` and `Montserrat-ExtraBold.ttf` to exist in `public/fonts/`. If they are missing, run the font weight generator first.

#### 2. Generating Font Weights
The `generate:fonts:py` script uses `fonttools` to extract specific weights from the variable font file `public/fonts/montserrat-variable-font-wght.ttf`.
- Run this if you need to add new weights to the CV or website that aren't provided by standard exports.

## Troubleshooting

- **Path Errors**: Ensure you run all commands from the **project root**.
- **Missing Fonts**: If `satori` or `reportlab` fail with font errors, verify that `public/fonts/` contains the required `.ttf` files.
- **Dependency Issues**: If a script fails to import a module, check that `pnpm install` (for JS) or `pip install` (for Python) was executed.
