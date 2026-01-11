import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteInventoryItem, updateInventoryItem } from "../actions";
import { DEFAULT_INVENTORY_CATEGORIES } from "@/lib/inventory";

type SearchParams = Record<string, string | string[] | undefined>;

const getSearchParam = (searchParams: SearchParams, key: string) => {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
};

async function getItem(id: string) {
  try {
    return await prisma.inventoryItem.findUnique({ where: { id } });
  } catch (error) {
    console.error("Failed to load inventory item", error);
    return null;
  }
}

export default async function InventoryDetailPage(props: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const quick = getSearchParam(searchParams, "quick");
  const item = await getItem(params.id);

  if (!item) return notFound();

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/inventory" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Inventory
        </Link>
        <form action={deleteInventoryItem.bind(null, item.id)}>
          <Button variant="destructive" size="sm" className="gap-2">
            <Trash2 size={14} /> Delete
          </Button>
        </form>
      </div>

      {quick && (
        <Card className="mb-6 bg-secondary/60">
          <CardHeader>
            <CardTitle className="text-lg">Finish this item</CardTitle>
            <CardDescription>
              Quick add saved this item. Fill in category and location to complete it.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Edit Item</CardTitle>
          <CardDescription>Update details and keep your inventory accurate.</CardDescription>
        </CardHeader>
        <form action={updateInventoryItem.bind(null, item.id)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input id="name" name="name" defaultValue={item.name} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                defaultValue={item.category ?? ""}
                placeholder="Uncategorized"
                list="inventory-categories"
              />
              <p className="text-xs text-muted-foreground">Leave blank to mark as Uncategorized.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" defaultValue={item.location ?? ""} placeholder="Unknown" />
              <p className="text-xs text-muted-foreground">Leave blank to mark as Unknown.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={item.description ?? ""} />
            </div>

            <datalist id="inventory-categories">
              {DEFAULT_INVENTORY_CATEGORIES.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">Save changes</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
