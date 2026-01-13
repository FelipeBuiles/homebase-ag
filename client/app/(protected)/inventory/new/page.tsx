import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { createInventoryItem } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DEFAULT_INVENTORY_CATEGORIES } from "@/lib/inventory";
import prisma from "@/lib/prisma";

export default async function NewInventoryItemPage() {
  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-10">
      <div className="mb-6">
        <Link href="/inventory" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Inventory
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Item</CardTitle>
          <CardDescription>Add an item to your home inventory. Our agents will help categorize it.</CardDescription>
        </CardHeader>
        <form action={createInventoryItem} encType="multipart/form-data">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input id="name" name="name" placeholder="e.g. Dyson Vacuum" required />
            </div>
            
            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {DEFAULT_INVENTORY_CATEGORIES.map((category) => (
                  <label key={category} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="categories" value={category} className="h-4 w-4 accent-primary" />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Select one or more categories.</p>
            </div>

            <div className="space-y-2">
              <Label>Rooms</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {rooms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No rooms yet.</p>
                ) : (
                  rooms.map((room) => (
                    <label key={room.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="rooms" value={room.id} className="h-4 w-4 accent-primary" />
                      <span>{room.name}</span>
                    </label>
                  ))
                )}
              </div>
              <Input id="newRoom" name="newRoom" placeholder="Add a new room" />
              <p className="text-xs text-muted-foreground">Add a new room or pick existing ones.</p>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tags yet.</p>
                ) : (
                  tags.map((tag) => (
                    <label key={tag.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="tags" value={tag.id} className="h-4 w-4 accent-primary" />
                      <span>{tag.name}</span>
                    </label>
                  ))
                )}
              </div>
              <Input id="newTag" name="newTag" placeholder="Add a new tag" />
              <p className="text-xs text-muted-foreground">Use tags to group items across rooms.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea id="description" name="description" placeholder="Serial number, color, etc." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachments">Attachments</Label>
              <Input id="attachments" name="attachments" type="file" multiple accept="image/*,video/*" />
              <p className="text-xs text-muted-foreground">Add photos or short videos (optional).</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button">Cancel</Button>
            <Button type="submit">Add Item</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
