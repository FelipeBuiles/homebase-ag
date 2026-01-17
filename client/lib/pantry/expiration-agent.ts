import { getExpiringWindow } from "@/lib/pantry/queries";

export const buildExpiringPantryWhere = (now: Date, warningDays: number) => {
  const { start, end } = getExpiringWindow(now, warningDays);
  return {
    status: "in_stock",
    expirationDate: {
      gte: start,
      lte: end,
    },
  };
};
