type PantryStatusItem = { status: string };

export const filterInStockPantryItems = <T extends PantryStatusItem>(items: T[]) =>
  items.filter((item) => item.status === "in_stock");
