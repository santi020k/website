# Theming: HSL Dynamic System

The project uses a flexible theming system based on **HSL (Hue, Saturation, Lightness)** using CSS variables. This allows for dynamic color adjustments and seamless dark/light mode management by changing just a few root parameters.

## Core Principles

1. **Hue Rotation (`--hue`)**: The base color for backgrounds, secondary accents, and text is centered around a single hue.
2. **Adaptive Saturation (`--saturation`)**: Saturation levels adjust automatically between dark and light modes for optimal contrast.
3. **Dynamic Brightness**: Background (`--bg-brightness`) and text (`--fg-brightness`) are calculated using percentages for consistent transitions.
4. **Gradation Scale**: A set of variables (`--theme-color-50` to `--theme-color-950`) creates a smooth gradient of the base color.

## Key CSS Variables

- **`--theme-bg`**: The dynamic background color.
- **`--theme-text`**: The main foreground text color.
- **`--theme-accent-base`**: Secondary brand/accent color.
- **`--theme-accent-two`**: Primary brand/accent color (distinct from base hue).
- **`--theme-link`**: Color for interactive links.

## Color Scheme Implementation

- **Light Mode**: Uses higher background brightness (~95%) and lower text brightness (~9%).
- **Dark Mode**: Flips the logic with low background brightness (~17%) and high text brightness (~98%).

## Usage

When generating new components or styling advice, respect the HSL variables instead of using hardcoded hex or tailwind classes that don't follow the `--theme` tokens. Always prefer `var(--theme-*)` for consistent UI.
