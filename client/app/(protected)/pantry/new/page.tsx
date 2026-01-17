import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PantryForm } from "@/components/pantry/PantryForm";
import { createPantryItem } from "../actions";

async function getInventoryOptions() {
  return prisma.inventoryItem.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export default async function NewPantryItemPage() {
  const inventoryOptions = await getInventoryOptions();

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link href="/pantry" className="page-eyebrow flex items-center gap-2">
            <ArrowLeft size={14} /> Back to Pantry
          </Link>
          <h1 className="page-title">Add Pantry Item</h1>
          <p className="page-subtitle">Track pantry items and expiration dates.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item details</CardTitle>
          <CardDescription>What did you buy?</CardDescription>
        </CardHeader>
        <CardContent>
          <PantryForm
            action={createPantryItem}
            submitLabel="Add Item"
            cancelHref="/pantry"
            inventoryOptions={inventoryOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
