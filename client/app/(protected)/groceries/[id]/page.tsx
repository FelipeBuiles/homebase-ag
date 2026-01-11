import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="max-w-3xl mx-auto p-4 md:p-10">
      <div className="mb-6">
        <Link href="/groceries" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Lists
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground">{list.name}</h1>
           <p className="text-muted-foreground">{list.items.filter(i => !i.isChecked).length} remaining items</p>
        </div>
      </div>

      {/* Add Item Form */}
      <div className="mb-8 p-4 bg-muted/50 rounded-2xl shadow-soft">
        <form action={addItemToList.bind(null, list.id)} className="flex gap-2">
            <Input name="name" placeholder="Item Name (e.g. Milk)" className="flex-1" required autoFocus />
            <Input name="quantity" placeholder="Qty" className="w-24" />
            <Button type="submit"><Plus size={16} /> Add</Button>
        </form>
      </div>

      {/* Items List */}
      <div className="space-y-1">
        {list.items.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">List is empty. Add something above!</div>
        )}
        {list.items.map(item => (
            <GroceryItemRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
