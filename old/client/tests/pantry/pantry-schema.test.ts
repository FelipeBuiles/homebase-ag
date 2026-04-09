import { describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";

// Ensures runtime reads include the new fields.

describe("pantry schema", () => {
  it("reads status and location fields", async () => {
    const item = await prisma.pantryItem.create({
      data: {
        name: "Rice",
        quantity: "1",
        unit: "bag",
        location: "Pantry",
        status: "in_stock",
      },
    });

    const fetched = await prisma.pantryItem.findUnique({ where: { id: item.id } });
    expect(fetched?.status).toBe("in_stock");
    expect(fetched?.location).toBe("Pantry");
  });
});
