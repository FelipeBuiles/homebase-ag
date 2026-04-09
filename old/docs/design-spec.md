# HomeBase  
## Product & Agent Design Specification (Implementation-Agnostic)

---

## 1. Purpose of This Document

This document defines:

- **What HomeBase does** (features & capabilities)
- **Who does what** (user roles + system/agent roles)
- **How intelligence is structured** (agents, responsibilities, boundaries)
- **What “done” means** at the feature level

It **intentionally avoids**:
- Database schemas
- API shapes
- Frameworks
- Infrastructure decisions

This document is designed to be fed into tools that generate:
- PRDs
- Epics
- User stories
- Task lists
- Agent definitions

---

## 2. Product Vision

HomeBase is a **self-hosted, AI-first household management system** that helps a single household:

- Maintain a living inventory of physical possessions
- Manage groceries, pantry items, recipes, and meal planning
- Reduce friction, cognitive load, and food waste
- Retain full ownership and control of personal data

AI agents are **core participants**, not assistants: they maintain structure, suggest improvements, and keep the system healthy over time.

---

## 3. Product Scope (MVP-Oriented)

### In Scope
- Household inventory management
- Groceries, pantry, recipes, and meal planning
- AI-assisted data enrichment, normalization, and planning
- Human-in-the-loop review and approval
- Self-hosted, privacy-first usage
- Single household / single primary user

### Out of Scope (For Now)
- Payments, subscriptions, monetization
- Enterprise or multi-tenant support
- Insurance or external service integrations
- Native mobile apps
- Social features
- Legal or compliance guarantees

---

## 4. User Roles

### 4.1 Primary User: Household Owner
- Owns the system and the data
- Adds, edits, and reviews information
- Approves or rejects AI-proposed changes
- Uses the system for day-to-day household management

This role is assumed to be:
- Privacy-conscious
- Technically comfortable enough to self-host
- Interested in reducing manual effort

### 4.2 Future (Optional) Role: Household Member
*(Not required for MVP, but conceptually defined)*

- Views shared data (inventory, groceries, meal plans)
- May add items or mark groceries as completed
- Does **not** configure agents or system behavior

---

## 5. Core Domains & Features

### 5.1 Domain: Home Inventory

#### Core Capabilities
- Add items to an inventory
- Attach photos and descriptive metadata
- Organize items by location (rooms), category, and tags
- Search and filter inventory
- Export inventory data (later phase)

#### AI-Assisted Capabilities
- Suggest item categories
- Suggest likely room/location
- Extract meaning from photos and text
- Identify potential duplicates
- Highlight incomplete or low-quality entries

#### Definition of Done (Inventory Item)
An inventory item is considered “complete” when:
- It has a name
- It is assigned to a category or explicitly marked “uncategorized”
- It is associated with a location or explicitly marked “unknown”
- Any AI-suggested changes are reviewed

---

### 5.2 Domain: Groceries

#### Core Capabilities
- Create grocery lists
- Add, remove, and check off items
- Group items by category
- Maintain multiple lists if desired

#### AI-Assisted Capabilities
- Normalize item names (e.g., “tomatoes” vs “tomato”)
- Merge duplicates
- Suggest missing items based on meal plans or pantry state

#### Definition of Done (Grocery List)
A grocery list is considered “ready” when:
- Items are normalized
- Duplicates are resolved
- Quantities are clarified or intentionally left vague

---

### 5.3 Domain: Recipes

#### Core Capabilities
- Save recipes manually or from URLs
- Store ingredients and instructions
- Tag and search recipes

#### AI-Assisted Capabilities
- Parse recipes from URLs
- Normalize ingredient names
- Identify overlap with pantry contents
- Suggest recipe variations based on available ingredients

#### Definition of Done (Recipe)
A recipe is considered usable when:
- Ingredients are structured (even if quantities are free-text)
- Instructions are readable and complete
- Ingredients can be matched to grocery/pantry items

---

### 5.4 Domain: Pantry

#### Core Capabilities
- Track items currently in the household
- Track expiration dates when applicable
- Update quantities or usage

#### AI-Assisted Capabilities
- Detect expiring items
- Suggest recipes using expiring ingredients
- Identify over-stocked or rarely used items

#### Definition of Done (Pantry Item)
A pantry item is considered healthy when:
- It has a normalized name
- Its expiration status is known or explicitly unknown
- It participates in suggestions or planning workflows

---

