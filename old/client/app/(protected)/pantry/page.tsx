import prisma from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { deletePantryItem, runPantryMaintenance } from "./actions";
import { getAppConfig } from "@/lib/settings";
import { groupPantryItemsByCategory } from "@/lib/pantry/grouping";
import { getEffectiveExpirationDate, getExpirationStatus } from "@/lib/pantry/expiration";
import { PantryItemRow } from "@/components/pantry/PantryItemRow";

async function getPantryItems() {
  return await prisma.pantryItem.findMany({
    orderBy: { expirationDate: "asc" } // Expiring soonest first
  });
}

export default async function PantryPage() {
  const items = await getPantryItems();
  const appConfig = await getAppConfig();
  const warningDays = appConfig?.pantryWarningDays ?? 7;
  const now = new Date();
  const expirationStatuses = items.map((item) =>
    getExpirationStatus(getEffectiveExpirationDate(item.expirationDate, item.openedDate), now, warningDays)
  );
  const expiredCount = expirationStatuses.filter((status) => status.level === "expired").length;
  const expiringSoonCount = expirationStatuses.filter((status) => status.level === "warning").length;
  const groupedItems = groupPantryItemsByCategory(items);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pantry</h1>
          <p className="page-subtitle">Track what you have.</p>
        </div>
        <div className="flex items-center gap-2">
          <form action={runPantryMaintenance}>
            <Button variant="outline">Run maintenance</Button>
          </form>
          <Link href="/pantry/expiring">
            <Button variant="outline">Expiring view</Button>
          </Link>
          <Link href="/pantry/new">
            <Button className="gap-2">
              <Plus size={16} /> Add Item
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total items</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{items.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expiring soon</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{expiringSoonCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expired</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{expiredCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {items.length > 0 ? (
        <div className="space-y-8">
          {groupedItems.map((group) => (
            <div key={group.category} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.category}
                </h2>
                <span className="text-sm text-muted-foreground">{group.items.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
                {group.items.map((item) => {
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
            </div>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground space-y-3">
            <p className="text-lg text-foreground">Pantry is empty</p>
            <p className="text-sm text-muted-foreground">Add items or import from inventory to get started.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/pantry/new">
                <Button size="sm">Add first item</Button>
              </Link>
              <Link href="/inventory" className="text-sm text-muted-foreground hover:text-primary">
                Browse inventory
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
