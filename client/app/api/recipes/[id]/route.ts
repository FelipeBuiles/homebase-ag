import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { ingredients: true },
  });

  if (!recipe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    instructions: recipe.instructions,
    sourceUrl: recipe.sourceUrl,
    imageUrl: recipe.imageUrl,
    status: recipe.status,
    parsingStatus: recipe.parsingStatus,
    parsingError: recipe.parsingError,
    parsingUpdatedAt: recipe.parsingUpdatedAt,
    ingredients: recipe.ingredients,
    updatedAt: recipe.updatedAt,
  });
}
