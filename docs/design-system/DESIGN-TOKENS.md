# Design Tokens: Colors, Typography, Spacing

## Color Palette

### Primary Brand Colors

```
Teal (Primary Action)
  - #134E4A (Teal 900) — Dark backgrounds, text on light
  - #0D9488 (Teal 600) — Primary buttons, focus states
  - #14B8A6 (Teal 500) — Hover states, accents
  - #2DD4BF (Teal 400) — Light backgrounds, disabled
  - #CCFBF1 (Teal 100) — Very light backgrounds
  - #F0FDFA (Teal 50)  — Page backgrounds, subtle
```

Usage:
- Buttons (primary variant)
- Links and focus rings
- Dashboard accent color
- Page header left border accent
- Active navigation items

### Semantic Status Colors

```
Success (Available / Completed)
  - #047857 (Green 700)  — Active text
  - #10B981 (Green 500)  — Status badge, indicators
  - #D1FAE5 (Green 100)  — Light background
  - #F0FDF4 (Green 50)   — Very light background

Warning (Full / Pending)
  - #B45309 (Amber 600)  — Text on light
  - #FBBF24 (Amber 400)  — Warning indicator
  - #FEF3C7 (Amber 100)  — Light background
  - #FFFBEB (Amber 50)   — Very light background

Danger (Closed / Error)
  - #DC2626 (Red 600)    — Error text, critical actions
  - #EF4444 (Red 500)    — Danger buttons, error indicators
  - #FEE2E2 (Red 100)    — Light background
  - #FEF2F2 (Red 50)     — Very light background

Info (Reserved / Active)
  - #0369A1 (Sky 700)    — Active text
  - #0EA5E9 (Sky 500)    — Info badge, secondary action
  - #E0F2FE (Sky 100)    — Light background
  - #F0F9FF (Sky 50)     — Very light background
```

### Neutral / Grayscale

```
Gray (Text, backgrounds, borders)
  - #111827 (Gray 900)  — Primary text on light background
  - #374151 (Gray 700)  — Secondary text, labels
  - #6B7280 (Gray 500)  — Tertiary text, placeholders
  - #D1D5DB (Gray 300)  — Borders, dividers
  - #F3F4F6 (Gray 100)  — Section backgrounds, hover states
  - #FFFFFF (White)     — Card backgrounds, main surface
```

### Dark Mode Variants

```
For every color above, use Tailwind dark: prefix:
  - dark:bg-gray-800 (card background in dark)
  - dark:bg-gray-900 (page background in dark)
  - dark:text-gray-100 (primary text in dark)
  - dark:border-gray-700 (borders in dark)
  - dark:text-gray-400 (secondary text in dark)
```

Example badge color for dark mode:
```
bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400
```

---

## Typography

### Font Family
- **Primary**: Figtree (modern, clean sans-serif)
- **Fallback**: System font stack (for web safety)

### Font Sizes & Weights

#### Headings (using text-* classes)

| Usage | Size | Weight | Line Height | Example |
|-------|------|--------|-------------|---------|
| Page Title | 1.875rem (30px) | bold (700) | tight | "Painel do Administrador" |
| Section Header | 1.25rem (20px) | bold (700) | tight | "Ocupação — próximos 7 dias" |
| Card Title | 1rem (16px) | semibold (600) | normal | "Nova reserva" |
| Subsection | 0.875rem (14px) | semibold (600) | normal | Column headers in tables |
| Label/Badge | 0.75rem (12px) | bold (700) | tight | Status badges, field labels |

#### Body Text (Figtree)

| Usage | Size | Weight | Line Height | Example |
|-------|------|--------|-------------|---------|
| Body (main) | 1rem (16px) | normal (400) | relaxed | Card descriptions |
| Body (secondary) | 0.875rem (14px) | normal (400) | relaxed | Subtitle text |
| Body (small) | 0.75rem (12px) | normal (400) | relaxed | Form hints, meta info |
| Mono/Code | 0.875rem (14px) | normal (400) | normal | IDs, QR codes, technical |

### Example HTML/Tailwind

