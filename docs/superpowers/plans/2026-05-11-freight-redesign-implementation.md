# Freight Management Redesign - Implementation Plan

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to execute this plan task-by-task.

**Goal:** Redesign Admin and Client interfaces to improve visual clarity and flow usability, resolving confusion in current UI/UX.

**Architecture:** Three iterative phases executed with Claude CLI:
1. **Phase 1 (Sem 1)**: Analyze current problems, define design system, document clarity requirements
2. **Phase 2 (Sem 2-3)**: Implement Admin redesign with new design system
3. **Phase 3 (Sem 3-4)**: Implement Client redesign with same design system

**Tech Stack:** Laravel 12, React 18, Inertia.js, Tailwind CSS, existing components (Button, Modal, Card, Table)

---

## File Structure

### New Files (Created in Phase 1)

- `docs/design-system/CLARITY.md` — Concept definitions + problem audit
- `docs/design-system/DESIGN-TOKENS.md` — Colors, typography, spacing, component library
- `docs/design-system/ADMIN-LAYOUT.md` — Admin navigation + layout structure
- `docs/design-system/CLIENT-LAYOUT.md` — Client navigation + layout structure

### Modified Files (Phases 2-3)

**Admin Components:**
- `resources/js/Pages/Admin/Dashboard.jsx`
- `resources/js/Pages/Admin/Timeslots/Index.jsx`
- `resources/js/Pages/Admin/Timeslots/Create.jsx`
- `resources/js/Pages/Admin/Timeslots/Edit.jsx`
- `resources/js/Pages/Admin/Freights/Index.jsx`
- `resources/js/Pages/Admin/Clients/Index.jsx`

**Client Components:**
- `resources/js/Pages/Client/Dashboard.jsx`
- `resources/js/Pages/Client/Timeslots/Index.jsx`
- `resources/js/Pages/Client/Timeslots/Search.jsx`
- `resources/js/Pages/Client/Reservas/Index.jsx`
- `resources/js/Pages/Client/Trucks/Index.jsx`

**Shared Components:**
- `resources/js/Components/Button.jsx`
- `resources/js/Components/Card.jsx`
- `resources/js/Components/Modal.jsx`
- `resources/js/Components/Badge.jsx`
- `resources/js/Components/Navigation.jsx`

---

## Task Breakdown

### Phase 1: Analysis & Design System (1 week)

#### Task 1: Create Prompt + Run Phase 1 Analysis

**Files:**
- Create: `docs/prompts/PHASE1-ANALYSIS.md` — Analysis prompt for Claude CLI
- Create: `docs/design-system/CLARITY.md` — Output from analysis

**Prompt for Claude CLI:**

```markdown
# PHASE 1: Redesign Analysis & Design System Definition

## Context
System: Freight Management (B2B SaaS for cerealistas)
Current Problem: Visual confusion, cluttered UI, unclear concepts
Goal: Define design system + identify clarity issues

## Your Task

You are analyzing the Freight Management system to:
1. Identify visual/UX problems
2. Define clarity requirements
3. Create design system (tokens, components, structure)
4. Document for phases 2-3

## Step 1: Visual Audit

Review these paths and identify problems:
- `resources/js/Pages/Admin/` — All admin pages
- `resources/js/Pages/Client/` — All client pages
- `resources/js/Components/` — Current components

Report:
- Cluttered sections (too much info)
- Unclear hierarchy (what's important?)
- Confusing terms (quota vs timeslot vs reserva?)
- Inconsistent patterns (buttons, colors, spacing)
- Actions hidden or unclear

## Step 2: Create Design System

Define:

### Colors
- Primary: [specific hex + usage]
- Secondary: [specific hex + usage]
- Success, warning, danger: [specific hex]
- Backgrounds, borders: [specific hex]

### Typography
- Headings: size + weight + usage
- Body: size + weight + usage
- Labels: size + weight + usage

### Spacing
- Grid: 4px, 8px, 16px, 24px, 32px
- Usage for each level

### Components Library
For each component, define:
- Purpose
- States (default, hover, active, disabled)
- Example code snippet

Components: Button, Card, Modal, Badge, Table, Navigation

## Step 3: Clarify Concepts

Map these confusing terms:
- Timeslot = ?
- Quota = ?
- Reserva = ?
- Operação = ?
- Cota = ?

Define clear, simple explanations for each.

## Step 4: Document Layout Strategy

Admin layout:
- Primary navigation (left or top?)
- Dashboard layout
- CRUD page structure

Client layout:
- Primary navigation
- Dashboard layout
- Search + reserve flow

## Deliverable

Write 4 markdown files:
1. `docs/design-system/CLARITY.md` — Problems + definitions
2. `docs/design-system/DESIGN-TOKENS.md` — Colors + typography + spacing
3. `docs/design-system/COMPONENTS.md` — Component library
4. `docs/design-system/LAYOUTS.md` — Admin + Client layouts

Format each document clearly with headings, examples, color swatches.
```

