import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { addItemToList } from "../actions";
import { GroceryItemRow } from "../ItemRow";
import { notFound } from "next/navigation";

async function getList(id: string) {
    try {
        return await prisma.groceryList.findUnique({
            where: { id },
            include: { 
                items: {
                    orderBy: { createdAt: 'desc' }
                } 
            }
        });
    } catch (error) {
        console.error("Failed to load grocery list", error);
        return null;
    }
}

export default async function GroceryListPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;  
  const list = await getList(params.id);

  if (!list) return notFound();

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link href="/groceries" className="page-eyebrow flex items-center gap-2">
            <ArrowLeft size={14} /> Back to Lists
          </Link>
          <h1 className="page-title">{list.name}</h1>
          <p className="page-subtitle">{list.items.filter(i => !i.isChecked).length} remaining items</p>
        </div>
      </div>

      {/* Add Item Form */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <form action={addItemToList.bind(null, list.id)} className="flex flex-wrap gap-2">
              <Input name="name" placeholder="Item Name (e.g. Milk)" className="flex-1 min-w-[200px]" required autoFocus />
              <Input name="quantity" placeholder="Qty" className="w-24" />
              <Button type="submit"><Plus size={16} /> Add</Button>
          </form>
        </CardContent>
      </Card>

      {/* Items List */}
      <div className="space-y-1">
        {list.items.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground">
                List is empty. Add something above.
              </CardContent>
            </Card>
        )}
        {list.items.map(item => (
            <GroceryItemRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
