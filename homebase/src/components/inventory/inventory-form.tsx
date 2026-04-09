"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { createItem, updateItem, uploadAttachment } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, X, Upload, Loader2 } from "lucide-react";
import Image from "next/image";

interface InventoryFormProps {
  item?: {
    id: string;
    name: string;
    brand?: string | null;
    condition: string;
    quantity: number;
    notes?: string | null;
    categories: string[];
    rooms: string[];
    tags: string[];
    attachments: { id: string; url: string }[];
  };
}

export function InventoryForm({ item }: InventoryFormProps) {
  const router = useRouter();
  const isEdit = !!item;

  const [name, setName] = useState(item?.name ?? "");
  const [brand, setBrand] = useState(item?.brand ?? "");
  const [condition, setCondition] = useState(item?.condition ?? "good");
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [categories, setCategories] = useState<string[]>(item?.categories ?? []);
  const [rooms, setRooms] = useState<string[]>(item?.rooms ?? []);
  const [tags, setTags] = useState<string[]>(item?.tags ?? []);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { execute: execCreate, isPending: creating } = useAction(createItem, {
    onSuccess: ({ data }) => {
      toast.success("Item created");
      router.push(`/inventory/${data?.item?.id}`);
    },
    onError: () => toast.error("Failed to create item"),
  });

  const { execute: execUpdate, isPending: updating } = useAction(updateItem, {
    onSuccess: () => {
      toast.success("Item updated");
      router.push(`/inventory/${item!.id}`);
    },
    onError: () => toast.error("Failed to update item"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      brand: brand || undefined,
      condition: condition as "good" | "fair" | "poor",
      quantity,
      notes: notes || undefined,
      categories,
      rooms,
      tags,
    };
    if (isEdit) {
      execUpdate({ id: item.id, ...payload });
    } else {
      execCreate(payload);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !item) return;

    setUploading(true);
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    const formData = new FormData();
    formData.append("file", file);
    try {
      await uploadAttachment(item.id, formData);
      toast.success("Photo uploaded");
    } catch {
      toast.error("Upload failed");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }

  const isPending = creating || updating;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main fields */}
        <div className="space-y-4">
          <Field label="Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. KitchenAid Stand Mixer"
              required
            />
          </Field>

          <Field label="Brand">
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. KitchenAid"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Condition">
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full h-8 rounded-lg border border-base-200 bg-white px-2.5 text-sm text-base-800 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
              >
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </Field>

            <Field label="Quantity">
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </Field>

          <Field label="Rooms">
            <TagInput
              values={rooms}
              onChange={setRooms}
              placeholder="Add a room..."
              suggestions={["Kitchen", "Living Room", "Bedroom", "Bathroom", "Garage", "Office", "Basement"]}
            />
          </Field>

          <Field label="Categories">
            <TagInput
              values={categories}
              onChange={setCategories}
              placeholder="Add a category..."
              suggestions={["Appliances", "Electronics", "Furniture", "Tools", "Clothing", "Books", "Sports"]}
            />
          </Field>

          <Field label="Tags">
            <TagInput
              values={tags}
              onChange={setTags}
              placeholder="Add a tag..."
            />
          </Field>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Photo upload — only available on edit */}
          {isEdit ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-base-700">Photos</label>
              <div className="space-y-2">
                {item.attachments.map((att) => (
                  <div key={att.id} className="relative rounded-lg overflow-hidden border border-base-200">
                    <Image
                      src={att.url}
                      alt="Attachment"
                      width={280}
                      height={180}
                      className="w-full object-cover"
                    />
                  </div>
                ))}
                {previewUrl && (
                  <div className="relative rounded-lg overflow-hidden border border-base-200 opacity-60">
                    <Image
                      src={previewUrl}
                      alt="Uploading..."
                      width={280}
                      height={180}
                      className="w-full object-cover"
                    />
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                        <Loader2 className="h-5 w-5 animate-spin text-accent-500" />
                      </div>
                    )}
                  </div>
                )}
                <label className="flex items-center gap-2 px-3 py-2 text-sm text-base-600 border border-dashed border-base-300 rounded-lg cursor-pointer hover:bg-base-50 transition-colors">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-base-200 p-4 text-center">
              <p className="text-xs text-base-400">
                Save the item first, then you can add photos.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-base-100">
        <Button type="submit" disabled={isPending}>
          {isPending ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save changes" : "Create item"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
        >
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

function TagInput({
  values,
  onChange,
  placeholder,
  suggestions,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  suggestions?: string[];
}) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  function add(val: string) {
    const trimmed = val.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput("");
    setShowSuggestions(false);
  }

  function remove(val: string) {
    onChange(values.filter((v) => v !== val));
  }

  const filtered = suggestions?.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !values.includes(s)
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-base-100 text-base-700 text-xs rounded-full"
          >
            {v}
            <button
              type="button"
              onClick={() => remove(v)}
              className="text-base-400 hover:text-base-700"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (input.trim()) add(input);
            }
          }}
          placeholder={placeholder}
          className="w-full h-8 rounded-lg border border-base-200 bg-white px-2.5 text-sm text-base-800 placeholder:text-base-400 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
        />
        {showSuggestions && filtered && filtered.length > 0 && (
          <div className="absolute z-10 top-full mt-1 w-full rounded-lg border border-base-200 bg-white shadow-md overflow-hidden">
            {filtered.slice(0, 6).map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={() => add(s)}
                className="w-full text-left px-3 py-1.5 text-sm text-base-700 hover:bg-base-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {input.trim() && (
          <button
            type="button"
            onClick={() => add(input)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-accent-500 hover:text-accent-600"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
