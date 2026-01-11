import prisma from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Calendar, Package } from "lucide-react";
import Link from "next/link";
import { deletePantryItem } from "./actions";
import { Badge } from "@/components/ui/badge";

async function getPantryItems() {
  return await prisma.pantryItem.findMany({
    orderBy: { expirationDate: 'asc' } // Expiring soonest first
  });
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

function getExpirationStatus(date: Date | null): { label: string; color: BadgeVariant } {
    if (!date) return { label: "No Date", color: "secondary" };
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays < 0) return { label: "Expired", color: "destructive" };
    if (diffDays <= 3) return { label: "Expiring Soon", color: "destructive" }; // reusing destructive for warning tone
    if (diffDays <= 7) return { label: "Use Soon", color: "secondary" }; // yellowish? default to secondary for now
    return { label: "Good", color: "outline" };
}

export default async function PantryPage() {
  const items = await getPantryItems();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground">Pantry</h1>
          <p className="text-muted-foreground">Track what you have.</p>
        </div>
        <Link href="/pantry/new">
          <Button className="gap-2">
            <Plus size={16} /> Add Item
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {items.map((item) => {
            const status = getExpirationStatus(item.expirationDate);
            return (
                <Card key={item.id} className="group relative">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{item.name}</CardTitle>
                            {item.expirationDate && (
                                <Badge variant={status.color}>{status.label}</Badge>
                            )}
                        </div>
                        <CardDescription>{item.quantity} {item.unit}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                            {item.expirationDate && (
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>Expires: {item.expirationDate.toLocaleDateString()}</span>
                                </div>
                            )}
                             {item.category && (
                                <div className="flex items-center gap-2">
                                    <Package size={14} />
                                    <span>{item.category}</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <form action={deletePantryItem.bind(null, item.id)}>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                    <Trash2 size={14} />
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            );
        })}
        {items.length === 0 && (
             <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>Pantry is empty.</p>
             </div>
        )}
      </div>
    </div>
  );
}
