export const normalizeField = (value: FormDataEntryValue | null, fallback: string) => {
  const trimmed = (value ?? "").toString().trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

export const toTitleCase = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed
    .toLowerCase()
    .replace(/(^|[\s/\-])\w/g, (match) => match.toUpperCase());
};

export const normalizeCategory = (value: FormDataEntryValue | null) => {
  const trimmed = (value ?? "").toString().trim();
  if (!trimmed) return null;
  return toTitleCase(trimmed);
};

export const normalizeCategories = (values: FormDataEntryValue[]) =>
  values
    .map((value) => toTitleCase(value.toString()))
    .filter((value) => value.length > 0);

export const normalizeRoomName = (value: FormDataEntryValue | null) => {
  const trimmed = (value ?? "").toString().trim();
  if (!trimmed) return null;
  return toTitleCase(trimmed);
};

export const normalizeTagName = (value: FormDataEntryValue | null) => {
  const trimmed = (value ?? "").toString().trim();
  if (!trimmed) return null;
  return toTitleCase(trimmed);
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

export const isInventoryComplete = (item: { name?: string | null; categories?: string[] | null; rooms?: unknown[] | null }) => {
  if (!item.name) return false;
  const categories = item.categories ?? [];
  const rooms = item.rooms ?? [];
  if (categories.length === 0) return false;
  if (rooms.length === 0) return false;
  return true;
};

export const isInventoryEnrichmentPending = (item: {
  attachments?: unknown[] | null;
  categories?: string[] | null;
  rooms?: unknown[] | null;
}) => {
  const attachments = item.attachments ?? [];
  const categories = item.categories ?? [];
  const rooms = item.rooms ?? [];
  if (attachments.length === 0) return false;
  return categories.length === 0 || rooms.length === 0;
};

export const isInventoryStatusMatch = (
  item: {
    name?: string | null;
    categories?: string[] | null;
    rooms?: unknown[] | null;
    attachments?: unknown[] | null;
    enrichmentStatus?: string | null;
  },
  status: string
) => {
  const categories = item.categories ?? [];
  const rooms = item.rooms ?? [];
  const attachments = item.attachments ?? [];
  const complete = isInventoryComplete(item);

  if (status === "complete") return complete;
  if (status === "incomplete") return !complete;
  if (status === "needs-category") return categories.length === 0;
  if (status === "needs-room") return rooms.length === 0;
  if (status === "needs-enrichment") return attachments.length > 0 && !complete;
  if (status === "enrichment-failed") return item.enrichmentStatus === "failed";
  return true;
};
