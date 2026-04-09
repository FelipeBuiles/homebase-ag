import { Suspense } from "react";
import Link from "next/link";
import { Plus, ChefHat } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import { ListSkeleton } from "@/components/layout/loading-skeleton";
import { listRecipes } from "@/lib/db/queries/recipes";
import { RecipeListClient } from "@/components/recipes/recipe-list-client";
import { UrlImportForm } from "@/components/recipes/url-import-form";
import { cn } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string }>;
}

const statusFilters = [
  { value: undefined, label: "All" },
  { value: "parsed",  label: "Parsed" },
  { value: "pending", label: "Parsing" },
  { value: "failed",  label: "Failed" },
];

export default async function RecipesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <PageShell
      title="Recipes"
      action={
        <Button size="sm" render={<Link href="/recipes/new" />}>
          <Plus className="h-4 w-4" />
          Add recipe
        </Button>
      }
    >
      <div className="space-y-4">
        <UrlImportForm />

        <div className="flex items-center gap-2 flex-wrap">
          {statusFilters.map((f) => (
            <Link
              key={f.label}
              href={f.value ? `/recipes?status=${f.value}` : "/recipes"}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                params.status === f.value || (!params.status && !f.value)
                  ? "bg-accent-500 text-white"
                  : "bg-base-100 text-base-600 hover:bg-base-200"
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <Suspense fallback={<ListSkeleton />}>
          <RecipeList params={params} />
        </Suspense>
      </div>
    </PageShell>
  );
}

async function RecipeList({ params }: { params: { search?: string; status?: string } }) {
  const recipes = await listRecipes({ search: params.search, parseStatus: params.status });

  if (recipes.length === 0) {
    return (
      <EmptyState
        icon={<ChefHat className="h-10 w-10" />}
        heading="No recipes yet"
        description="Import a recipe from a URL or add one manually."
      />
    );
  }

  return <RecipeListClient recipes={recipes} />;
}
