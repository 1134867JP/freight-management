# Layout Patterns: Admin & Client

## Admin Layout

### Overview
Two-column layout: fixed left sidebar + main content area. Supports multiple screen sizes with responsive collapse.

### Components

**Sidebar Navigation**
- Fixed position: left-0 top-0, width 16rem (256px)
- Height: 100vh (full screen)
- Background: white with 1px right border (gray-200)
- Dark mode: dark:bg-gray-800 dark:border-gray-700
- Content: Logo, menu items, user profile (optional)
- Behavior: Sticky on desktop, collapsible hamburger on mobile

**Header/Top Bar**
- Position: sticky top-0
- Height: 64px (with padding)
- Background: white with 1px bottom border
- Left margin: 16rem (256px) on desktop, 0 on mobile
- Contains: Page title, breadcrumbs, actions (right-aligned)
- Dark mode: dark:bg-gray-800 dark:border-gray-700

**Main Content Area**
- Margin-left: 16rem (256px) on desktop, 0 on mobile
- Padding: px-4 sm:px-6 lg:px-8 (responsive horizontal)
- Padding-top: py-8 (32px vertical)
- Max width: mx-auto max-w-7xl (80rem)
- Background: white on light, gray-900 on dark

**Sidebar Menu Items**
- Padding: px-2 py-4
- Item padding: px-3 py-2
- Item spacing: space-y-1 (small gap between items)
- Font size: text-sm
- Font weight: font-medium
- Border radius: rounded-lg
- Active state: bg-teal-50 text-teal-700 border-l-4 border-teal-500
- Hover state: bg-gray-50 transition

### Breakpoints

Mobile (< 640px):
- Sidebar hidden by default
- Hamburger menu button in header
- Main content full width
- Header height: 56px (smaller)

Tablet (640px - 1023px):
- Sidebar visible but narrower (12rem / 192px)
- Show icons + labels
- Main content adjusts width

Desktop (>= 1024px):
- Sidebar full width (16rem / 256px)
- Main content sidebar width + content
- Header spans full width

### Dashboard Structure

`
Grid: grid-cols-2 gap-4 (mobile) -> xl:grid-cols-4 (desktop)

Cards:
- Stat cards: rounded-lg border border-gray-200 bg-white shadow-sm p-5
- Card layout: flex flex-col, left border accent (4px, border-l-4)
- Left border color: gray, green, blue, orange, red (semantic)

Quick Links Grid:
- Grid: grid-cols-2 gap-4 md:grid-cols-3 (responsive)
- Card: rounded-2xl border-t-4 bg-white p-5 shadow-sm ring-1 ring-gray-100
- Top border: 4px color accent (semantic meaning)
- Hover: shadow-md -translate-y-0.5 ring-teal-200
`

### Data Table Structure

`
Container: overflow-x-auto rounded-xl border border-gray-200 bg-white

Table:
- Width: min-w-[980px] w-full (allow horizontal scroll on mobile)
- Layout: table-fixed text-left

Header:
- Background: bg-gray-50
- Border: border-b border-gray-100
- Cells: px-4 py-3
- Font: text-xs uppercase tracking-wide font-semibold
- Color: text-gray-600

Body:
- Rows: border-b border-gray-100
- Row padding: px-4 py-5
- Row hover: hover:bg-gray-50 transition cursor-pointer
- Font: text-sm

Actions:
- Align: text-right
- Button spacing: flex gap-2 justify-end
- Button variants: secondary size-sm for non-primary actions
`

### Form Page Layout

`
Container: max-w-2xl (32rem)
Spacing: space-y-6

Sections:
- Card wrapper: rounded-lg border border-gray-200 bg-white shadow-sm p-5
- Section spacing: space-y-4 (between form fields)
- Divider: border-t border-gray-100 my-6

Form Fields:
- Layout: space-y-4
- Field wrapper: <FormField>
- Label: block text-sm font-medium text-gray-700
- Input: mt-1 block w-full (FormField.Input)
- Error/Hint: mt-1 text-xs (semantic color)

Form Footer:
- Layout: flex gap-3 justify-end
- Buttons: secondary (Cancel), primary (Submit)
- Position: sticky bottom-0 or floating
- Background: bg-white border-t border-gray-100 p-4
`

---

## Client Layout

### Overview
Similar to Admin but simpler navigation. Focus on task flow: Find Cotas → Reserve → Track.

### Components

**Navigation (Top Bar or Sidebar)**
- Option 1: Top navigation bar (simpler, mobile-friendly)
- Option 2: Left sidebar like Admin (if feature parity needed)

**Top Navigation Structure**
- Position: sticky top-0, height 64px
- Content: Logo (left), menu items (center/right), user menu (right)
- Background: white border-b border-gray-200
- Mobile: Hamburger menu, collapsed items
- Desktop: Full menu, user dropdown

**Main Content Area**
- Full width on mobile
- Max-width: max-w-7xl on desktop
- Padding: px-4 sm:px-6 lg:px-8 py-8 (responsive)
- Background: white light, gray-900 dark

**Quick Links / Dashboard Cards**
- Grid: grid-cols-1 gap-4 md:grid-cols-3
- Card: rounded-xl border-t-4 bg-white p-6 shadow-sm ring-1 ring-gray-100
- Click action: Link to next page (Available Slots, Trucks, etc)
- Icon: 32px (h-8 w-8) in iconBg colored box

### Dashboard Structure