**Steps:**

- [ ] **Step 1: Create prompt file**

Create file: `docs/prompts/PHASE1-ANALYSIS.md`  
Copy the prompt above into this file.

- [ ] **Step 2: Run Claude CLI with Phase 1 prompt**

```bash
cd c:\Users\joper\OneDrive\Documentos\freight-management
claude --model claude-opus-4-7 < docs/prompts/PHASE1-ANALYSIS.md > docs/design-system/PHASE1-OUTPUT.txt
```

**Note:** Opus is recommended for design work (better creative output).

- [ ] **Step 3: Verify Phase 1 output**

Check that `docs/design-system/PHASE1-OUTPUT.txt` contains:
- Design tokens (colors, typography, spacing)
- Component library definitions
- Layout strategies
- Concept clarifications

- [ ] **Step 4: Extract design documentation**

Claude will output answers. Manually extract into separate files:
- `docs/design-system/CLARITY.md`
- `docs/design-system/DESIGN-TOKENS.md`
- `docs/design-system/COMPONENTS.md`
- `docs/design-system/LAYOUTS.md`

- [ ] **Step 5: Commit Phase 1 analysis**

```bash
git add docs/design-system/ docs/prompts/PHASE1-ANALYSIS.md
git commit -m "phase1: design system analysis and definitions"
```

**Validation:**
- All 4 design system files exist
- Design tokens are specific (hex colors, px sizes, not vague)
- Component library has examples
- Layouts are documented

---

### Phase 2: Admin Redesign (2 weeks)

#### Task 2: Generate Admin Redesign with Claude CLI

**Files:**
- Create: `docs/prompts/PHASE2-ADMIN.md` — Admin redesign prompt
- Modify: All admin pages (listed above)
- Modify: Shared components if needed

**Prompt for Claude CLI:**

```markdown
# PHASE 2: Admin Interface Redesign

## Context
You are redesigning the Admin interface for clarity and usability.

Input:
- Design system from Phase 1: `docs/design-system/`
- Current admin pages: `resources/js/Pages/Admin/`
- Current components: `resources/js/Components/`

Goal:
Redesign 6 admin pages using the design system, improving clarity and workflow.

## Pages to Redesign

### 1. Dashboard (Agenda Operacional)

Current: Likely cluttered with all freights + all details
Redesign:
- Show today's timeline (8 hourly slots)
- Group by status: loading, unloading, completed, cancelled
- Each freight card shows: placa, cliente, status, next action
- Action buttons are visible (approve, reject, finalize)
- Remove: unnecessary details, past dates

Layout:
```
[Header: Date + Quick Stats]
[Filters: Date, Status]
[Timeline: Hourly slots with freight cards]
  [Card] Placa ABC | Cliente X | Loading | [Approve] [Reject]
  [Card] Placa XYZ | Cliente Y | Unloading | [Finalize]
[Sidebar: Pending actions count]
```

### 2. Timeslots Index

Current: Likely a table with all columns
Redesign:
- Clear columns: Date | Time | Local | Capacity | Status | Actions
- Status badges: Open (green), Full (gray), Restricted (blue)
- Visible actions: Edit, Delete, View Reservas
- No horizontal scroll (mobile friendly)
- Pagination if > 20

### 3. Timeslot Create/Edit

Current: Likely form with many fields
Redesign:
- Group fields logically:
  - **Básico**: Date, Time, Duration
  - **Capacidade**: Max trucks, Max weight
  - **Restrições**: Public or Restricted, Linked clients
- Clear labels + help text
- Save/Cancel buttons at bottom

### 4. Freights Index

Current: Likely a complex table
Redesign:
- Filters at top: Date range, Status, Client
- Card view or simplified table:
  - Placa | Cliente | Timeslot | Status | Progress | Actions
  - Status colors: loading (blue), unloading (orange), completed (green), cancelled (red)
- Actions visible: View, Approve, Finalize, Add Attachment

### 5. Clients Index

Current: Simple CRUD
Redesign:
- Table: Name | Contact | Trucks | Active Reservas | Actions
- Actions: Edit, View reservas, Delete
- Search bar at top

### 6. Audit Log (if using)

Current: Might not exist or be hidden
Redesign:
- Simple timeline: User | Action | Date | Target
- Filterable by date/action

## Deliverable

For each page:
1. Provide redesigned React component code
2. Use design tokens from Phase 1
3. Use Tailwind classes
4. Ensure mobile responsive
5. Keep existing functionality (no removed features)

Code should be production-ready.
```

