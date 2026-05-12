# Design System: Clarity Issues & Concept Definitions

## Visual & UX Problems Found

### 1. **Unclear Information Hierarchy**
- Admin dashboard has 6 stat cards with equal visual weight; users don't know which metrics matter most
- Timeslot status (available/reserved/full) not visually distinguished enough in tables
- Quick links on dashboard (grid of 6 items) feel overwhelming—too many entry points

### 2. **Confusing Technical Terminology**
- "Cota" vs "Timeslot" vs "Horário" used interchangeably in UI (see Dashboard, Timeslots pages)
- "Operação" appears without context; unclear if it refers to type of operation or status
- "Reserva" and "Frete" used differently but look related
- Domain language not translated to user language

### 3. **Inconsistent Color Usage**
- Status badges use 6 different colors (neutral, info, success, warning, danger, violet) without clear meaning
- Accent colors in dashboard cards (teal, emerald, sky, orange) decorative, not semantic
- Stat cards use left border with color keys; quick links use top border—inconsistent pattern
- No visual system for severity (error vs warning vs info)

### 4. **Visual Clutter in Tables**
- Timeslots table: 7 columns, tiny text, small badges, hard to scan
- Occupancy progress bar doesn't stand out; row hover state barely visible
- Actions column truncated; delete/edit buttons not obvious
- Status and visibility are separate columns when they could be combined

### 5. **Inconsistent Component Spacing**
- Button sizes: sm (3px/1.5px), md (4px/2px), lg (5px/2.5px) padding doesn't follow clear scale
- Card padding varies: dashboard cards use p-5 (20px), modals use px-6 py-5 (inconsistent)
- Form fields have mt-1 for labels, but modal footers have py-4 border—spacing not systematic
- Page content uses px-4 sm:px-6 lg:px-8, but some sections ignore it

### 6. **Hidden or Unclear Actions**
- Delete buttons relegated to table actions column; users must find them
- Form submit buttons not always clearly labeled ("Save" vs "Create")
- Modal footer action buttons need better visual priority
- No confirmation dialogs visible in most flows

### 7. **Poor Visual Feedback**
- Button loading state uses spinner but no text feedback
- Form error states exist (red border, red bg) but not prominent
- No toast/flash message animation or clear success feedback
- Disabled buttons just opacity—no clear "why disabled" explanation

### 8. **Responsive Design Inconsistencies**
- Dashboard stat cards: grid-cols-2 on mobile, 4 on desktop (sudden jump, no 3-column state)
- Quick links: grid-cols-2 md:grid-cols-3 (2→3 jump), no mobile optimization
- Tables not mobile-friendly; overflow hidden, text compressed
- Modal widths and form layouts not tested on smaller screens

---

## Concept Definitions & Translations

### Core Business Terms

| PT Term | EN Translation | Definition | UI Label | Example |
|---------|-----------------|-----------|----------|---------|
| **Cota** | Time Slot | A reserved time window for a truck to load/unload at the dock | Cota | "Cota 2025-05-15 08:00–10:00" |
| **Timeslot** | Time Slot (same as Cota) | Same as Cota—technical database term; should be unified in UI | —hidden— | Used in route names, database |
| **Reserva** | Reservation | A client's booking of a Cota | Reserva | "3 reservas nesta cota" |
| **Operação** | Operation Type | The type of work (loading, unloading, cross-dock, etc.) | Operação | "Carregamento" |
| **Frete** | Freight / Load | A shipment being transported; includes truck, cargo, status | Frete | "Frete ID 12345" |
| **Doca** | Dock | A physical loading bay / platform | Doca | "Doca 1, Doca 2" |
| **Pátio** | Yard / Lot | The entire facility; used in "Painel do Pátio" (Yard Board) | Pátio | "Painel do Pátio" |

### User Roles

| Role | Definition | Primary Tasks |
|------|-----------|---|
| **Admin** | System administrator; manages cotas, docks, employees | Create/close cotas; assign docks; view analytics |
| **Client/Transportadora** | Trucker/transportation company; books cotas | Find available cotas; make reservations; track status |

### Status Values

| Portuguese | English | Color | When It Occurs | User Action |
|-----------|---------|-------|---|---|
| **Disponível** | Available | green/emerald | Cota created, no reservations yet | Click to reserve |
| **Reservado** | Reserved | blue/sky | 1+ reservations, capacity not full | Can still reserve if slots available |
| **Lotado** | Full | orange/amber | Capacity reached | Cannot reserve; user must wait |
| **Fechado** | Closed | gray | Admin closes cota manually | Cannot reserve |
| **Expirado** | Expired | red | Time window passed | Readonly display only |

---

## Impact on User Experience

**Admin Users:**
- Struggle to find actions (edit/delete buried in table)
- Can't quickly distinguish cota status from visual feedback alone
- Overwhelmed by dashboard metrics (don't know what to focus on)
- Unclear what "operação" types exist and when to use them

**Client Users:**
- Can't easily find available cotas due to unclear filtering
- Don't understand the difference between "Cota" and "Reserva"
- Confused by status badge colors; don't map to meaning
- Don't see clear call-to-action for making a reservation

---

## Design System Goals

1. **Unified Language**: Replace "Cota/Timeslot/Horário" with single term
2. **Visual Hierarchy**: Stat cards, buttons, actions clearly prioritized
3. **Semantic Colors**: Status = color; error/success/warning predictable
4. **Consistent Spacing**: 4px baseline grid throughout
5. **Clear Actions**: Buttons always obvious; modals always clear
6. **Mobile-Ready**: Responsive grids that don't jump
7. **Accessible Feedback**: Forms show errors clearly; loading states visible
