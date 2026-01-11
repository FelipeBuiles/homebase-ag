import prisma from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { createGroceryList } from "./actions";

async function getLists() {
  return await prisma.groceryList.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { items: true } } }
  });
}

export default async function GroceriesPage() {
  const lists = await getLists();

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground">Groceries</h1>
          <p className="text-muted-foreground">Manage your shopping lists.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger">
        {/* New List Card */}
        <Card className="border-dashed border-2 flex flex-col justify-center bg-card/70">
            <CardHeader>
                <CardTitle>Create New List</CardTitle>
                <CardDescription>Start a new shopping run</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={createGroceryList} className="flex gap-2">
                    <Input name="name" placeholder="List Name (e.g. Weekly)" required />
                    <Button size="icon" type="submit"><Plus size={16} /></Button>
                </form>
            </CardContent>
        </Card>

        {/* Existing Lists */}
        {lists.map((list) => (
          <Link href={`/groceries/${list.id}`} key={list.id}>
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                    <ShoppingCart className="text-primary h-5 w-5" />
                    <span className="text-xs text-muted-foreground">{new Date(list.updatedAt).toLocaleDateString()}</span>
                </div>
                <CardTitle className="mt-2">{list.name}</CardTitle>
                <CardDescription>{list._count.items} items</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
