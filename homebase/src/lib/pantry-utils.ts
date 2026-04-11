export type PantryLifecycleStatus = "in_stock" | "out_of_stock" | "consumed" | "discarded";
export type PantryStockSignal = "low" | "normal";

export const lifecycleStatusVariant: Record<PantryLifecycleStatus, "success" | "warning" | "default" | "danger"> = {
  in_stock: "success",
  out_of_stock: "warning",
  consumed: "default",
  discarded: "danger",
};

export const lifecycleStatusLabel: Record<PantryLifecycleStatus, string> = {
  in_stock: "In Stock",
  out_of_stock: "Out of Stock",
  consumed: "Consumed",
  discarded: "Discarded",
};

export type ExpiryStatus = "expired" | "expiring" | "fresh" | "none";

export function getExpiryStatus(expiresAt: Date | null | undefined, warnDays = 7): ExpiryStatus {
  if (!expiresAt) return "none";
  const now = new Date();
  const warnDate = new Date(now.getTime() + warnDays * 24 * 60 * 60 * 1000);
  if (expiresAt < now) return "expired";
  if (expiresAt < warnDate) return "expiring";
  return "fresh";
}

export const expiryStatusVariant: Record<ExpiryStatus, "danger" | "warning" | "success" | "default"> = {
  expired: "danger",
  expiring: "warning",
  fresh: "success",
  none: "default",
};

export const expiryStatusLabel: Record<ExpiryStatus, string> = {
  expired: "Expired",
  expiring: "Expiring soon",
  fresh: "Fresh",
  none: "No expiry date",
};

export function getPantryStockSignal(input: {
  quantity: number;
  unit?: string | null;
  status?: string | null;
}): PantryStockSignal {
  if ((input.status ?? "in_stock") !== "in_stock") return "normal";

  const quantity = input.quantity;
  if (quantity <= 0) return "low";

  const normalizedUnit = (input.unit ?? "").trim().toLowerCase();
  if (!normalizedUnit || ["count", "unit", "item", "items", "can", "cans", "jar", "jars", "bottle", "bottles"].includes(normalizedUnit)) {
    return quantity <= 1 ? "low" : "normal";
  }

  return quantity <= 0.5 ? "low" : "normal";
}
