export type ExpirationStatusLevel = "good" | "warning" | "expired" | "unknown";

type ExpirationStatus = {
  label: string;
  level: ExpirationStatusLevel;
  days: number | null;
};

export const getEffectiveExpirationDate = (
  expirationDate?: Date | null,
  openedDate?: Date | null
) => {
  if (openedDate) return openedDate;
  return expirationDate ?? null;
};

export const getExpirationStatus = (
  expirationDate: Date | null,
  now: Date,
  warningDays: number
): ExpirationStatus => {
  if (!expirationDate) {
    return { label: "Unknown", level: "unknown", days: null };
  }

  const diffMs = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: "Expired", level: "expired", days: diffDays };
  }

  if (diffDays <= warningDays) {
    return { label: "Expiring Soon", level: "warning", days: diffDays };
  }

  return { label: "Good", level: "good", days: diffDays };
};
