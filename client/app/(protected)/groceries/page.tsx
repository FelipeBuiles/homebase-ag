import prisma from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { addGroceryItem } from "./actions";
import { getOrCreateDefaultGroceryList } from "@/lib/groceries";
import { findDuplicateGroups } from "@/lib/groceries-duplicates";
import { mergeGroceryItems } from "./actions";
import { GroceriesListClient } from "./GroceriesListClient";

async function getDefaultList() {
  const list = await getOrCreateDefaultGroceryList();
  return await prisma.groceryList.findUnique({
    where: { id: list.id },
    include: { items: { orderBy: { createdAt: "desc" } } },
  });
}

export default async function GroceriesPage() {
  const list = await getDefaultList();
  const duplicateGroups = findDuplicateGroups(
    list?.items.map((item) => ({
      id: item.id,
      name: item.name,
      canonicalKey: item.canonicalKey,
      normalizedName: item.normalizedName,
    })) ?? []
  );

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Groceries</h1>
          <p className="page-subtitle">
            {list?.items.filter((item) => !item.isChecked).length ?? 0} remaining items
          </p>
        </div>
      </header>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <form action={addGroceryItem} className="flex flex-wrap gap-2">
            <Input name="name" placeholder="Item Name (e.g. Milk)" className="flex-1 min-w-[200px]" required autoFocus />
            <Input name="quantity" placeholder="Qty" className="w-24" />
            <Button type="submit"><Plus size={16} /> Add</Button>
          </form>
        </CardContent>
      </Card>

      {duplicateGroups.length > 0 && (
        <Card className="mb-8">
          <CardContent className="pt-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Review duplicates</h2>
              <p className="text-sm text-muted-foreground">
                Merge items that refer to the same ingredient.
              </p>
            </div>
            {duplicateGroups.map((group) => (
              <div key={group.key} className="rounded-2xl border border-border/60 p-4 space-y-3">
                <div className="text-sm font-semibold text-foreground">
                  {group.items[0]?.normalizedName || group.key}
                </div>
                <div className="text-sm text-muted-foreground">
                  {group.items.map((item) => item.name).join(", ")}
                </div>
                <form action={mergeGroceryItems} className="flex items-center gap-2">
                  <input type="hidden" name="targetId" value={group.items[0].id} />
                  {group.items.slice(1).map((item) => (
                    <input key={item.id} type="hidden" name="sourceIds" value={item.id} />
                  ))}
                  <Button size="sm" type="submit">Merge into {group.items[0].name}</Button>
                </form>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <GroceriesListClient items={list?.items ?? []} />
    </div>
  );
}
