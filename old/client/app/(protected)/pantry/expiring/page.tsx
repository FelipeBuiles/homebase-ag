import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { getAppConfig } from "@/lib/settings";
import { getExpiringWindow } from "@/lib/pantry/queries";
import { buildExpiringPantryWhere } from "@/lib/pantry/expiration-agent";
import { getEffectiveExpirationDate, getExpirationStatus } from "@/lib/pantry/expiration";
import { PantryItemRow } from "@/components/pantry/PantryItemRow";
import { PantryWarningWindowForm } from "@/components/pantry/PantryWarningWindowForm";
import { deletePantryItem } from "../actions";
import { Trash2 } from "lucide-react";

export default async function PantryExpiringPage({
  searchParams,
}: {
  searchParams: { includeExpired?: string };
}) {
  const appConfig = await getAppConfig();
  const warningDays = appConfig?.pantryWarningDays ?? 7;
  const now = new Date();
  const includeExpired = searchParams.includeExpired === "true";
  const { end } = getExpiringWindow(now, warningDays);

  const where = includeExpired
    ? {
        status: "in_stock",
        expirationDate: { lte: end },
      }
    : buildExpiringPantryWhere(now, warningDays);

  const items = await prisma.pantryItem.findMany({
    where,
    orderBy: { expirationDate: "asc" },
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expiring pantry</h1>
          <p className="page-subtitle">Prioritize what needs to be used soon.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={includeExpired ? "/pantry/expiring" : "/pantry/expiring?includeExpired=true"}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {includeExpired ? "Hide expired" : "Include expired"}
          </Link>
          <Link href="/pantry">
            <Button variant="outline">Back to pantry</Button>
          </Link>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Warning window</CardTitle>
          <CardDescription>Control how soon items show up here.</CardDescription>
        </CardHeader>
        <CardContent>
          <PantryWarningWindowForm value={warningDays} />
        </CardContent>
      </Card>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const expiration = getExpirationStatus(
              getEffectiveExpirationDate(item.expirationDate, item.openedDate),
              now,
              warningDays
            );

            return (
              <PantryItemRow
                key={item.id}
                item={item}
                expiration={expiration}
                actions={
                  <form action={deletePantryItem.bind(null, item.id)}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </form>
                }
              />
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground space-y-3">
            <p className="text-lg text-foreground">No expiring items</p>
            <p className="text-sm text-muted-foreground">You are in the clear for now.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