**Steps:**

- [ ] **Step 1: Create Phase 2 prompt**

Create file: `docs/prompts/PHASE2-ADMIN.md`  
Copy prompt above (adjust based on Phase 1 output).

- [ ] **Step 2: Run Claude CLI for Admin redesign**

```bash
claude --model claude-opus-4-7 < docs/prompts/PHASE2-ADMIN.md > docs/design-output/PHASE2-ADMIN-CODE.txt
```

- [ ] **Step 3: Extract generated code**

Claude will output React components. Extract each and save:
- `resources/js/Pages/Admin/Dashboard.jsx`
- `resources/js/Pages/Admin/Timeslots/Index.jsx`
- `resources/js/Pages/Admin/Timeslots/Create.jsx`
- `resources/js/Pages/Admin/Timeslots/Edit.jsx`
- `resources/js/Pages/Admin/Freights/Index.jsx`
- `resources/js/Pages/Admin/Clients/Index.jsx`

- [ ] **Step 4: Test Admin pages locally**

```bash
npm run dev
# Open http://localhost:8000
# Login as admin@example.com / password
# Check each page:
#   - No console errors
#   - Responsive on mobile (F12 dev tools)
#   - Buttons work
#   - Data displays correctly
```

- [ ] **Step 5: Validate against design system**

Check each page uses:
- Correct colors (from DESIGN-TOKENS.md)
- Correct typography (sizes, weights)
- Correct spacing (8px grid)
- Consistent with LAYOUTS.md

- [ ] **Step 6: Commit Phase 2**

```bash
git add resources/js/Pages/Admin/ resources/js/Components/
git commit -m "phase2: admin interface redesign for clarity"
```

**Validation:**
- All 6 admin pages display correctly
- No console errors
- Responsive on mobile
- All existing functionality works
- Design tokens applied correctly

---

### Phase 3: Client Redesign (1-2 weeks)

#### Task 3: Generate Client Redesign with Claude CLI

**Files:**
- Create: `docs/prompts/PHASE3-CLIENT.md` — Client redesign prompt
- Modify: All client pages (listed above)

**Prompt for Claude CLI:**

```markdown
# PHASE 3: Client Interface Redesign

## Context
You are redesigning the Client interface for clarity and usability.

Input:
- Design system from Phase 1: `docs/design-system/`
- Current client pages: `resources/js/Pages/Client/`
- Admin redesign (Phase 2) for consistency

Goal:
Redesign 5 client pages using the design system, focusing on reservation flow.

## Pages to Redesign

### 1. Dashboard

Current: Likely complex with many sections
Redesign:
- **Hero Section**: "Próximas Reservas" (next 3 reservations)
  - Card per reserva: Date | Time | Status | Next Action
  - Status colors: pending, approved, rejected, cancelled
- **Quick Stats**: Total reservations this month, utilization
- **Recent Activity**: Last 5 actions

Layout:
```
[Header: Welcome, Username]
[Quick Stats: 3 cards with numbers]
[Próximas Reservas: 3 cards with actions]
[Recent Activity: Simple timeline]
```

### 2. Search Timeslots / Browse Available

Current: Likely complex form + results
Redesign:
- **Filters at top** (collapsible on mobile):
  - Data (date picker)
  - Horário (time range)
  - Local (dropdown if multiple)
  - [Search] button
- **Results**: Calendar or list view
  - Show available slots in green
  - Show full slots in gray
  - Click to reserve

### 3. Reserve (Modal/Page)

Current: Likely a form
Redesign:
- **Step 1**: Choose truck (from my trucks)
  - Dropdown with trucks
  - Show truck details
- **Step 2**: Confirm timeslot
  - Display: Date, Time, Local, Nota Fiscal required?
  - [Confirm Reserve] button
- **Step 3**: Success message
  - "Reserva criada! #RES-123"
  - Link to "Minhas Reservas"

### 4. My Reservas (Active Reservations)

Current: Likely a table
Redesign:
- **Filters**: Status (pending, approved, rejected, cancelled)
- **Cards or Table**:
  - Placa | Data | Horário | Status | Nota Fiscal | Actions
  - Status badges with colors
  - Actions: View, Cancelar, Upload Nota Fiscal
- **For each reserva**, show collapsible details:
  - Cliente name (admin-submitted)
  - Truck info
  - Nota Fiscal upload button

### 5. My Trucks (CRUD)

Current: Simple table
Redesign:
- **Table**: Placa | Capacity | Last Used | Actions
- **Create/Edit Modal**:
  - Placa
  - Capacity (weight)
  - Model/Year
  - [Save]
- **Delete confirmation**: "Tem certeza?"

## Deliverable

For each page:
1. Provide redesigned React component code
2. Use design tokens from Phase 1
3. Use Tailwind classes
4. Ensure mobile responsive (primary user device)
5. Keep existing functionality

Code should be production-ready.
```

