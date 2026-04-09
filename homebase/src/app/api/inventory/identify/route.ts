import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getModel } from "@/lib/llm/client";
import { generateJson } from "@/lib/llm/generate-json";

const IdentifySchema = z.object({
  name: z.string().describe("The specific name of the item (e.g. 'KitchenAid Stand Mixer', 'Dyson V11 Vacuum')"),
  brand: z.string().optional().describe("Brand name if visible"),
  categories: z.array(z.string()).describe("Product categories e.g. Appliances, Electronics, Tools"),
  rooms: z.array(z.string()).describe("Rooms where this item belongs e.g. Kitchen, Living Room"),
  tags: z.array(z.string()).describe("Short descriptive tags e.g. countertop, cordless, small-appliance"),
  condition: z.enum(["good", "fair", "poor"]).describe("Visible condition of the item"),
  rationale: z.string().describe("One sentence describing what you see"),
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const model = await getModel("enrichment", "vision");

    const object = await generateJson({
      model,
      schema: IdentifySchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Identify this household item from the photo and return a JSON object with these fields: name (specific, include brand/model if visible), brand (if visible), categories (array, e.g. ["Appliances"]), rooms (array, e.g. ["Kitchen"]), tags (array of short descriptors), condition ("good", "fair", or "poor"), rationale (one sentence).`,
            },
            {
              type: "image",
              image: buffer,
            },
          ],
        },
      ],
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("[identify]", err);
    return NextResponse.json({ error: "Failed to identify item" }, { status: 500 });
  }
}
