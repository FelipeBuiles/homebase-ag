import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteInventoryAttachment, deleteInventoryItem, moveInventoryAttachment, requestInventoryEnrichment, updateInventoryItem } from "../actions";
import { InventoryProposalPreview } from "../InventoryProposalPreview";
import { InventoryProposalLiveUpdates } from "../InventoryProposalLiveUpdates";
import { DEFAULT_INVENTORY_CATEGORIES, isInventoryEnrichmentPending } from "@/lib/inventory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const pendingProposals = await prisma.proposal.findMany({
    where: {
      status: "pending",
      changes: {
        some: {
          entityType: "InventoryItem",
          entityId: params.id,
        },
      },
    },
    include: { changes: true },
    orderBy: { createdAt: "desc" },
  });
  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  if (!item) return notFound();
  const enrichmentPending = isInventoryEnrichmentPending(item);
  const headlineParts = [item.brand, item.model].filter(Boolean).join(" ");
  const hasHeadlineMetadata = Boolean(headlineParts || item.serialNumber || item.condition);
  const needsCategory = item.categories.length === 0;
  const needsRoom = item.rooms.length === 0;
  const complete = !needsCategory && !needsRoom && Boolean(item.name);
  const hasPhotoWithoutVision = item.attachments.some(
    (attachment) => attachment.kind === "photo" && !attachment.metadata
  );
  const enrichmentStatus = item.enrichmentStatus ?? "idle";
  const enrichmentFailed = enrichmentStatus === "failed";
  const enrichmentRunning = enrichmentStatus === "pending" || enrichmentStatus === "running";

  return (
    <div className="page-container">
      <InventoryProposalLiveUpdates itemId={params.id} initialCount={pendingProposals.length} />
      <div className="page-header">
        <div>
          <Link href="/inventory" className="page-eyebrow flex items-center gap-2">
            <ArrowLeft size={14} /> Back to Inventory
          </Link>
          <h1 className="page-title">{item.name}</h1>
          {hasHeadlineMetadata && (
            <div className="mt-2 text-sm text-muted-foreground">
              {headlineParts && <span>{headlineParts}</span>}
              {item.serialNumber && (
                <span className={headlineParts ? "ml-2 font-mono" : "font-mono"}>#{item.serialNumber}</span>
              )}
              {item.condition && (
                <span className="ml-2">· {item.condition}</span>
              )}
            </div>
          )}
          <p className="page-subtitle">Update details, rooms, and attachments.</p>
        </div>
        <div className="page-actions">
          {enrichmentRunning && <Badge variant="secondary">Enrichment running</Badge>}
          {!enrichmentRunning && enrichmentPending && <Badge variant="outline">Enrichment queued</Badge>}
          {enrichmentFailed && <Badge variant="destructive">Enrichment failed</Badge>}
          {complete ? (
            <Badge variant="default">Complete</Badge>
          ) : (
            <>
              {needsCategory && <Badge variant="outline">Needs category</Badge>}
              {needsRoom && <Badge variant="outline">Needs room</Badge>}
            </>
          )}
          <form action={requestInventoryEnrichment.bind(null, item.id)}>
            <Button variant="outline" size="sm">Re-run enrichment</Button>
          </form>
          <form action={deleteInventoryItem.bind(null, item.id)}>
            <Button variant="destructive" size="sm" className="gap-2">
              <Trash2 size={14} /> Delete
            </Button>
          </form>
        </div>
      </div>

      {quick && (
        <Card className="mb-6 bg-secondary/60">
          <CardHeader>
            <CardTitle className="text-lg">Finish this item</CardTitle>
            <CardDescription>
              Photo saved. We will enrich details when processing completes.
            </CardDescription>
            <div className="mt-2">
              <Badge variant="secondary">Enrichment pending</Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {pendingProposals.length > 0 && (
        <Card className="mb-6 bg-card/80">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Pending enrichment</CardTitle>
                <CardDescription>Review suggested updates for this item.</CardDescription>
              </div>
              <Link href="/review" className="nav-pill">
                Open review
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <InventoryProposalPreview
              proposals={pendingProposals.map((proposal) => ({
                id: proposal.id,
                agentId: proposal.agentId,
                summary: proposal.summary,
                createdAt: proposal.createdAt.toLocaleString(),
                changes: proposal.changes.map((change) => ({
                  id: change.id,
                  confidence: change.confidence,
                  rationale: change.rationale,
                  before: change.before,
                  after: change.after,
                })),
              }))}
            />
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
          <CardDescription>Photos and videos stay with this item.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {enrichmentRunning && (
            <div className="sm:col-span-2 rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
              Enrichment is running. This usually takes a minute.
            </div>
          )}
          {enrichmentFailed && (
            <div className="sm:col-span-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Enrichment failed{item.enrichmentError ? `: ${item.enrichmentError}` : "."}
            </div>
          )}
          {hasPhotoWithoutVision && (
            <div className="sm:col-span-2 rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
              Vision analysis hasn’t completed yet for one or more photos. This can happen if the vision model
              is unavailable or still warming up.
            </div>
          )}
          {item.attachments.length === 0 ? (
            <div className="text-sm text-muted-foreground">No attachments yet.</div>
          ) : (
            item.attachments.map((attachment, index) => {
              const metadata = attachment.metadata as {
                labels?: string[];
                ocr?: string[];
                summary?: string;
              } | null;
              const hasMetadata = Boolean(metadata?.summary || metadata?.labels?.length || metadata?.ocr?.length);
              return (
              <div key={attachment.id} className="rounded-2xl border border-border/60 bg-background/70 p-3">
                {attachment.kind === "photo" ? (
                  <div className="relative h-40 w-full overflow-hidden rounded-xl">
                    <Image
                      src={attachment.url}
                      alt={`${item.name} attachment`}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <video src={attachment.url} className="h-40 w-full rounded-xl object-cover" controls />
                )}
                {hasMetadata && (
                  <div className="mt-3 rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground space-y-1">
                    {metadata?.summary && <div>{metadata.summary}</div>}
                    {metadata?.labels?.length ? (
                      <div>
                        <span className="font-medium text-foreground/80">Labels:</span>{" "}
                        {metadata.labels.join(", ")}
                      </div>
                    ) : null}
                    {metadata?.ocr?.length ? (
                      <div className="font-mono">
                        <span className="font-sans font-medium text-foreground/80">OCR:</span>{" "}
                        {metadata.ocr.join(" · ")}
                      </div>
                    ) : null}
                  </div>
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
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Item details</CardTitle>
          <CardDescription>Update details and keep your inventory accurate.</CardDescription>
        </CardHeader>
        <form action={updateInventoryItem.bind(null, item.id)}>
          <CardContent className="grid gap-6 md:grid-cols-5">
            <div className="md:col-span-3 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" name="name" defaultValue={item.name} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={item.description ?? ""} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" name="brand" defaultValue={item.brand ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" name="model" defaultValue={item.model ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select name="condition" defaultValue={item.condition ?? undefined}>
                    <SelectTrigger id="condition">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Like New">Like New</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial</Label>
                  <Input id="serialNumber" name="serialNumber" defaultValue={item.serialNumber ?? ""} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachments">Add attachments</Label>
                <Input id="attachments" name="attachments" type="file" multiple accept="image/*,video/*" />
                <p className="text-xs text-muted-foreground">Upload more photos or videos (optional).</p>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 space-y-3">
                <div>
                  <Label>Categories</Label>
                  <p className="text-xs text-muted-foreground">Select one or more.</p>
                </div>
                <div className="grid gap-2 max-h-40 overflow-auto pr-2 text-sm">
                  {DEFAULT_INVENTORY_CATEGORIES.map((category) => (
                    <label key={category} className="flex items-center gap-2">
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
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 space-y-3">
                <div>
                  <Label>Rooms</Label>
                  <p className="text-xs text-muted-foreground">Add a new room or pick existing ones.</p>
                </div>
                <Input id="newRoom" name="newRoom" placeholder="Add a new room" />
                <div className="grid gap-2 max-h-32 overflow-auto pr-2 text-sm">
                  {rooms.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No rooms yet.</p>
                  ) : (
                    rooms.map((room) => (
                      <label key={room.id} className="flex items-center gap-2">
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
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 space-y-3">
                <div>
                  <Label>Tags</Label>
                  <p className="text-xs text-muted-foreground">Keep this short and specific.</p>
                </div>
                <Input id="newTag" name="newTag" placeholder="Add a new tag" />
                <div className="grid gap-2 max-h-32 overflow-auto pr-2 text-sm">
                  {tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tags yet.</p>
                  ) : (
                    tags.map((tag) => (
                      <label key={tag.id} className="flex items-center gap-2">
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
              </div>
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
