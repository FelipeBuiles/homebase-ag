import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { getGroceryList } from "@/lib/db/queries/groceries";
import { GroceryDetailClient } from "@/components/groceries/grocery-detail-client";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GroceryListPage({ params }: PageProps) {
  const { id } = await params;
  const list = await getGroceryList(id);
  if (!list) notFound();

  return (
    <PageShell
      title={list.name}
      action={
        <Button variant="ghost" size="sm" render={<Link href="/groceries" />}>
          <ChevronLeft className="h-4 w-4" />
          All lists
        </Button>
      }
    >
      <GroceryDetailClient
        listId={list.id}
        listName={list.name}
        initialItems={list.items}
      />
    </PageShell>
  );
}
