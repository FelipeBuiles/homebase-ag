import prisma from "@/lib/prisma";
import { createCountSseStream } from "@/lib/sse";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stream = createCountSseStream({
    signal: request.signal,
    intervalMs: 5000,
    getCount: () =>
      prisma.proposal.count({
        where: {
          status: "pending",
          changes: {
            some: {
              entityType: "InventoryItem",
              entityId: id,
            },
          },
        },
      }),
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