```jsx
// Page title
<h1 className="text-3xl font-bold text-gray-900">Painel do Administrador</h1>

// Section subtitle
<p className="text-sm text-gray-500">Visão geral das operações</p>

// Card heading
<h2 className="text-lg font-semibold text-gray-900">Cotas Disponíveis</h2>

// Form label
<label className="block text-sm font-medium text-gray-700">Nome da Cota</label>

// Hint text
<p className="mt-1 text-xs text-gray-500">Optional field</p>

// Status badge
<span className="text-xs font-bold uppercase tracking-wide">Disponível</span>
```

---

## Spacing Scale

### Base Unit: 4px

All spacing uses multiples of 4px for consistency.

```
1   = 0.25rem = 4px
2   = 0.5rem  = 8px
3   = 0.75rem = 12px
4   = 1rem    = 16px
5   = 1.25rem = 20px
6   = 1.5rem  = 24px
8   = 2rem    = 32px
10  = 2.5rem  = 40px
12  = 3rem    = 48px
16  = 4rem    = 64px
```

### Common Spacing Patterns

| Component | Padding | Margin | Example |
|-----------|---------|--------|---------|
| Card | p-5 (20px) | m-0 | Dashboard cards |
| Button | px-4 py-2 (16px h, 8px v) | m-2 (8px) | Action buttons |
| Form field | mb-4 (16px) | flex flex-col gap-3 | Form sections |
| Section | px-4 sm:px-6 lg:px-8 (responsive) | py-6 mb-6 (24px) | Page sections |
| Table cell | px-4 py-3 (header), py-5 (body) | — | Data tables |
| Modal content | px-6 py-5 (24px/20px) | — | Modal body |
| Page padding | px-4 (mobile), px-8 (desktop) | py-8 (32px) | Page content wrapper |

### Responsive Breakpoints (using Tailwind)

```
sm: 640px   (tablets)
md: 768px   (medium tablets)
lg: 1024px  (desktops)
xl: 1280px  (large desktops)
2xl: 1536px (extra large)
```

Example responsive padding:
```jsx
<div className="px-4 sm:px-6 lg:px-8">
  // Mobile: 16px left/right
  // Tablet (sm): 24px left/right
  // Desktop (lg): 32px left/right
</div>
```

---

## Borders & Shadows

### Border Radius

```
Subtle: rounded-md (6px) — Form inputs, badges
Standard: rounded-lg (8px) — Cards, buttons, modals
Generous: rounded-xl (12px) — Large cards, list items
Extra: rounded-2xl (16px) — Dashboard quick links, hero sections
Circular: rounded-full — Avatar, status dots
```

### Border Width & Color

```
Default border: 1px border-gray-300 (light), border-gray-700 (dark)
Focus ring: 2px ring-2 ring-offset-2 ring-teal-500
Accent border: border-l-4 or border-t-4 (left/top accent, 4px wide)
```

### Shadows

```
None: shadow-none
Subtle: shadow-sm (small, used on cards)
Standard: shadow (medium, used on modals)
Strong: shadow-xl (large, used on popovers)
Inner: shadow-inner (inset shadow)
```

Example shadow hierarchy:
```jsx
// Subtle card
<div className="rounded-lg border border-gray-200 bg-white shadow-sm">

// Modal
<div className="rounded-lg bg-white shadow-xl">

// Hover state
<div className="transition hover:shadow-md">
```

---

## Component-Specific Tokens

### Button Variants

```
Primary: bg-teal-700 text-white hover:bg-teal-800 focus:ring-teal-500
Secondary: bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-400
Danger: bg-red-600 text-white hover:bg-red-700 focus:ring-red-500
Ghost: bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400
```

### Status Badge Tones

```
Neutral: bg-gray-100 text-gray-600
Info: bg-blue-50 text-blue-700
Success: bg-green-50 text-green-700
Warning: bg-amber-50 text-amber-700
Danger: bg-red-50 text-red-700
Violet: bg-violet-50 text-violet-700
```

### Form Input States

```
Default: border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200
Error: border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200
Disabled: opacity-50 cursor-not-allowed
Dark mode: dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100
```
