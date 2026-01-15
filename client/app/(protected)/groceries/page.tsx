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
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Groceries</h1>
          <p className="page-subtitle">Manage your shopping lists.</p>
        </div>
        <div className="text-sm text-muted-foreground">{lists.length} lists</div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Create New List</CardTitle>
            <CardDescription>Start a new shopping run with a clear goal.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createGroceryList} className="flex flex-wrap gap-2">
              <Input name="name" placeholder="List Name (e.g. Weekly)" required />
              <Button size="icon" type="submit" aria-label="Create list">
                <Plus size={16} />
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {lists.map((list) => (
            <Link href={`/groceries/${list.id}`} key={list.id}>
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <ShoppingCart className="text-primary h-5 w-5" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(list.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="mt-2">{list.name}</CardTitle>
                  <CardDescription>{list._count.items} items</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
          {lists.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground">
                <p className="text-sm">No lists yet. Create one to get started.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
