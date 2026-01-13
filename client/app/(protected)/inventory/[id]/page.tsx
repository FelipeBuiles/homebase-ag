import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteInventoryAttachment, deleteInventoryItem, moveInventoryAttachment, updateInventoryItem } from "../actions";
import { DEFAULT_INVENTORY_CATEGORIES } from "@/lib/inventory";

type SearchParams = Record<string, string | string[] | undefined>;

const getSearchParam = (searchParams: SearchParams, key: string) => {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
};

async function getItem(id: string) {
  try {
    return await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        rooms: true,
        tags: true,
        attachments: { orderBy: { order: "asc" } },
      },
    });
  } catch (error) {
    console.error("Failed to load inventory item", error);
    return null;
  }
}

export default async function InventoryDetailPage(props: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const quick = getSearchParam(searchParams, "quick");
  const item = await getItem(params.id);
  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  if (!item) return notFound();

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/inventory" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Inventory
        </Link>
        <form action={deleteInventoryItem.bind(null, item.id)}>
          <Button variant="destructive" size="sm" className="gap-2">
            <Trash2 size={14} /> Delete
          </Button>
        </form>
      </div>

      {quick && (
        <Card className="mb-6 bg-secondary/60">
          <CardHeader>
            <CardTitle className="text-lg">Finish this item</CardTitle>
            <CardDescription>
              Quick add saved this item. Fill in categories and rooms to complete it.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
          <CardDescription>Photos and videos stay with this item.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {item.attachments.length === 0 ? (
            <div className="text-sm text-muted-foreground">No attachments yet.</div>
          ) : (
            item.attachments.map((attachment, index) => (
              <div key={attachment.id} className="rounded-2xl border border-border/60 bg-background/70 p-3">
                {attachment.kind === "photo" ? (
                  <img
                    src={attachment.url}
                    alt={`${item.name} attachment`}
                    className="h-40 w-full rounded-xl object-cover"
                  />
                ) : (
                  <video src={attachment.url} className="h-40 w-full rounded-xl object-cover" controls />
                )}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Attachment {index + 1}</span>
                  <div className="flex items-center gap-2">
                    <form action={moveInventoryAttachment.bind(null, item.id, attachment.id, "up")}>
                      <Button type="submit" variant="outline" size="sm" disabled={index === 0}>
                        Move up
                      </Button>
                    </form>
                    <form action={moveInventoryAttachment.bind(null, item.id, attachment.id, "down")}>
                      <Button type="submit" variant="outline" size="sm" disabled={index === item.attachments.length - 1}>
                        Move down
                      </Button>
                    </form>
                    <form action={deleteInventoryAttachment.bind(null, item.id, attachment.id)}>
                      <Button type="submit" variant="ghost" size="sm">
                        Remove
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit Item</CardTitle>
          <CardDescription>Update details and keep your inventory accurate.</CardDescription>
        </CardHeader>
        <form action={updateInventoryItem.bind(null, item.id)} encType="multipart/form-data">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input id="name" name="name" defaultValue={item.name} required />
            </div>

            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {DEFAULT_INVENTORY_CATEGORIES.map((category) => (
                  <label key={category} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="categories"
                      value={category}
                      defaultChecked={item.categories.includes(category)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Select one or more categories.</p>
            </div>

            <div className="space-y-2">
              <Label>Rooms</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {rooms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No rooms yet.</p>
                ) : (
                  rooms.map((room) => (
                    <label key={room.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="rooms"
                        value={room.id}
                        defaultChecked={item.rooms.some((itemRoom) => itemRoom.id === room.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span>{room.name}</span>
                    </label>
                  ))
                )}
              </div>
              <Input id="newRoom" name="newRoom" placeholder="Add a new room" />
              <p className="text-xs text-muted-foreground">Add a new room or pick existing ones.</p>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tags yet.</p>
                ) : (
                  tags.map((tag) => (
                    <label key={tag.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="tags"
                        value={tag.id}
                        defaultChecked={item.tags.some((itemTag) => itemTag.id === tag.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span>{tag.name}</span>
                    </label>
                  ))
                )}
              </div>
              <Input id="newTag" name="newTag" placeholder="Add a new tag" />
              <p className="text-xs text-muted-foreground">Use tags to group items across rooms.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={item.description ?? ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachments">Add attachments</Label>
              <Input id="attachments" name="attachments" type="file" multiple accept="image/*,video/*" />
              <p className="text-xs text-muted-foreground">Upload more photos or videos (optional).</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">Save changes</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
