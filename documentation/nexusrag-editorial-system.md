# NexusRAG Editorial System

This document is the canonical brand/style reference for `raga-fe` redesign work.

```yaml
name: NexusRAG Editorial System
colors:
  surface: '#fff8f5'
  surface-dim: '#e0d8d5'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf2ee'
  surface-container: '#f4ece8'
  surface-container-high: '#eee7e3'
  surface-container-highest: '#e9e1dd'
  on-surface: '#1e1b19'
  on-surface-variant: '#4a4452'
  inverse-surface: '#33302d'
  inverse-on-surface: '#f7efeb'
  outline: '#7b7483'
  outline-variant: '#ccc3d4'
  surface-tint: '#6f46b9'
  primary: '#340075'
  on-primary: '#ffffff'
  primary-container: '#4c1d95'
  on-primary-container: '#b994ff'
  inverse-primary: '#d3bbff'
  secondary: '#795900'
  on-secondary: '#ffffff'
  secondary-container: '#ffc329'
  on-secondary-container: '#6f5100'
  tertiary: '#252727'
  on-tertiary: '#ffffff'
  tertiary-container: '#3b3d3d'
  on-tertiary-container: '#a7a7a7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ebdcff'
  primary-fixed-dim: '#d3bbff'
  on-primary-fixed: '#260059'
  on-primary-fixed-variant: '#572ba0'
  secondary-fixed: '#ffdf9f'
  secondary-fixed-dim: '#f9bd22'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c7c6'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#fff8f5'
  on-background: '#1e1b19'
  surface-variant: '#e9e1dd'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  code-snippet:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-padding-mobile: 16px
  container-padding-desktop: 40px
  gutter: 24px
  section-gap: 64px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
```

## Brand & Style

The design system establishes a high-fidelity, developer-first aesthetic that bridges the gap between technical power and editorial sophistication. It targets enterprise decision-makers and senior engineers who value precision and premium quality.

The style is **High-Contrast Editorial**. It rejects the typical "SaaS blue" in favor of a curated, boutique-agency feel. By mixing classical serif typography with technical monospaced elements, the UI signals that the platform is both intellectually authoritative and technologically advanced. The visual language is structured, dense with information but meticulously organized, utilizing a "Swiss Style" influence characterized by grid-based layouts and intentional hierarchy.

## Colors

The palette is anchored by a sophisticated contrast between deep violet and warm architectural tones.

- **Primary (Deep Violet):** Used for primary actions, active navigation states, and key brand moments. It conveys depth and enterprise stability.
- **Secondary (Electric Yellow):** A high-impact accent used sparingly for highlights, warnings, or "New" feature badges to break the sophisticated palette with a punch of energy.
- **Background (Beige):** The global canvas uses a warm, low-strain beige (`#f5f5f4`) to differentiate from generic white-label software.
- **Surface (White):** Card surfaces and input containers use pure white (`#ffffff`) to provide a crisp, elevated layer against the beige background.
- **Neutral (Stone):** A dark stone gray (`#1c1917`) is used for text to maintain high readability without the harshness of pure black.

## Typography

This system employs a tri-font hierarchy to communicate different types of information:

1. **Editorial Serif (Playfair Display):** Reserved for page titles, section headers, and high-level marketing statements. It provides the "High-End" feel.
2. **Functional Sans (Inter):** Used for all body copy, descriptions, and primary UI interactions. It ensures high legibility and a modern feel.
3. **Technical Mono (JetBrains Mono):** Used for data points, metadata, status labels, and code blocks. This anchors the product in its "developer-first" identity.

All labels and technical data should be set in uppercase when using `label-sm` to enhance the archival/data aesthetic.

## Layout & Spacing

The system follows a strict **8pt grid**. Layouts should feel intentional and structural, reminiscent of a printed magazine or a technical blueprint.

- **Grid Model:** Use a 12-column grid for desktop with 24px gutters. Elements should snap precisely to grid lines.
- **Density:** Maintain a high-information density for dashboard views, but use generous `section-gap` (64px+) between distinct conceptual areas to prevent visual overwhelm.
- **Responsiveness:** On mobile, move to a 4-column grid. Large serif headlines should scale down aggressively to avoid awkward wraps.
- **Alignment:** Prefer left-aligned text for most contexts to maintain a strong vertical axis that guides the eye through technical data.

## Elevation & Depth

Depth is achieved through **High-Fidelity Shadows** and **Structured Outlines**.

- **Tonal Layering:** The primary depth mechanism is the contrast between the beige background and white surfaces.
- **Borders:** Every card/container should have a 1px solid border. Use `#e7e5e4` for subtle separation and Deep Violet (`#4c1d95`) for active/focused states.
- **Shadows:**
  - Level 1 (Cards): `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`
  - Level 2 (Dropdowns/Modals): `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`
- **Interactions:** On hover, cards should shift up by 2px and increase shadow spread to simulate lift.

## Shapes

The shape language is professional and architectural.

- **Primary Radius:** 4px (`rounded-sm`) for inputs, buttons, and small components.
- **Container Radius:** 8px (`rounded-lg`) for larger cards/main content.
- **Exceptions:** Status pills/tags may use full pill shape (`rounded-full`) with Mono text.

Avoid large, soft circles. Preserve sharp, defined corners.

## Components

### Buttons
- **Primary:** Deep Violet background, White text, 4px radius, bold Inter.
- **Secondary:** White background, 1px Deep Violet border, Deep Violet text.
- **Ghost/Tertiary:** No background/border, Deep Violet text.

### Input Fields
- **Default:** White background, 1px Stone-300 border, JetBrains Mono placeholder.
- **Focus:** 1px Deep Violet border + 2px Violet outer glow (20% opacity).

### Cards
- **Editorial Card:** White surface, 1px border, 8px radius. Use Playfair Display for card title and JetBrains Mono metadata label (e.g., `DOC_ID: 082`).

### Chips & Tags
- **Technical Tags:** Light violet wash (10% opacity) with Deep Violet Mono text.
- **Warning Tags:** Electric Yellow background with black Mono text.

### Lists & Data Tables
- Strict horizontal 1px Stone-200 row separators.
- No vertical lines.
- Header row uses `label-sm` (Mono) on light beige background.
