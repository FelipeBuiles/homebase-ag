export const normalizeField = (value: FormDataEntryValue | null, fallback: string) => {
  const trimmed = (value ?? "").toString().trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

export const normalizeCategory = (value: FormDataEntryValue | null) => {
  const trimmed = (value ?? "").toString().trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const normalizeLocation = (value: FormDataEntryValue | null) => {
  const trimmed = (value ?? "").toString().trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const DEFAULT_INVENTORY_CATEGORIES = [
  "Appliances",
  "Electronics",
  "Furniture",
  "Tools",
  "Kitchen",
  "Bath",
  "Bedroom",
  "Living Room",
  "Office",
  "Outdoor",
  "Garage",
  "Seasonal",
  "Decor",
  "Lighting",
  "Cleaning",
  "Laundry",
  "Pets",
  "Kids",
  "Documents",
  "Miscellaneous",
];

export const isInventoryComplete = (item: { name?: string | null; category?: string | null; location?: string | null }) => {
  if (!item.name) return false;
  const category = item.category ?? "";
  const location = item.location ?? "";
  if (!category || category.toLowerCase() === "uncategorized") return false;
  if (!location || location.toLowerCase() === "unknown") return false;
  return true;
};
