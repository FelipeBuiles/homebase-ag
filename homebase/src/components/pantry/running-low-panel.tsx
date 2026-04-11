import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RestockButton } from "@/components/pantry/restock-button";
import { formatRelativeDate } from "@/lib/utils";

export function RunningLowPanel({
  items,
}: {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unit?: string | null;
    expiresAt?: Date | null;
  }>;
}) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Running Low</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-base-200 bg-base-50/60 p-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-base-200">
              <AlertCircle className="h-4 w-4 text-warning" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/pantry/${item.id}`} className="text-sm font-medium text-base-800 hover:text-accent-600">
                  {item.name}
                </Link>
                <Badge variant="warning" className="text-[10px]">Low stock</Badge>
              </div>
              <p className="text-xs text-base-500 mt-0.5">
                {item.unit ? `${item.quantity} ${item.unit} left` : `${item.quantity} left`}
                {item.expiresAt ? ` · ${formatRelativeDate(item.expiresAt)}` : ""}
              </p>
            </div>
            <RestockButton
              pantryItemId={item.id}
              name={item.name}
              quantity={item.quantity}
              unit={item.unit}
              compact
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
