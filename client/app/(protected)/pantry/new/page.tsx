import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { createPantryItem } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewPantryItemPage() {
  return (
    <div className="max-w-xl mx-auto p-4 md:p-10">
      <div className="mb-6">
        <Link href="/pantry" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Pantry
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Pantry Item</CardTitle>
          <CardDescription>What did you buy?</CardDescription>
        </CardHeader>
        <form action={createPantryItem}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input id="name" name="name" placeholder="e.g. Rice" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" name="quantity" placeholder="e.g. 5" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                   <Input id="unit" name="unit" placeholder="e.g. lbs" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <div className="relative">
                 {/* Native select for simplicity for now, or just text input */}
                 <Input id="category" name="category" placeholder="e.g. Grains" list="categories" />
                 <datalist id="categories">
                    <option value="Grains" />
                    <option value="Canned Goods" />
                    <option value="Spices" />
                    <option value="Snacks" />
                    <option value="Baking" />
                 </datalist>
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date (Optional)</Label>
              <Input id="expirationDate" name="expirationDate" type="date" />
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
