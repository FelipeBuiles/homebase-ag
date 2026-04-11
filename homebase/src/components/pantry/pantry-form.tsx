"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { createPantryItemAction, updatePantryItemAction } from "@/actions/pantry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface PantryFormProps {
  item?: {
    id: string;
    name: string;
    brand?: string | null;
    location?: string | null;
    quantity: number;
    unit?: string | null;
    expiresAt?: Date | null;
    openedAt?: Date | null;
    notes?: string | null;
    status?: string | null;
    inventoryItemId?: string | null;
  };
  itemDraft?: {
    name?: string;
    brand?: string;
    inventoryItemId?: string;
  };
}

function toDateInput(date?: Date | null): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export function PantryForm({ item, itemDraft }: PantryFormProps) {
  const router = useRouter();
  const isEdit = !!item;

  const [name, setName] = useState(item?.name ?? itemDraft?.name ?? "");
  const [brand, setBrand] = useState(item?.brand ?? itemDraft?.brand ?? "");
  const [location, setLocation] = useState(item?.location ?? "");
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [unit, setUnit] = useState(item?.unit ?? "");
  const [expiresAt, setExpiresAt] = useState(toDateInput(item?.expiresAt));
  const [openedAt, setOpenedAt] = useState(toDateInput(item?.openedAt));
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [status, setStatus] = useState<string>(item?.status ?? "in_stock");

  const { execute: execCreate, isPending: creating } = useAction(createPantryItemAction, {
    onSuccess: ({ data }) => {
      toast.success("Item added to pantry");
      router.push(`/pantry/${data?.item?.id}`);
    },
    onError: () => toast.error("Failed to add item"),
  });

  const { execute: execUpdate, isPending: updating } = useAction(updatePantryItemAction, {
    onSuccess: () => {
      toast.success("Item updated");
      router.push(`/pantry/${item!.id}`);
    },
    onError: () => toast.error("Failed to update item"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      brand: brand || undefined,
      location: location || undefined,
      quantity,
      unit: unit || undefined,
      expiresAt: expiresAt || undefined,
      openedAt: openedAt || undefined,
      notes: notes || undefined,
      status: status as "in_stock" | "out_of_stock" | "consumed" | "discarded" | undefined,
      inventoryItemId: item?.inventoryItemId ?? itemDraft?.inventoryItemId,
    };
    if (isEdit) {
      execUpdate({ id: item.id, ...payload });
    } else {
      execCreate(payload);
    }
  }

  const isPending = creating || updating;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-4">
        <Field label="Name" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Greek Yogurt"
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Brand">
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Chobani"
            />
          </Field>

          <Field label="Location">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Fridge, Pantry shelf"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Quantity">
            <Input
              type="number"
              min={0}
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </Field>

          <Field label="Unit">
            <Input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. oz, lbs, count"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Expires">
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </Field>

          <Field label="Opened">
            <Input
              type="date"
              value={openedAt}
              onChange={(e) => setOpenedAt(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Notes">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes..."
            rows={3}
          />
        </Field>

        {isEdit && (
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-9 rounded-lg border border-base-200 bg-white px-3 text-sm text-base-800 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
            >
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="consumed">Consumed</option>
              <option value="discarded">Discarded</option>
            </select>
          </Field>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-base-100">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit ? "Saving..." : "Adding..."
            : isEdit ? "Save changes" : "Add to pantry"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-base-700">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
