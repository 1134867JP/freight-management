# Component Library

## Button Component

### Purpose
Primary interaction element. Trigger actions, navigation, form submission.

### Variants

**Primary** (primary call-to-action)
- Background: teal-700 (#0D9488)
- Text: white
- Hover: teal-800
- Border: transparent
- Focus ring: teal-500
- Usage: Save, Create, Submit, Confirm

**Secondary** (safe/alternative action)
- Background: white
- Text: gray-700
- Border: gray-300
- Hover: gray-50
- Focus ring: gray-400
- Usage: Cancel, Edit, View more

**Danger** (destructive action)
- Background: red-600 (#DC2626)
- Text: white
- Hover: red-700
- Border: transparent
- Focus ring: red-500
- Usage: Delete, Remove, Cancel reservation

**Ghost** (low-priority action)
- Background: transparent
- Text: gray-600
- Border: transparent
- Hover: gray-100
- Focus ring: gray-400
- Usage: Inline actions, navigation

### Sizes

```
sm: px-3 py-1.5 text-xs (12px text)
md: px-4 py-2 text-sm (14px text) - default
lg: px-5 py-2.5 text-base (16px text)
```

### States

Default: visible, interactive
Hover: background darkens, subtle shadow
Active: slightly darker than hover
Disabled: opacity-50, cursor-not-allowed
Loading: spinner icon shown, text dims, button disabled
Focus: ring-2 ring-offset-2 ring-[color]-500

### Example Code

`jsx
import Button from '@/Components/UI/Button';

// Primary button
<Button variant="primary" size="md">
  Save Changes
</Button>

// Danger button
<Button variant="danger" onClick={handleDelete}>
  Delete
</Button>
`

---

## Card Component

### Purpose
Container for grouped content. Visual hierarchy through elevation (shadow), borders, spacing.

### Styling

Default: border-gray-200, shadow-sm
Elevated: shadow (no border)
Borderless: no border, no shadow, bg-gray-50

### States

Default: visible, readable
Hover: shadow-md, slight upward translation (-translate-y-0.5)
Active: ring-teal-200 (focus state)
Disabled: opacity-50 (entire card)

---

## Modal Component

### Purpose
Focused dialog for forms, confirmations, alerts. Blocks page interaction (modal backdrop).

### Styling

Backdrop: bg-black/50 (50% opacity black)
Panel: max-w-md (32rem), rounded-lg, bg-white, shadow-xl
Header: border-b border-gray-200, px-6 py-4
Body: px-6 py-5
Footer: border-t border-gray-200, px-6 py-4
Close button: top-right, gray-400, hover:gray-600

---

## Badge Component (StatusBadge)

### Purpose
Display short status labels, tags, or small indicators. Visual categorization.

### Tones

neutral: bg-gray-100 text-gray-600 (default, unspecified)
info: bg-blue-50 text-blue-700 (informational)
success: bg-green-50 text-green-700 (available, completed)
warning: bg-amber-50 text-amber-700 (full, pending)
danger: bg-red-50 text-red-700 (closed, error)
violet: bg-violet-50 text-violet-700 (reserved)

---

## Table Component

### Purpose
Display structured data in rows/columns. Sortable, filterable, paginated.

### Styling

Header: bg-gray-50, text-xs uppercase tracking-wide
Body: divide-y divide-gray-100
Hover row: bg-gray-50 (light background)
Padding: px-4 py-3 (header), px-4 py-5 (body)

### Responsive Handling

- Mobile: Set min-w to allow horizontal scroll
- Desktop: Table takes full width, columns have defined widths
- Very narrow: Consider stacked card layout as alternative

---

## Form Field Component

### Purpose
Wrapper for form inputs. Displays label, hint, error state, input field.

### Props

label: string (displayed above input)
required: boolean (adds red asterisk)
error: string (error message, turns border red)
hint: string (helper text below input, gray color)
disabled: boolean (disables input)
children: input element(s)

### Input Variants

Text Input: FormField.Input type="text"
Select Input: FormField.Select with option children
Textarea Input: FormField.Input as="textarea"

### States

Default: border-gray-300, bg-white
Focus: border-blue-500, ring-blue-200
Error: border-red-400, bg-red-50, ring-red-200
Disabled: opacity-50, cursor-not-allowed
Dark: border-gray-600, bg-gray-700, text-gray-100

---

## Navigation Component

### Purpose
Primary navigation. Sidebar or top bar for section access.

### NavLink Styling

Default: text-gray-700, hover:bg-gray-50, rounded-lg
Active: bg-teal-50, text-teal-700, border-l-4 border-teal-500
Dark: dark:text-gray-300, dark:hover:bg-gray-800

### Responsive

- Mobile: Hamburger toggle, slides in from left
- Desktop: Always visible, full sidebar width
- Tablet: Collapse to icons only, expand on hover

---

## Common Patterns

### Page Header
Title, subtitle, action buttons for primary action

### Empty State
Title, description, optional action button for next steps

### Loading State
Spinner with loading text message

### Flash Messages
Toast notifications for success/error/info feedback
