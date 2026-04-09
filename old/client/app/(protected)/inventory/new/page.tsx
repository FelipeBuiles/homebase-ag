import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { createInventoryItem } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DEFAULT_INVENTORY_CATEGORIES } from "@/lib/inventory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import prisma from "@/lib/prisma";

export default async function NewInventoryItemPage() {
  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link href="/inventory" className="page-eyebrow flex items-center gap-2">
            <ArrowLeft size={14} /> Back to Inventory
          </Link>
          <h1 className="page-title">Add Item</h1>
          <p className="page-subtitle">Add an item to your home inventory.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item details</CardTitle>
          <CardDescription>Add a photo first, then fill details while enrichment runs.</CardDescription>
        </CardHeader>
        <form action={createInventoryItem}>
          <CardContent className="grid gap-6 md:grid-cols-5">
            <div className="md:col-span-3 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="attachments">Photos for recognition</Label>
                <Input id="attachments" name="attachments" type="file" multiple accept="image/*,video/*" />
                <p className="text-xs text-muted-foreground">Upload first to unlock AI suggestions.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" name="name" placeholder="e.g. Dyson Vacuum" />
                <p className="text-xs text-muted-foreground">Leave blank to save a draft.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" name="description" placeholder="Serial number, color, etc." />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Item metadata
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand (Optional)</Label>
                  <Input id="brand" name="brand" placeholder="e.g. Dyson" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model (Optional)</Label>
                  <Input id="model" name="model" placeholder="e.g. V8 Absolute" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition (Optional)</Label>
                  <Select name="condition">
                    <SelectTrigger id="condition" className="w-full">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Like New">Like New</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial (Optional)</Label>
                  <Input id="serialNumber" name="serialNumber" placeholder="Serial number" />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-3 space-y-3">
                <div>
                  <Label>Categories</Label>
                  <p className="text-xs text-muted-foreground">Pick one or more.</p>
                </div>
                <div className="grid gap-2 max-h-40 overflow-auto pr-2 text-sm">
                  {DEFAULT_INVENTORY_CATEGORIES.map((category) => (
                    <label key={category} className="flex items-center gap-2">
                      <input type="checkbox" name="categories" value={category} className="h-4 w-4 accent-primary" />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 p-3 space-y-3">
                <div>
                  <Label>Rooms</Label>
                  <p className="text-xs text-muted-foreground">Add a new room or pick existing ones.</p>
                </div>
                <Input id="newRoom" name="newRoom" placeholder="Add a new room" />
                <div className="grid gap-2 max-h-32 overflow-auto pr-2 text-sm">
                  {rooms.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No rooms yet.</p>
                  ) : (
                    rooms.map((room) => (
                      <label key={room.id} className="flex items-center gap-2">
                        <input type="checkbox" name="rooms" value={room.id} className="h-4 w-4 accent-primary" />
                        <span>{room.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 p-3 space-y-3">
                <div>
                  <Label>Tags</Label>
                  <p className="text-xs text-muted-foreground">Keep this short and specific.</p>
                </div>
                <Input id="newTag" name="newTag" placeholder="Add a new tag" />
                <div className="grid gap-2 max-h-32 overflow-auto pr-2 text-sm">
                  {tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tags yet.</p>
                  ) : (
                    tags.map((tag) => (
                      <label key={tag.id} className="flex items-center gap-2">
                        <input type="checkbox" name="tags" value={tag.id} className="h-4 w-4 accent-primary" />
                        <span>{tag.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap justify-between gap-3">
            <Button variant="ghost" type="button">Cancel</Button>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="outline" name="mode" value="photo-only">
                Save draft
              </Button>
              <Button type="submit">Add Item</Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