**Steps:**

- [ ] **Step 1: Create Phase 3 prompt**

Create file: `docs/prompts/PHASE3-CLIENT.md`  
Copy prompt above (adjust based on Phase 1 + Phase 2 output).

- [ ] **Step 2: Run Claude CLI for Client redesign**

```bash
claude --model claude-opus-4-7 < docs/prompts/PHASE3-CLIENT.md > docs/design-output/PHASE3-CLIENT-CODE.txt
```

- [ ] **Step 3: Extract generated code**

Claude will output React components. Extract and save:
- `resources/js/Pages/Client/Dashboard.jsx`
- `resources/js/Pages/Client/Timeslots/Index.jsx`
- `resources/js/Pages/Client/Timeslots/Search.jsx`
- `resources/js/Pages/Client/Reservas/Index.jsx`
- `resources/js/Pages/Client/Trucks/Index.jsx`

- [ ] **Step 4: Test Client pages locally**

```bash
npm run dev
# Open http://localhost:8000
# Login as a client (from seeder)
# Check each page:
#   - No console errors
#   - Responsive on mobile
#   - Reservation flow works end-to-end
#   - Can upload nota fiscal
```

- [ ] **Step 5: Validate against design system**

Check each page uses:
- Correct colors (from DESIGN-TOKENS.md)
- Correct typography
- Correct spacing
- Consistent with LAYOUTS.md
- Consistent with Admin redesign (visual language)

- [ ] **Step 6: Commit Phase 3**

```bash
git add resources/js/Pages/Client/
git commit -m "phase3: client interface redesign for clarity"
```

**Validation:**
- All 5 client pages display correctly
- No console errors
- Mobile responsive (primary platform)
- Reservation flow works: search → reserve → manage
- Design tokens applied correctly
- Visual consistency with admin

---

## Post-Redesign: Testing & Handoff

#### Task 4: Full System Test & Documentation

**Steps:**

- [ ] **Step 1: Full flow testing (Admin)**

```bash
# Login as admin@example.com
# 1. Create timeslot
# 2. View dashboard
# 3. Approve a freight
# 4. Finalize operation
# 5. Check audit log

# Expected: No errors, clear flow, visual consistency
```

- [ ] **Step 2: Full flow testing (Client)**

```bash
# Login as a client
# 1. View dashboard
# 2. Search timeslots
# 3. Make reservation
# 4. Upload nota fiscal
# 5. View my reservas
# 6. Manage trucks

# Expected: Smooth flow, clear status, mobile-friendly
```

- [ ] **Step 3: Cross-browser test**

- Chrome (latest)
- Firefox
- Safari
- Mobile Safari (iPhone)
- Chrome Mobile (Android)

Expected: No layout breaks, readable, functional

- [ ] **Step 4: Write design documentation**

Create: `docs/REDESIGN-SUMMARY.md`

Content:
- What changed (visual + flow)
- Design system applied
- User impact
- Future maintenance notes

- [ ] **Step 5: Final commit**

```bash
git add docs/REDESIGN-SUMMARY.md
git commit -m "docs: redesign summary and implementation notes"
```

---

## Validation Checklist

**Phase 1:**
- [ ] Design system is specific (hex colors, px sizes)
- [ ] Concepts are clearly defined
- [ ] Layout strategy documented
- [ ] All 4 design docs exist

**Phase 2:**
- [ ] All 6 admin pages render correctly
- [ ] Design tokens applied
- [ ] No console errors
- [ ] Mobile responsive
- [ ] All existing functionality works

**Phase 3:**
- [ ] All 5 client pages render correctly
- [ ] Design tokens applied
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Reservation flow works end-to-end

**Overall:**
- [ ] Visual consistency across admin + client
- [ ] No regressions in existing features
- [ ] Documentation complete
- [ ] Code ready for production

---

## Execution Handoff Options

Plan is complete. Two ways to execute:

**Option A: Subagent-Driven (Recommended)**
- I dispatch a fresh Claude subagent per task
- Each subagent focuses on one phase
- I review after each phase before moving next
- Fast iteration, high quality

**Option B: Inline Execution**
- I execute all tasks in this session
- Checkpoints after each phase for your approval
- Sequential execution

**Which approach do you prefer?**
