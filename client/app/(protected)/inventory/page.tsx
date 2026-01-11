import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Package } from "lucide-react";
import Link from "next/link";
import { quickAddInventoryItem } from "./actions";
import { isInventoryComplete } from "@/lib/inventory";

async function getInventory() {
  // Ensure we don't crash if DB is empty or connection fails (though ideally we handle error page)
  try {
      const items = await prisma.inventoryItem.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return items;
  } catch (e) {
      console.error("Failed to fetch inventory", e);
      return [];
  }
}

type SearchParams = Record<string, string | string[] | undefined>;

const getSearchParam = (searchParams: SearchParams, key: string) => {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const status = getSearchParam(params, "status");
  const items = await getInventory();
  const filtered = items.filter((item) => {
    if (!status) return true;
    const complete = isInventoryComplete(item);
    if (status === "complete") return complete;
    if (status === "incomplete") return !complete;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">Manage your household items.</p>
        </div>
        <Link href="/inventory/new">
          <Button className="gap-2">
            <Plus size={16} /> Add Item
          </Button>
        </Link>
      </div>

      <Card className="mb-8 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick add</CardTitle>
          <CardDescription>Add an item now and fill details later.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={quickAddInventoryItem} className="flex flex-wrap gap-3">
            <Input name="name" placeholder="Item name" className="min-w-[220px] flex-1" required />
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Link href="/inventory" className={`nav-pill ${!status ? "bg-secondary/70" : ""}`}>
          All
        </Link>
        <Link href="/inventory?status=complete" className={`nav-pill ${status === "complete" ? "bg-secondary/70" : ""}`}>
          Complete
        </Link>
        <Link href="/inventory?status=incomplete" className={`nav-pill ${status === "incomplete" ? "bg-secondary/70" : ""}`}>
          Needs details
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border/70 rounded-2xl bg-card/70">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No items yet</h3>
          <p className="text-muted-foreground mb-4">
            {status ? "No items match this filter." : "Start by adding things you own."}
          </p>
          {!status && (
            <Link href="/inventory/new">
              <Button>Add First Item</Button>
            </Link>
          )}
          {status && (
            <Link href="/inventory" className="text-sm text-primary hover:underline">
              Clear filter
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger">
          {filtered.map((item) => {
            const complete = isInventoryComplete(item);
            return (
            <Link key={item.id} href={`/inventory/${item.id}`} className="block">
              <Card className="group hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{item.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{item.category ?? "Uncategorized"}</Badge>
                      <Badge variant={complete ? "default" : "outline"}>
                        {complete ? "Complete" : "Needs details"}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{item.location ?? "Unknown"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">#{tag}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )})}
        </div>
      )}
    </div>
  );
}
