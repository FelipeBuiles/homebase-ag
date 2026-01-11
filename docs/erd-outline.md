# High-Level ERD Outline

This is a high-level entity/relationship outline to anchor schema design. Field-level detail intentionally omitted.

## Core Entities
- Household (single instance)
- User (owner)

## Inventory Domain
- InventoryItem
- InventoryCategory (predefined)
- InventoryRoom (user-defined)
- InventoryTag (user-defined)
- InventoryAttachment (photo/video)

## Grocery Domain
- GroceryList
- GroceryItem

## Recipe Domain
- Recipe
- RecipeIngredient (structured)
- RecipeTag
- RecipeCategory

## Pantry Domain
- PantryItem

## Meal Planning
- MealPlan (week)
- MealPlanSlot

## Agents & Review
- Agent
- AgentConfig (versioned)
- AgentConfigVersion
- Proposal (per agent run)
- ProposalChange (grouped changes)
- ReviewDecision
- AuditEntry

## Data Quality
- DataQualityReport
- DataQualityIssue
- BulkFixSuggestion

## Relationships (High-Level)
- Household 1:1 User (owner)
- Household 1:N InventoryItem
- InventoryItem N:1 InventoryCategory
- InventoryItem N:M InventoryRoom
- InventoryItem N:M InventoryTag
- InventoryItem 1:N InventoryAttachment
- Household 1:N GroceryList
- GroceryList 1:N GroceryItem
- Household 1:N Recipe
- Recipe 1:N RecipeIngredient
- Recipe N:M RecipeTag
- Recipe N:M RecipeCategory
- Household 1:N PantryItem
- PantryItem optional N:1 InventoryItem
- Household 1:N MealPlan
- MealPlan 1:N MealPlanSlot
- MealPlanSlot optional N:1 Recipe
- Agent 1:N AgentConfigVersion
- Agent 1:N Proposal
- Proposal 1:N ProposalChange
- Proposal 1:1 ReviewDecision
- Proposal 1:N AuditEntry
- DataQualityReport 1:N DataQualityIssue
- DataQualityIssue 0:N BulkFixSuggestion

## Notes
- Single-household, single-owner model (no multi-tenant).
- Proposal/Review/Audit models are shared across agents and bulk fixes.
- Many-to-many relationships likely require join tables.
