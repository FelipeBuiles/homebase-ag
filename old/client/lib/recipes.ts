import prisma from "@/lib/prisma";
import { parseIngredientLine } from "@/lib/ingredients";

type RecipeField = "name" | "description" | "instructions" | "ingredients";

type EditedMap = Partial<Record<RecipeField, boolean>>;

type ParsedRecipe = {
  name: string;
  description: string;
  instructions: string;
  ingredients: Array<{ name: string }>;
};

type CurrentRecipe = {
  name: string;
  description: string;
  instructions: string;
  ingredients: Array<{ name: string }>;
};

export const mergeParsedRecipe = (
  current: CurrentRecipe,
  parsed: ParsedRecipe,
  edited: EditedMap,
) => {
  return {
    name: edited.name ? current.name : parsed.name,
    description: edited.description ? current.description : parsed.description,
    instructions: edited.instructions ? current.instructions : parsed.instructions,
    ingredients: edited.ingredients ? current.ingredients : parsed.ingredients,
  };
};

type ParsedRecipePayload = {
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string | null;
};

export const applyParsedRecipe = async (
  recipeId: string,
  parsed: ParsedRecipePayload,
) => {
  const current = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { imageUrl: true },
  });
  const imageUrl = current?.imageUrl ?? parsed.imageUrl ?? null;
  const instructions = parsed.instructions.join("\n");
  await prisma.$transaction([
    prisma.recipeIngredient.deleteMany({ where: { recipeId } }),
    prisma.recipe.update({
      where: { id: recipeId },
      data: {
        name: parsed.name,
        description: parsed.description,
        instructions,
        imageUrl,
        parsingStatus: "filled",
        parsingError: null,
        parsingUpdatedAt: new Date(),
        ingredients: {
          create: parsed.ingredients.map((entry) => parseIngredientLine(entry)),
        },
      },
    }),
  ]);
};
