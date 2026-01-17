import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PantryStatusBadge } from "@/components/pantry/PantryStatusBadge";
import { Calendar, Clock, MapPin, Package } from "lucide-react";
import type { ExpirationStatusLevel } from "@/lib/pantry/expiration";

export type PantryItemRowProps = {
  item: {
    id: string;
    name: string;
    quantity: string | null;
    unit: string | null;
    location: string;
    category: string | null;
    expirationDate: Date | null;
    openedDate: Date | null;
    status: string;
  };
  expiration: {
    label: string;
    level: ExpirationStatusLevel;
    days: number | null;
  };
  actions?: React.ReactNode;
};

const expirationVariantByLevel: Record<ExpirationStatusLevel, "default" | "secondary" | "destructive" | "outline"> = {
  good: "outline",
  warning: "secondary",
  expired: "destructive",
  unknown: "outline",
};

export const PantryItemRow = ({ item, expiration, actions }: PantryItemRowProps) => {
  return (
    <Card className="group relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{item.name}</CardTitle>
          <div className="flex items-center gap-2">
            <PantryStatusBadge status={item.status} />
            <Badge variant={expirationVariantByLevel[expiration.level]}>{expiration.label}</Badge>
          </div>
        </div>
        <div className="text-sm text-muted-foreground font-mono tabular-nums">
          {item.quantity || "-"} {item.unit || ""}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin size={14} />
            <span>{item.location}</span>
          </div>
          {item.expirationDate && (
            <div className="flex items-center gap-2">
              <Calendar size={14} />
              <span>Expires: {item.expirationDate.toLocaleDateString()}</span>
            </div>
          )}
          {item.openedDate && (
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>Opened: {item.openedDate.toLocaleDateString()}</span>
            </div>
          )}
          {item.category && (
            <div className="flex items-center gap-2">
              <Package size={14} />
              <span>{item.category}</span>
            </div>
          )}
        </div>
        {actions && (
          <div className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
