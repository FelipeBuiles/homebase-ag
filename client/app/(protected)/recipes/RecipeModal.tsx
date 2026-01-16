"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RecipeModalForm } from "./RecipeModalForm";
import { createRecipeDraft } from "./actions";

type RecipeModalProps = {
  onImport?: (url: string) => void | Promise<void | string | { id: string }>;
};

export function RecipeModal({ onImport }: RecipeModalProps) {
  const handleImport = onImport ?? ((url: string) => createRecipeDraft({ sourceUrl: url }));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2">Add Recipe</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Recipe</DialogTitle>
          <DialogDescription>
            We&apos;ll fill what we can—edit anything.
          </DialogDescription>
        </DialogHeader>
        <RecipeModalForm onImport={handleImport} />
      </DialogContent>
    </Dialog>
  );
}