### 5.5 Domain: Meal Planning

#### Core Capabilities
- Plan meals by day and meal type
- Associate meals with recipes or free-text meals

#### AI-Assisted Capabilities
- Generate grocery lists from meal plans
- Detect conflicts with pantry availability
- Suggest substitutions

#### Definition of Done (Meal Plan)
A meal plan is complete when:
- Each planned meal references a recipe or description
- Required ingredients are accounted for via pantry or grocery list

---

## 6. System Roles (Non-Human)

### 6.1 System Role: Event Producer
- Emits events when the user creates or modifies data
- Triggers agent workflows
- Ensures changes are observable and traceable

---

### 6.2 System Role: Review Gatekeeper
- Prevents AI agents from directly mutating data
- Requires explicit user approval
- Maintains an audit trail

---

## 7. AI Agent Roles

Agents are **narrowly scoped**, autonomous actors that:
- React to events or manual triggers
- Analyze relevant data
- Propose reversible changes
- Explain their reasoning

Agents **never** apply changes directly.

---

### 7.1 Agent Role: Inventory Enrichment Agent

**Purpose**  
Improve the quality and structure of inventory items.

**Responsibilities**
- Suggest category, tags, and location
- Identify likely duplicates
- Flag missing or ambiguous data

**Non-Responsibilities**
- Creating or deleting items
- Assigning monetary value without user confirmation

---

### 7.2 Agent Role: Ingredient Normalization Agent

**Purpose**  
Ensure consistent naming across groceries, pantry, and recipes.

**Responsibilities**
- Propose normalized names
- Identify equivalent ingredients
- Reduce duplication

**Non-Responsibilities**
- Changing quantities
- Inventing missing ingredients

---

### 7.3 Agent Role: Meal Planning Agent

**Purpose**  
Translate intent (meal plans) into actionable preparation.

**Responsibilities**
- Identify required ingredients
- Compare against pantry state
- Propose grocery list updates

**Non-Responsibilities**
- Automatically modifying lists
- Enforcing nutrition rules

---

### 7.4 Agent Role: Pantry Maintenance Agent

**Purpose**  
Keep pantry data relevant over time.

**Responsibilities**
- Highlight expiring items
- Suggest usage via recipes
- Identify stale or unused entries

**Non-Responsibilities**
- Deleting pantry items
- Sending notifications without approval

---

### 7.5 Agent Role: Data Quality & Maintenance Agent

**Purpose**  
Maintain long-term system health.

**Responsibilities**
- Detect duplicates
- Identify inconsistencies
- Propose cleanup operations

**Non-Responsibilities**
- Performing destructive actions
- Running without user visibility

---

## 8. Agent Interaction Rules

All agents must:
- Produce **proposals**, not mutations
- Provide a **human-readable rationale**
- Provide a **confidence level**
- Surface **uncertainty explicitly**
- Defer to user judgment

Agents may:
- Chain suggestions
- Recommend follow-up actions
- Request clarification

Agents must not:
- Override user decisions
- Hide or collapse multiple changes
- Assume intent without evidence

---

## 9. Human-in-the-Loop Review Model

### Review Flow
1. User performs an action or system emits an event
2. Agent analyzes context
3. Agent proposes changes
4. User:
   - Accepts all
   - Accepts selectively
   - Rejects with optional feedback

### Design Goal
The user should always be able to answer:  
> “What changed, why, and who suggested it?”

---

## 10. MVP Feature Cut (Non-Technical)

### MVP Phase 1: Inventory + Enrichment
- Add inventory items
- Upload photos
- View and search inventory
- Run enrichment agent
- Review/apply AI suggestions

### MVP Phase 2: Groceries + Recipes
- Grocery lists
- Recipe storage and import
- Ingredient normalization agent

### MVP Phase 3: Pantry + Meal Planning
- Pantry tracking
- Meal planning
- Pantry-aware suggestions

### MVP Phase 4: Maintenance & Trust
- Duplicate detection
- Data quality reports
- Long-running system health agents

---

## 11. Success Criteria (Non-Business)

- The system remains usable without AI
- AI measurably reduces manual work
- Agent behavior is understandable and debuggable
- Data quality improves over time
- The user trusts the system enough to keep using it

---

## 12. Positioning Statement

> **HomeBase is a self-hosted, AI-first household system where autonomous agents actively maintain structure, reduce friction, and surface insight — while always keeping humans in control.**
