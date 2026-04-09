"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { importFromUrl } from "@/actions/recipes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export function UrlImportForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");

  const { execute, isPending } = useAction(importFromUrl, {
    onSuccess: ({ data }) => {
      toast.success("Import started — parsing in background");
      router.push(`/recipes/${data?.recipe?.id}`);
    },
    onError: ({ error }) => {
      toast.error(error.validationErrors?.url?._errors?.[0] ?? "Failed to import recipe");
    },
  });

  return (
    <div className="rounded-lg border border-agent-border bg-agent-bg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-agent-text" />
        <p className="text-sm font-medium text-agent-text">Import from URL</p>
      </div>
      <p className="text-xs text-agent-text/80">
        Paste a recipe URL and the agent will extract the title, ingredients, and instructions automatically.
      </p>
      <form
        onSubmit={(e) => { e.preventDefault(); execute({ url }); }}
        className="flex gap-2"
      >
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          type="url"
          required
          className="flex-1"
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Importing…" : "Import"}
        </Button>
      </form>
    </div>
  );
}
