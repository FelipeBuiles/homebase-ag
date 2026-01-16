import prisma from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { addGroceryItem } from "./actions";
import { GroceryItemRow } from "./ItemRow";
import { getOrCreateDefaultGroceryList } from "@/lib/groceries";

async function getDefaultList() {
  const list = await getOrCreateDefaultGroceryList();
  return await prisma.groceryList.findUnique({
    where: { id: list.id },
    include: { items: { orderBy: { createdAt: "desc" } } },
  });
}

export default async function GroceriesPage() {
  const list = await getDefaultList();

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

      <div className="space-y-1">
        {list?.items.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              List is empty. Add something above.
            </CardContent>
          </Card>
        )}
        {list?.items.map((item) => (
          <GroceryItemRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
