import { Badge } from "@/components/ui/badge";

type PantryStatus = "in_stock" | "out_of_stock" | "consumed" | "discarded" | string;

type StatusConfig = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
};

const STATUS_MAP: Record<string, StatusConfig> = {
  in_stock: { label: "In stock", variant: "outline" },
  out_of_stock: { label: "Out of stock", variant: "secondary" },
  consumed: { label: "Consumed", variant: "secondary" },
  discarded: { label: "Discarded", variant: "destructive" },
};

export const PantryStatusBadge = ({ status }: { status: PantryStatus }) => {
  const config = STATUS_MAP[status] ?? { label: "Unknown", variant: "outline" };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};
