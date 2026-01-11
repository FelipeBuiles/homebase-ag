import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { createRecipe } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewRecipePage() {
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-10">
      <div className="mb-6">
        <Link href="/recipes" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Recipes
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Recipe</CardTitle>
          <CardDescription>Save a new favorite.</CardDescription>
        </CardHeader>
        <form action={createRecipe}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Recipe Name</Label>
              <Input id="name" name="name" placeholder="e.g. Mom&apos;s Spaghetti" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">Source URL (Optional)</Label>
              <Input id="sourceUrl" name="sourceUrl" placeholder="https://..." />
              <p className="text-xs text-muted-foreground">We&apos;ll try to extract details from the link in the future.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="A brief summary..." />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="ingredients">Ingredients (One per line)</Label>
                    <Textarea id="ingredients" name="ingredients" placeholder="1 cup flour&#10;2 eggs&#10;..." className="min-h-[200px] font-mono text-sm" />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="instructions">Instructions</Label>
                    <Textarea id="instructions" name="instructions" placeholder="1. Mix ingredients...&#10;2. Bake at 350..." className="min-h-[200px]" />
                 </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button">Cancel</Button>
            <Button type="submit">Save Recipe</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
