import { afterEach, describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { resetDb } from "@/tests/utils/db";
import { GET } from "@/app/api/recipes/[id]/route";

describe("recipes api", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("returns 404 for missing recipe", async () => {
    const request = new Request("http://localhost/api/recipes/missing");
    const res = await GET(request, { params: Promise.resolve({ id: "missing" }) });
    expect(res.status).toBe(404);
  });

  it("returns recipe payload", async () => {
    const recipe = await prisma.recipe.create({
      data: {
        name: "Soup",
        status: "ready",
        imageUrl: "https://example.com/recipe.jpg",
        ingredients: { create: [{ name: "Water" }] },
      },
      include: { ingredients: true },
    });

    const request = new Request(`http://localhost/api/recipes/${recipe.id}`);
    const res = await GET(request, { params: Promise.resolve({ id: recipe.id }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe(recipe.id);
    expect(body.ingredients.length).toBe(1);
    expect(body.imageUrl).toBe("https://example.com/recipe.jpg");
  });
});
