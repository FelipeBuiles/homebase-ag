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
import { getPantryCoverageForRecipes } from "@/lib/recipes/pantry-coverage";
import { Input } from "@/components/ui/input";
import { getI18n } from "@/lib/i18n/server";

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
  const { t } = await getI18n();

  return (
    <PageShell
      title={t("pages.recipes.title")}
      description={t("pages.recipes.description")}
      action={
        <Button size="sm" nativeButton={false} render={<Link href="/recipes/new" />}>
          <Plus className="h-4 w-4" />
          {t("pages.recipes.addRecipe")}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="rounded-2xl border border-base-200 bg-white p-4 shadow-sm">
            <form method="get" className="flex gap-2">
              <Input
                name="search"
                defaultValue={params.search}
                placeholder={t("pages.recipes.searchPlaceholder")}
                className="flex-1"
              />
              {params.status && <input type="hidden" name="status" value={params.status} />}
              <Button type="submit" size="sm" variant="outline">
                {t("common.search")}
              </Button>
            </form>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {statusFilters.map((f) => (
                <Link
                  key={f.label}
                  href={
                    f.value
                      ? `/recipes?status=${f.value}${params.search ? `&search=${params.search}` : ""}`
                      : `/recipes${params.search ? `?search=${params.search}` : ""}`
                  }
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    params.status === f.value || (!params.status && !f.value)
                      ? "bg-accent-500 text-white"
                      : "bg-base-100 text-base-600 hover:bg-base-200"
                  )}
                >
                  {f.value === "parsed"
                    ? t("pages.recipes.filter.parsed")
                    : f.value === "pending"
                      ? t("pages.recipes.filter.pending")
                      : f.value === "failed"
                        ? t("pages.recipes.filter.failed")
                        : t("pages.recipes.filter.all")}
                </Link>
              ))}
            </div>
          </div>

          <UrlImportForm />
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
  const coverageByRecipeId = await getPantryCoverageForRecipes(recipes.map((recipe) => recipe.id));

  if (recipes.length === 0) {
    return (
      <EmptyState
        icon={<ChefHat className="h-10 w-10" />}
        heading="No recipes yet"
        description="Import a recipe from a URL or add one manually."
      />
    );
  }

  return (
    <RecipeListClient
      recipes={recipes.map((recipe) => ({
        ...recipe,
        coverage: coverageByRecipeId.get(recipe.id) ?? null,
      }))}
    />
  );
}
