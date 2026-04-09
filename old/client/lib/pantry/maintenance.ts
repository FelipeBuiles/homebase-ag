type MaintenanceInputItem = { id: string; name: string; status: string };

export const buildPantryMaintenanceInput = (items: MaintenanceInputItem[]) => {
  return items.map((item) => `${item.id}: ${item.name} (${item.status})`).join("\n");
};
