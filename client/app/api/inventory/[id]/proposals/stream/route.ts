import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastCount = -1;
      let active = true;

      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "connected" });

      while (active) {
        const count = await prisma.proposal.count({
          where: {
            status: "pending",
            changes: {
              some: {
                entityType: "InventoryItem",
                entityId: id,
              },
            },
          },
        });
        if (count !== lastCount) {
          lastCount = count;
          send({ type: "count", count });
        }
        await wait(5000);
      }
    },
    cancel() {
      return;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
