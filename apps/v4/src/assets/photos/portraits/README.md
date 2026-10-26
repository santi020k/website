# Portrait options

Seven portrait options created on October 7, 2026, with the built-in image generation
tool, using Santiago's supplied photographs as identity references.
These are selectable source assets; importing a chosen portrait with Astro's
image tools produces the optimized formats needed by its consuming page.

All files are original 1024 × 1536 PNG outputs. The existing page portraits
remain selected until a new option is chosen.

| Option | File | Expression and setting |
| --- | --- | --- |
| Original | [Charcoal smile](santiago-charcoal-smile.png) | Open smile, muted purple-gray background, white shirt |
| Light | [Ivory smile](santiago-ivory-smile.png) | Open smile, warm ivory background, white shirt |
| Dark | [Plum smile](santiago-plum-smile.png) | Open smile, deep plum background, charcoal shirt |
| Outdoor | [Outdoor smile](santiago-outdoor-smile.png) | Open smile, softly blurred green foliage, white shirt |
| Soft smile | [Plum soft smile](santiago-plum-soft-smile.png) | Relaxed closed-mouth smile, plum background, charcoal shirt |
| Neutral | [Plum neutral](santiago-plum-neutral.png) | Calm neutral expression, plum background, charcoal shirt |
| Angled | [Plum three-quarter](santiago-plum-three-quarter.png) | Slightly turned pose and closed-mouth smile, plum background, charcoal shirt |

## Generation direction

The first portrait uses `IMG_2628.HEIC` as its main smiling reference and
`IMG_2631.HEIC` plus the supplied close-up as supporting references. Its prompt
requests a natural portrait with soft lighting, a charcoal background with a
subtle purple tone, an off-white shirt, and no earbuds. Preserve facial
proportions, smile, skin texture, hair color, facial hair, and jewelry.

The ivory, plum, and outdoor variants use the first portrait as the edit target.
Keep the face, expression, pose, and crop consistent. Change the background to
warm ivory, deep plum, or blurred foliage respectively; the plum version also
changes the shirt to charcoal.

The three expression variants use the real relaxed and smiling photographs for
identity and the plum portrait for styling. Keep the same charcoal shirt,
muted plum setting, soft lighting, hair, jewelry, and natural skin detail.
Vary only the requested expression or angle: a gentle closed-mouth smile, a
relaxed neutral expression, or a subtle three-quarter pose with a small smile.

These generated alternatives should be reviewed for likeness when selecting
the final portrait. The three-quarter option extrapolates an angle from the
supplied front-facing references.