`
Stat Cards Grid: grid-cols-2 gap-4 xl:grid-cols-6 (smaller cards, more data)
Card height: flex flex-col
Card padding: p-5
Color accents: left border-l-4 + color-semantic

Quick Access: grid-cols-1 md:grid-cols-3
Card: rounded-xl p-6 border-t-4
Content: Icon box + title + description
Hover: shadow-md ring-teal-200 transition
`

### Available Cotas List

`
Layout: Two column on desktop, single column on mobile

Left Column (Filters):
- Width: md:w-64 (256px)
- Sticky: sticky top-20 (below header)
- Card: rounded-lg border border-gray-200 bg-white shadow-sm p-5
- Spacing: space-y-4
- Filter button: w-full variant-primary

Right Column (List/Grid):
- Width: flex-1
- Spacing: space-y-3
- Items: Cota cards (grid-cols-1 lg:grid-cols-2)

Cota Card:
- Rounded: rounded-lg
- Border: border border-gray-200
- Padding: p-4
- Hover: shadow-md ring-teal-200 cursor-pointer
- Content:
  - Header: flex justify-between
    - Title: text-sm font-semibold
    - Status badge: top-right
  - Body: mt-2 space-y-1
    - Date/Time: text-xs text-gray-500
    - Capacity: text-sm text-gray-700
    - Occupancy bar: bg-gray-200 h-2 rounded
  - Footer: mt-3 flex justify-between
    - Availability: text-xs text-gray-500
    - Button: variant-primary size-sm
`

### My Reservations Page

`
Layout: Single column, max-w-4xl

Filters (horizontal):
- Grid: grid-cols-auto gap-3
- Filter chips: rounded-full border border-gray-300 px-3 py-1 text-sm
- Active: bg-teal-50 border-teal-300 text-teal-700
- Reset link: text-teal-600 text-sm

List:
- Spacing: space-y-3
- Item card: rounded-lg border border-gray-200 bg-white shadow-sm p-4
- Layout: flex justify-between items-start

Reservation Card:
- Left: flex-1
  - Title: text-sm font-semibold
  - Meta: mt-1 text-xs text-gray-500 (date, time, cota)
  - Status badge: mt-2
- Right: flex flex-col gap-2
  - Status: text-right text-xs font-semibold
  - Action buttons: space-y-1
    - View: variant-secondary size-sm
    - Cancel: variant-danger size-sm
`

### Truck Management Page

`
Layout: Single column, max-w-4xl

Header:
- Title: text-lg font-bold
- Subtitle: text-sm text-gray-500
- Action: Button variant-primary float right

List:
- Spacing: space-y-3
- Item card: rounded-lg border border-gray-200 bg-white shadow-sm p-4

Truck Card:
- Layout: flex justify-between items-center
- Left: flex-1
  - Plate: text-sm font-semibold
  - Capacity: text-xs text-gray-500
  - Created: text-xs text-gray-400
- Right: flex gap-2
  - Edit button: variant-secondary size-sm
  - Delete button: variant-danger size-sm (icon only)
`

---

## Responsive Breakpoints Applied

### Mobile First (< 640px)
- Single column layouts
- Full-width cards
- Hamburger navigation
- Button sizes: sm/md
- Font sizes: xs/sm for labels
- Padding: px-4 py-4

### Tablet (640px - 1023px)
- Two-column layouts where appropriate
- Cards in grid-cols-2 md:grid-cols-3
- Visible top navigation (no hamburger)
- Mix of sm and md spacing
- Text: sm/base

### Desktop (>= 1024px)
- Three+ column layouts
- Sidebar navigation visible
- Full content width (with max-w constraint)
- Consistent lg padding
- Larger component sizes
- Text: base/lg

---

## Animation & Transitions

### Button States
- Duration: 150ms
- Property: background-color, box-shadow
- Timing: ease-in-out
- Example: transition-colors duration-150

### Hover States
- Card shadow: shadow-sm -> shadow-md
- Translation: -translate-y-0.5 (2px up)
- Duration: 150ms
- Ring accent: ring-teal-200 on focus

### Responsive Behavior
- Hidden elements: hidden sm:block (mobile hidden, tablet visible)
- Visible on mobile: block sm:hidden
- No jarring jumps in grid columns (use proportional scaling)

---

## Dark Mode

All layouts support dark mode with Tailwind dark: prefix.

### Key Colors
- Background: dark:bg-gray-900 (page), dark:bg-gray-800 (cards)
- Text: dark:text-gray-100 (primary), dark:text-gray-400 (secondary)
- Borders: dark:border-gray-700
- Accents: dark:teal-400, dark:red-400, etc.

### Pattern
`jsx
<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
  <p className="text-gray-900 dark:text-gray-100">Primary text</p>
  <p className="text-gray-500 dark:text-gray-400">Secondary text</p>
</div>
`

---

## Common Issues & Fixes

**Issue: Layout shift when sidebar toggles**
- Fix: Use fixed width padding on main content, or CSS Grid

**Issue: Tables overflow on mobile**
- Fix: overflow-x-auto wrapper, min-w on table, allow horizontal scroll

**Issue: Cards feel cramped on mobile**
- Fix: Increase padding on small screens (p-4 sm:p-5 lg:p-6)

**Issue: Form labels too long on mobile**
- Fix: Use help text, tooltips; avoid inline labels on mobile

**Issue: Button spacing inconsistent**
- Fix: Always use gap-2 or gap-3 in flex containers, never hardcoded margins
