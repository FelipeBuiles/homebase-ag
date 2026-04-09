import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PantryForm, buildPantryFormDefaults } from "@/components/pantry/PantryForm";
import { updatePantryItem } from "../../actions";

async function getPantryItem(id: string) {
  return prisma.pantryItem.findUnique({ where: { id } });
}

async function getInventoryOptions() {
  return prisma.inventoryItem.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export default async function EditPantryItemPage({ params }: { params: { id: string } }) {
  const item = await getPantryItem(params.id);
  if (!item) notFound();

  const inventoryOptions = await getInventoryOptions();
  const defaults = buildPantryFormDefaults({
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    location: item.location,
    category: item.category,
    status: item.status,
    expirationDate: item.expirationDate,
    openedDate: item.openedDate,
    inventoryItemId: item.inventoryItemId,
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link href="/pantry" className="page-eyebrow flex items-center gap-2">
            <ArrowLeft size={14} /> Back to Pantry
          </Link>
          <h1 className="page-title">Edit Pantry Item</h1>
          <p className="page-subtitle">Keep pantry details accurate.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item details</CardTitle>
          <CardDescription>Update status, location, or dates.</CardDescription>
        </CardHeader>
        <CardContent>
          <PantryForm
            action={updatePantryItem.bind(null, item.id)}
            submitLabel="Save changes"
            cancelHref="/pantry"
            initialValues={defaults}
            inventoryOptions={inventoryOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
