import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createRoom, createTag, deleteRoom, deleteTag, updateRoom, updateTag } from "./organization-actions";

export async function OrganizationSettings() {
  const rooms = await prisma.room.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <Card className="bg-card/80">
      <CardHeader>
        <CardTitle>Organization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-10">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Rooms</h3>
              <p className="text-sm text-muted-foreground">Track where items live in the home.</p>
            </div>
            <form action={createRoom} className="flex flex-wrap items-center gap-2">
              <Input name="name" placeholder="Add room" className="min-w-[200px]" />
              <Button type="submit">Add</Button>
            </form>
          </div>
          <div className="space-y-3">
            {rooms.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rooms yet.</p>
            ) : (
              rooms.map((room) => (
                <div key={room.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-background/70 p-3">
                  <form action={updateRoom.bind(null, room.id)} className="flex flex-1 flex-wrap items-center gap-2">
                    <Input name="name" defaultValue={room.name} className="min-w-[200px]" />
                    <Button type="submit" variant="outline" size="sm">
                      Save
                    </Button>
                  </form>
                  <Badge variant="secondary">{room._count.items} items</Badge>
                  <form action={deleteRoom.bind(null, room.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Remove
                    </Button>
                  </form>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Tags</h3>
              <p className="text-sm text-muted-foreground">Use tags to group items across rooms.</p>
            </div>
            <form action={createTag} className="flex flex-wrap items-center gap-2">
              <Input name="name" placeholder="Add tag" className="min-w-[200px]" />
              <Button type="submit">Add</Button>
            </form>
          </div>
          <div className="space-y-3">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tags yet.</p>
            ) : (
              tags.map((tag) => (
                <div key={tag.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-background/70 p-3">
                  <form action={updateTag.bind(null, tag.id)} className="flex flex-1 flex-wrap items-center gap-2">
                    <Input name="name" defaultValue={tag.name} className="min-w-[200px]" />
                    <Button type="submit" variant="outline" size="sm">
                      Save
                    </Button>
                  </form>
                  <Badge variant="secondary">{tag._count.items} items</Badge>
                  <form action={deleteTag.bind(null, tag.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Remove
                    </Button>
                  </form>
                </div>
              ))
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
