# PRD-Ready Slice List — HomeBase

This document lists **PRD-ready slices**, organized by domain.  
Each slice is intentionally scoped so it can be fed directly into a PRD generator to produce goals, user stories, acceptance criteria, and task breakdowns.

---

## DOMAIN: Foundation & Trust

### Slice F1 — Single-User System Setup
**Intent:** Allow a household owner to run and use HomeBase as a private, self-contained system.

**Core Value**
- User can access the system and begin managing data
- Ownership and control are explicit

---

### Slice F2 — Human-in-the-Loop Review Framework
**Intent:** Ensure all AI actions are reviewable, reversible, and understandable.

**Core Value**
- User trusts AI output
- System never mutates data without consent

---

### Slice F3 — Agent Activity & Audit History
**Intent:** Make agent behavior observable and explainable over time.

**Core Value**
- User can see what agents did, why, and when
- Enables debugging and learning

---

## DOMAIN: Home Inventory

### Slice I1 — Inventory Item Creation & Editing
**Intent:** Allow the user to create and maintain inventory items.

**Core Value**
- User can capture what they own
- System becomes a source of truth

---

### Slice I2 — Inventory Organization (Rooms, Categories, Tags)
**Intent:** Allow the user to meaningfully structure inventory data.

**Core Value**
- Items are findable
- Inventory reflects physical reality

---

### Slice I3 — Inventory Search & Filtering
**Intent:** Enable fast retrieval of items from a growing inventory.

**Core Value**
- User can find what they need under stress or time pressure

---

### Slice I4 — Inventory Photo Attachment
**Intent:** Allow visual documentation of items.

**Core Value**
- Improves recall and evidence
- Enables AI enrichment

---

### Slice I5 — Inventory Enrichment Agent
**Intent:** Reduce manual categorization and metadata entry.

**Core Value**
- AI suggests categories, tags, and locations
- User effort decreases over time

---

### Slice I6 — Inventory Duplicate Detection
**Intent:** Prevent clutter and confusion in inventory data.

**Core Value**
- Cleaner inventory
- Fewer redundant entries

---

## DOMAIN: Groceries

### Slice G1 — Grocery List Creation & Management
**Intent:** Enable creation and maintenance of grocery lists.

**Core Value**
- User can plan shopping effectively
- Lists reflect real needs

---

### Slice G2 — Grocery Item Normalization Agent
**Intent:** Ensure consistent naming across grocery items.

**Core Value**
- No duplicate or ambiguous entries
- Lists become reusable and intelligible

---

### Slice G3 — Grocery List Optimization
**Intent:** Reduce redundant purchases and list clutter.

**Core Value**
- Shorter, clearer shopping trips
- Less cognitive overhead

---

## DOMAIN: Recipes

### Slice R1 — Recipe Storage & Organization
**Intent:** Allow users to save and manage recipes.

**Core Value**
- Centralized recipe knowledge
- Recipes are searchable and reusable

---

### Slice R2 — Recipe URL Import
**Intent:** Reduce friction in adding recipes from the web.

**Core Value**
- Faster recipe capture
- Less manual transcription

---

### Slice R3 — Recipe Ingredient Structuring
**Intent:** Convert recipe ingredients into structured, comparable data.

**Core Value**
- Recipes integrate with groceries and pantry
- Ingredients become actionable

---

## DOMAIN: Pantry

### Slice P1 — Pantry Item Tracking
**Intent:** Track what food is already available at home.

**Core Value**
- Avoid overbuying
- Increase visibility into supplies

---

### Slice P2 — Pantry Expiration Awareness
**Intent:** Track and surface expiring pantry items.

**Core Value**
- Reduced food waste
- Proactive usage

---

### Slice P3 — Pantry Maintenance Agent
**Intent:** Keep pantry data fresh and relevant.

**Core Value**
- Less stale data
- System stays accurate over time

---

## DOMAIN: Meal Planning

### Slice M1 — Meal Plan Creation
**Intent:** Allow users to plan meals over time.

**Core Value**
- Intentional cooking
- Reduced daily decision fatigue

---

### Slice M2 — Meal Plan → Grocery Translation
**Intent:** Convert meal plans into actionable grocery needs.

**Core Value**
- Planning becomes execution
- Fewer missed ingredients

---

### Slice M3 — Pantry-Aware Meal Suggestions
**Intent:** Suggest meals based on pantry state.

**Core Value**
- Efficient use of existing food
- Reduced waste

---

## DOMAIN: Data Quality & Long-Term Health

### Slice D1 — Data Quality Report
**Intent:** Surface inconsistencies and gaps across the system.

**Core Value**
- User awareness of system health
- Encourages cleanup

---

### Slice D2 — Maintenance & Cleanup Agent
**Intent:** Proactively propose system improvements.

**Core Value**
- Long-term usability
- System improves without heavy manual effort

---

## Optional Meta-Slice (Agentic Work)

### Slice X1 — Agent Prompt & Behavior Configuration
**Intent:** Allow tuning and iteration on agent behavior.

**Core Value**
- Faster agent experimentation
- Better learning loops

---

## Suggested PRD Generation Order

1. F1 → F2 → F3  
2. I1 → I2 → I4 → I5  
3. G1 → G2  
4. R1 → R2 → R3  
5. P1 → P2  
6. M1 → M2  
7. D1 → D2  

---
