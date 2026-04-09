"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, X, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { quickCreateWithPhoto } from "@/actions/inventory";
import { toast } from "sonner";

type Step = "capture" | "identifying" | "review" | "saving";

interface Suggestion {
  name: string;
  brand?: string;
  categories: string[];
  rooms: string[];
  tags: string[];
  condition: "good" | "fair" | "poor";
  rationale: string;
}

export function QuickAddPhotoButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Camera className="h-4 w-4" />
        Quick add
      </Button>
      <QuickAddPhotoDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function QuickAddPhotoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("capture");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable form state
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState<"good" | "fair" | "poor">("good");
  const [categories, setCategories] = useState<string[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  function reset() {
    setStep("capture");
    setPreviewUrl(null);
    setFile(null);
    setSuggestion(null);
    setError(null);
    setName("");
    setBrand("");
    setCondition("good");
    setCategories([]);
    setRooms([]);
    setTags([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setError(null);
    setStep("identifying");

    try {
      const fd = new FormData();
      fd.append("file", selected);
      const res = await fetch("/api/inventory/identify", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Identification failed");
      const data: Suggestion = await res.json();

      setSuggestion(data);
      setName(data.name);
      setBrand(data.brand ?? "");
      setCondition(data.condition);
      setCategories(data.categories);
      setRooms(data.rooms);
      setTags(data.tags);
      setStep("review");
    } catch {
      setError("Couldn't identify the item. You can fill in the details manually.");
      setStep("review");
    }
  }

  async function handleSave() {
    if (!name.trim() || !file) return;
    setStep("saving");

    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await quickCreateWithPhoto(
        { name: name.trim(), brand: brand || undefined, condition, quantity: 1, categories, rooms, tags },
        fd
      );
      toast.success("Item added");
      handleClose();
      router.push(`/inventory/${result.item.id}`);
    } catch {
      toast.error("Failed to save item");
      setStep("review");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick add from photo</DialogTitle>
        </DialogHeader>

        {step === "capture" && (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-base-300 bg-base-50 py-12 cursor-pointer hover:border-accent-400 hover:bg-accent-50/30 transition-colors">
              <Camera className="h-10 w-10 text-base-300" />
              <div className="text-center">
                <p className="text-sm font-medium text-base-700">Take a photo or choose a file</p>
                <p className="text-xs text-base-400 mt-0.5">The AI will identify the item automatically</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}

        {step === "identifying" && (
          <div className="space-y-4">
            {previewUrl && (
              <div className="rounded-lg overflow-hidden border border-base-200 max-h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
              </div>
            )}
            <div className="flex items-center justify-center gap-3 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-accent-500" />
              <p className="text-sm text-base-600">Identifying item…</p>
            </div>
          </div>
        )}

        {(step === "review" || step === "saving") && (
          <div className="space-y-4">
            {/* Photo preview + re-shoot */}
            <div className="flex gap-3 items-start">
              {previewUrl && (
                <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-base-200 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                {suggestion?.rationale && (
                  <p className="text-xs text-base-500 italic">{suggestion.rationale}</p>
                )}
                {error && <p className="text-xs text-warning">{error}</p>}
                <button
                  type="button"
                  onClick={() => { reset(); }}
                  className="text-xs text-accent-600 hover:text-accent-700 flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Use different photo
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <FormField label="Name" required>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Item name"
                  autoFocus={!name}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Brand">
                  <Input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Brand"
                  />
                </FormField>
                <FormField label="Condition">
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as "good" | "fair" | "poor")}
                    className="w-full h-8 rounded-lg border border-base-200 bg-white px-2.5 text-sm text-base-800 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
                  >
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </FormField>
              </div>

              <FormField label="Rooms">
                <TagPills values={rooms} onChange={setRooms} placeholder="Add room…" />
              </FormField>

              <FormField label="Categories">
                <TagPills values={categories} onChange={setCategories} placeholder="Add category…" />
              </FormField>

              <FormField label="Tags">
                <TagPills values={tags} onChange={setTags} placeholder="Add tag…" />
              </FormField>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-base-100">
              <Button
                onClick={handleSave}
                disabled={step === "saving" || !name.trim()}
              >
                {step === "saving" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                ) : (
                  "Add item"
                )}
              </Button>
              <Button variant="ghost" onClick={handleClose} disabled={step === "saving"}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-base-600">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function TagPills({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");

  function add(val: string) {
    const t = val.trim();
    if (t && !values.includes(t)) onChange([...values, t]);
    setInput("");
  }

  function remove(val: string) {
    onChange(values.filter((v) => v !== val));
  }

  return (
    <div className="flex flex-wrap gap-1.5 rounded-lg border border-base-200 bg-white px-2.5 py-1.5 min-h-8">
      {values.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 bg-base-100 text-base-700 text-xs rounded-full">
          {v}
          <button type="button" onClick={() => remove(v)} className="text-base-400 hover:text-base-700">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); if (input.trim()) add(input); }
          if (e.key === "Backspace" && !input && values.length) remove(values[values.length - 1]);
        }}
        onBlur={() => { if (input.trim()) add(input); }}
        placeholder={values.length === 0 ? placeholder : ""}
        className="flex-1 min-w-16 text-xs outline-none bg-transparent placeholder:text-base-400"
      />
      {input.trim() && (
        <button type="button" onClick={() => add(input)} className="text-accent-500">
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
