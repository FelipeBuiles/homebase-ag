import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

export type PantryFormValues = {
  name: string;
  quantity: string;
  unit: string;
  location: string;
  category: string;
  status: string;
  expirationDate: string;
  openedDate: string;
  inventoryItemId: string;
};

type PantryFormItem = {
  name: string;
  quantity: string | null;
  unit: string | null;
  location: string;
  category: string | null;
  status: string;
  expirationDate: Date | null;
  openedDate: Date | null;
  inventoryItemId: string | null;
};

type PantryFormProps = {
  action: (formData: FormData) => void;
  submitLabel: string;
  cancelHref: string;
  initialValues?: PantryFormValues;
  inventoryOptions?: { id: string; name: string }[];
};

const formatDateForInput = (value: Date | null) =>
  value ? value.toISOString().slice(0, 10) : "";

export const buildPantryFormDefaults = (item: PantryFormItem | null): PantryFormValues => {
  return {
    name: item?.name ?? "",
    quantity: item?.quantity ?? "",
    unit: item?.unit ?? "",
    location: item?.location ?? "",
    category: item?.category ?? "",
    status: item?.status ?? "in_stock",
    expirationDate: formatDateForInput(item?.expirationDate ?? null),
    openedDate: formatDateForInput(item?.openedDate ?? null),
    inventoryItemId: item?.inventoryItemId ?? "",
  };
};

export const PantryForm = ({
  action,
  submitLabel,
  cancelHref,
  initialValues,
  inventoryOptions = [],
}: PantryFormProps) => {
  const defaults = initialValues ?? buildPantryFormDefaults(null);

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Item Name</Label>
          <Input id="name" name="name" defaultValue={defaults.name} placeholder="e.g. Rice" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" name="quantity" defaultValue={defaults.quantity} placeholder="e.g. 2" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" name="unit" defaultValue={defaults.unit} placeholder="e.g. lbs" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={defaults.location} placeholder="e.g. Pantry" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" name="category" defaultValue={defaults.category} placeholder="e.g. Grains" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select name="status" defaultValue={defaults.status}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_stock">In stock</SelectItem>
                <SelectItem value="out_of_stock">Out of stock</SelectItem>
                <SelectItem value="consumed">Consumed</SelectItem>
                <SelectItem value="discarded">Discarded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Inventory link</Label>
            <Select name="inventoryItemId" defaultValue={defaults.inventoryItemId || "none"}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No link" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No link</SelectItem>
                {inventoryOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expirationDate">Expiration Date</Label>
            <Input
              id="expirationDate"
              name="expirationDate"
              type="date"
              defaultValue={defaults.expirationDate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="openedDate">Opened Date</Label>
            <Input id="openedDate" name="openedDate" type="date" defaultValue={defaults.openedDate} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link href={cancelHref}>
          <Button variant="outline" type="button">Cancel</Button>
        </Link>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
};
