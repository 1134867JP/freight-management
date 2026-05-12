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
- esources/js/Pages/Admin/ — All admin pages
- esources/js/Pages/Client/ — All client pages
- esources/js/Components/ — Current components

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
1. docs/design-system/CLARITY.md — Problems + definitions
2. docs/design-system/DESIGN-TOKENS.md — Colors + typography + spacing
3. docs/design-system/COMPONENTS.md — Component library
4. docs/design-system/LAYOUTS.md — Admin + Client layouts

Format each document clearly with headings, examples, color swatches.
