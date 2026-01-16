"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRecipe, finalizeRecipe, updateRecipeDraft } from "./actions";
import type { ParsingStatus } from "@/lib/recipes-status";

type RecipeModalFormProps = {
  onImport?: (url: string) => void | Promise<void | string | { id: string }>;
};

export function RecipeModalForm({ onImport }: RecipeModalFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"import" | "manual">("import");
  const [sourceUrl, setSourceUrl] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "parsing" | "done" | "error">("idle");
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [parsingStatus, setParsingStatus] = useState<ParsingStatus>("idle");
  const [hasHydrated, setHasHydrated] = useState(false);
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    ingredients: "",
    instructions: "",
  });
  const isParsing = importStatus === "parsing";

  const formatIngredients = (
    items: Array<{ name?: string; quantity?: string | null; unit?: string | null }>
  ) =>
    items
      .map((item) =>
        [item.quantity, item.unit, item.name]
          .filter((entry) => Boolean(entry && entry.toString().trim().length > 0))
          .join(" ")
          .trim()
      )
      .filter((entry) => entry.length > 0)
      .join("\n");

  const handleImport = async () => {
    if (!onImport) return;
    setMode("manual");
    setImportStatus("parsing");
    setParsingStatus("pending");
    setRecipeId(null);
    setHasHydrated(false);
    setFormValues({
      name: "",
      description: "",
      ingredients: "",
      instructions: "",
    });
    try {
      const result = await onImport(sourceUrl.trim());
      if (typeof result === "string") {
        setRecipeId(result);
        router.refresh();
        toast.success("Import started", {
          description: "You can close this modal while we parse.",
        });
      } else if (result && typeof (result as { id?: string }).id === "string") {
        setRecipeId((result as { id: string }).id);
        router.refresh();
        toast.success("Import started", {
          description: "You can close this modal while we parse.",
        });
      }
    } catch {
      setImportStatus("error");
      toast.error("Could not start import");
    }
  };

  const isParsingStatus = (value: string): value is ParsingStatus =>
    ["idle", "pending", "parsing", "filled", "error"].includes(value);

  useEffect(() => {
    if (!recipeId || importStatus !== "parsing") return;

    let isActive = true;
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/recipes/${recipeId}`);
        if (!response.ok) throw new Error("Failed to fetch recipe");
        const data = await response.json();
        if (!isActive) return;
        const status = data.parsingStatus as string | undefined;
        if (status && isParsingStatus(status)) {
          setParsingStatus(status);
          if (status === "filled") {
            setImportStatus("done");
            router.refresh();
            if (!hasHydrated) {
              setFormValues({
                name: data.name ?? "",
                description: data.description ?? "",
                instructions: data.instructions ?? "",
                ingredients: formatIngredients(data.ingredients ?? []),
              });
              setHasHydrated(true);
            }
          }
          if (status === "error") {
            setImportStatus("error");
            router.refresh();
          }
        }
      } catch {
        if (isActive) {
          setImportStatus("error");
          setParsingStatus("error");
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [importStatus, recipeId, hasHydrated, router]);

  const stepper = useMemo(() => {
    if (importStatus === "idle") return null;
    const parseDone = parsingStatus === "filled";
    const parseActive = !parseDone && importStatus === "parsing";
    return [
      { label: "Fetch", state: recipeId ? "done" : "active" },
      { label: "Parse", state: parseDone ? "done" : parseActive ? "active" : "pending" },
      { label: "Fill", state: parseDone ? "done" : "pending" },
    ];
  }, [importStatus, parsingStatus, recipeId]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sourceUrl">Recipe URL</Label>
        <Input
          id="sourceUrl"
          name="sourceUrl"
          placeholder="https://"
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
        />
        {mode === "import" && (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              disabled={!sourceUrl.trim()}
              onClick={handleImport}
            >
              Import Recipe
            </Button>
            <Button
              type="button"
              variant="link"
              className="px-0 text-xs"
              onClick={() => setMode("manual")}
            >
              Add without a URL
            </Button>
          </div>
        )}
        {stepper && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {stepper.map((step) => (
              <div key={step.label} className="flex items-center gap-2">
                <span
                  className={
                    step.state === "done"
                      ? "text-primary"
                      : step.state === "active"
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }
                >
                  {step.label}
                </span>
                {step.label !== "Fill" && <span className="text-muted-foreground">•</span>}
              </div>
            ))}
          </div>
        )}
        {isParsing && (
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Parsing in progress</p>
                <p className="text-xs text-muted-foreground">
                  We&apos;ll fill the form automatically when it&apos;s ready.
                </p>
              </div>
            </div>
          </div>
        )}
        {importStatus === "done" && (
          <p className="text-xs text-muted-foreground">Parsing complete.</p>
        )}
        {importStatus === "error" && (
          <p className="text-xs text-destructive">Parsing failed. Continue manually.</p>
        )}
      </div>

      {mode === "manual" && (
        <form
          action={async (formData) => {
            const draftId = formData.get("draftId") as string | null;
            if (draftId) {
              await updateRecipeDraft(formData);
              await finalizeRecipe(draftId);
              return;
            }
            await createRecipe(formData);
          }}
          className="space-y-4"
        >
          <input type="hidden" name="draftId" value={recipeId ?? ""} />
          <input type="hidden" name="recipeId" value={recipeId ?? ""} />
          <input type="hidden" name="sourceUrl" value={sourceUrl} />
          <div className="space-y-2">
            <Label htmlFor="name">Recipe Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Weeknight pasta"
              value={formValues.name}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, name: event.target.value }))
              }
              disabled={isParsing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              className="min-h-[96px]"
              value={formValues.description}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, description: event.target.value }))
              }
              disabled={isParsing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ingredients">Ingredients</Label>
            <Textarea
              id="ingredients"
              name="ingredients"
              className="min-h-[120px]"
              value={formValues.ingredients}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, ingredients: event.target.value }))
              }
              disabled={isParsing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              name="instructions"
              className="min-h-[120px]"
              value={formValues.instructions}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, instructions: event.target.value }))
              }
              disabled={isParsing}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isParsing}>
              Save Recipe
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
