"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { createRecipeAction, updateRecipeAction } from "@/actions/recipes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface RecipeFormProps {
  recipe?: {
    id: string;
    title: string;
    description?: string | null;
    sourceUrl?: string | null;
    imageUrl?: string | null;
    servings?: number | null;
    prepMinutes?: number | null;
    cookMinutes?: number | null;
    instructions?: string | null;
  };
}

export function RecipeForm({ recipe }: RecipeFormProps) {
  const router = useRouter();
  const isEdit = !!recipe;

  const [title, setTitle] = useState(recipe?.title ?? "");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [sourceUrl, setSourceUrl] = useState(recipe?.sourceUrl ?? "");
  const [imageUrl, setImageUrl] = useState(recipe?.imageUrl ?? "");
  const [servings, setServings] = useState(recipe?.servings?.toString() ?? "");
  const [prepMinutes, setPrepMinutes] = useState(recipe?.prepMinutes?.toString() ?? "");
  const [cookMinutes, setCookMinutes] = useState(recipe?.cookMinutes?.toString() ?? "");
  const [instructions, setInstructions] = useState(recipe?.instructions ?? "");

  const { execute: execCreate, isPending: creating } = useAction(createRecipeAction, {
    onSuccess: ({ data }) => {
      toast.success("Recipe created");
      router.push(`/recipes/${data?.recipe?.id}`);
    },
    onError: () => toast.error("Failed to create recipe"),
  });

  const { execute: execUpdate, isPending: updating } = useAction(updateRecipeAction, {
    onSuccess: () => {
      toast.success("Recipe saved");
      router.push(`/recipes/${recipe!.id}`);
    },
    onError: () => toast.error("Failed to save recipe"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title,
      description: description || undefined,
      sourceUrl: sourceUrl || undefined,
      imageUrl: imageUrl || undefined,
      servings: servings ? parseInt(servings) : undefined,
      prepMinutes: prepMinutes ? parseInt(prepMinutes) : undefined,
      cookMinutes: cookMinutes ? parseInt(cookMinutes) : undefined,
      instructions: instructions || undefined,
    };
    if (isEdit) {
      execUpdate({ id: recipe.id, ...payload });
    } else {
      execCreate(payload);
    }
  }

  const isPending = creating || updating;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <Field label="Title" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Spaghetti Carbonara" required />
          </Field>

          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description…" rows={2} />
          </Field>

          <Field label="Instructions">
            <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Step 1: …&#10;Step 2: …" rows={10} className="font-mono text-xs" />
          </Field>
        </div>

        <div className="space-y-4">
          <Field label="Source URL">
            <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" type="url" />
          </Field>

          <Field label="Image URL">
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" type="url" />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Servings">
              <Input value={servings} onChange={(e) => setServings(e.target.value)} type="number" min={1} placeholder="4" />
            </Field>
            <Field label="Prep (min)">
              <Input value={prepMinutes} onChange={(e) => setPrepMinutes(e.target.value)} type="number" min={0} placeholder="15" />
            </Field>
            <Field label="Cook (min)">
              <Input value={cookMinutes} onChange={(e) => setCookMinutes(e.target.value)} type="number" min={0} placeholder="30" />
            </Field>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-base-100">
        <Button type="submit" disabled={isPending}>
          {isPending ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save changes" : "Create recipe"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-base-700">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
