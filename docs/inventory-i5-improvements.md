# Inventory I5 — Enrichment + UX Improvements

Design direction: Precision + Density (power-user, low-chrome, high-signal). Surface hierarchy via subtle borders and typographic weight, not decoration.

---

## 1) Enrichment Agent Prompt + Parser Spec

### Prompt (inventory enrichment)
```
You enrich inventory items with structured metadata and suggestions.
Return JSON only, no markdown.

Schema:
{
  "name": string | null,
  "brand": string | null,
  "model": string | null,
  "condition": "New"|"Like New"|"Good"|"Fair"|"Poor"|null,
  "categories": string[],
  "rooms": string[],
  "tags": string[],
  "serial": string | null,
  "confidenceByField": {
    "name"?: number,
    "brand"?: number,
    "model"?: number,
    "condition"?: number,
    "categories"?: number,
    "rooms"?: number,
    "tags"?: number,
    "serial"?: number
  },
  "rationaleByField": {
    "name"?: string,
    "brand"?: string,
    "model"?: string,
    "condition"?: string,
    "categories"?: string,
    "rooms"?: string,
    "tags"?: string,
    "serial"?: string
  }
}

Rules:
- Only choose categories and rooms from the provided lists.
- Tags are freeform but must be concise (1-2 words, Title Case).
- If uncertain, return empty arrays for categories/rooms/tags and null for strings.
- If the item name is generic (e.g., "New item"), do not invent a name without visual evidence; return null.
- Confidence is 0.0-1.0. Use <0.6 when uncertain.
```

### Input framing
Include these sections (explicitly labeled):
- ITEM: name, description
- EXISTING: categories, rooms, tags
- ALLOWED: categories, rooms
- VISUAL: summary from image recognition (labels, OCR snippets)

Example:
```
ITEM:
Name: Dyson Vacuum
Description: Cordless, purple

EXISTING:
Categories: 
Rooms: 
Tags: 

ALLOWED CATEGORIES:
Appliances, Electronics, ...

ALLOWED ROOMS:
Living Room, Garage, ...

VISUAL:
Labels: vacuum cleaner, cordless appliance
OCR: "Dyson V8"
```

### Parser rules
- Accept JSON with extra keys; ignore unknown.
- Normalize categories/rooms to title case, then validate against allowed lists.
- Tags: title-case + trim; de-dupe; limit 8.
- Enforce `1-3` categories and `0-2` rooms in proposals to keep review light.
- If only low confidence (<0.6) results, create a proposal with a “low confidence” label or skip entirely.

### Proposal strategy
- Create separate ProposalChange entries per field group to keep review granular:
  - Categories
  - Rooms
  - Tags
  - Name/Brand/Model/Condition/Serial
- If existing values are present, only propose a change if confidence >= 0.75.
- Attach raw agent output and visual evidence in `metadata`.

---

## 2) Image Recognition Pipeline (MVP + Next)

### MVP pipeline (local)
1. **Primary attachment selection**: use attachment `order=1` as the primary.
2. **Vision model**: use a local vision LLM via Ollama (e.g., LLaVA variant) to return:
   - Top labels (object/category)
   - Brand/model hints
   - Text hints (if visible)
3. **OCR pass**: run Tesseract on the image; keep top 3 lines with confidence.
4. **Synthesis step**: pass labels + OCR into the enrichment prompt as `VISUAL:`.

### Storage additions
- `InventoryAttachment.metadata` (JSON): `{ labels: string[], ocr: string[], model: string, confidence: number }`
- `InventoryItem.enrichmentState` (enum): `none | pending | enriched | failed`
- `InventoryItem.enrichedAt` (timestamp)

### UX effects
- Show “Enrichment pending” only when `enrichmentState=pending`.
- Surface “Enriched suggestions available” if a proposal exists.

### Next phase (optional)
- Duplicate detection via perceptual hash (pHash) + label similarity.
- Multi‑image fusion: aggregate tags/labels from all attachments.
- Extract structured serial numbers and warranty from OCR text.

---

## 3) Inventory UX Layout Mock (Precision + Density)

### Inventory list (grid + table toggle)
- **Header**: title, item count, view toggle (Grid/Table), primary action.
- **Filter bar**: chips row (Category, Room, Tag, Status, Has Photo) with an “Active filters” capsule list.
- **Grid card**: 4-column layout, 4px grid, 8px radius, border-only elevation, 12px padding.
  - Top: image (fixed 120px), overlay badge (Complete/Needs)
  - Middle: name (600 weight), room (muted)
  - Bottom: category chips + tag pills
- **Table view**: dense rows, monospace for dates/IDs, inline status pill.

### Detail view (split layout)
- **Left panel**: attachment gallery with primary badge, reorder, add action.
- **Right panel**: form fields, sticky save bar, completeness meter (2/3 fields).
- **Status ribbon**: “Needs room” / “Needs category” inline under title.

### Creation flow
- **Step 1: Capture**: large drag‑drop, “Add photos” focus, optional name.
- **Step 2: Details**: auto-populated fields + suggested tags.
- Preserve “Save photo only,” but label it “Save draft.”

### Component structure (suggested)
- `InventoryFilters` (chips, multiselects, active filters)
- `InventoryGridItem` / `InventoryRow`
- `InventoryStatusBadge`
- `InventoryCompletenessMeter`
- `AttachmentGallery`

---

## Optional Schema Extensions (Cost + Metrics)

Add to `InventoryItem`:
- `quantity Int?`
- `purchasePriceCents Int?`
- `currency String?`
- `purchaseDate DateTime?`
- `estimatedValueCents Int?`
- `condition String?`
- `serialNumber String?`
- `warrantyExpiresAt DateTime?`

Metrics use‑cases:
- Total value by room/category
- Depreciation snapshots over time
- “Unknown value” and “missing purchase date” completeness
