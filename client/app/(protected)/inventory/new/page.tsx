import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { createInventoryItem } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DEFAULT_INVENTORY_CATEGORIES } from "@/lib/inventory";

export default function NewInventoryItemPage() {
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
        <form action={createInventoryItem}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input id="name" name="name" placeholder="e.g. Dyson Vacuum" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" placeholder="e.g. Appliances" list="inventory-categories" />
              <p className="text-xs text-muted-foreground">Leave blank to mark as Uncategorized.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="e.g. Utility Closet" />
              <p className="text-xs text-muted-foreground">Leave blank to mark as Unknown.</p>
            </div>

            <datalist id="inventory-categories">
              {DEFAULT_INVENTORY_CATEGORIES.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea id="description" name="description" placeholder="Serial number, color, etc." />
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
