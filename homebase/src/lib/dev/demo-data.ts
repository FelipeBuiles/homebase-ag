import type { Prisma } from "@prisma/client";
import { buildCanonicalKey } from "@/lib/db/queries/groceries";
import {
  encodeMealPlanSource,
  encodePantryRestockSource,
  encodeRecipeSource,
} from "@/lib/grocery-source";

type Tx = Prisma.TransactionClient;

function getCurrentMonday() {
  const date = new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysFrom(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function normalizeSeedName(value: string) {
  return value.trim().toLowerCase();
}

export async function clearDomainData(tx: Tx) {
  await tx.auditLog.deleteMany();
  await tx.proposal.deleteMany();
  await tx.mealPlanItem.deleteMany();
  await tx.mealPlan.deleteMany();
  await tx.groceryItem.deleteMany();
  await tx.groceryList.deleteMany();
  await tx.recipeIngredient.deleteMany();
  await tx.recipe.deleteMany();
  await tx.pantryItem.deleteMany();
  await tx.inventoryAttachment.deleteMany();
  await tx.inventoryItem.deleteMany();
}

export async function seedDemoData(tx: Tx) {
  const monday = getCurrentMonday();
  const now = new Date();
  const expiringSoon = daysFrom(now, 2);
  const expiringThisWeek = daysFrom(now, 5);
  const nextWeek = daysFrom(monday, 7);
  const thirdWeek = daysFrom(monday, 14);

  const inventoryDefinitions = [
    {
      name: "Countertop Blender",
      brand: "VitaMix",
      condition: "good",
      quantity: 1,
      categories: ["Appliance"],
      rooms: ["Kitchen"],
      tags: ["smoothies", "prep"],
      completeness: 100,
      enrichmentStatus: "done",
      notes: "Used for smoothies, soups, and quick sauces.",
      imageUrl:
        "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "Dutch Oven",
      brand: "Le Creuset",
      condition: "good",
      quantity: 1,
      categories: ["Cookware"],
      rooms: ["Kitchen"],
      tags: ["stew", "braise", "batch cooking"],
      completeness: 100,
      enrichmentStatus: "done",
      notes: "Heavy pot for soups, braises, and no-knead bread.",
      imageUrl:
        "https://images.unsplash.com/photo-1514986888952-8cd320577b68?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "Bulk Rice Bin",
      condition: "good",
      quantity: 1,
      categories: ["Storage"],
      rooms: ["Pantry"],
      tags: ["dry goods", "bulk"],
      completeness: 92,
      enrichmentStatus: "done",
      notes: "Clear bin with scoop for rice and grains.",
      imageUrl:
        "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "Chest Freezer",
      brand: "GE",
      condition: "good",
      quantity: 1,
      categories: ["Appliance"],
      rooms: ["Basement"],
      tags: ["storage", "freezer"],
      completeness: 95,
      enrichmentStatus: "done",
      notes: "Bulk storage for frozen fruit, stock, and make-ahead meals.",
      imageUrl:
        "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "Walnut Cutting Board",
      brand: "Sonder",
      condition: "good",
      quantity: 1,
      categories: ["Prep"],
      rooms: ["Kitchen"],
      tags: ["knife work", "serving"],
      completeness: 96,
      enrichmentStatus: "done",
      notes: "Large board used for prep and table service.",
      imageUrl:
        "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "Ceramic Pantry Jars",
      brand: "Hawkins New York",
      condition: "good",
      quantity: 3,
      categories: ["Storage"],
      rooms: ["Pantry"],
      tags: ["flour", "beans", "display"],
      completeness: 88,
      enrichmentStatus: "done",
      notes: "Set of countertop jars for flour, oats, and snacks.",
      imageUrl:
        "https://images.unsplash.com/photo-1495546968767-f0573cca821e?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "Espresso Grinder",
      brand: "Baratza",
      condition: "good",
      quantity: 1,
      categories: ["Appliance"],
      rooms: ["Kitchen"],
      tags: ["coffee", "morning"],
      completeness: 94,
      enrichmentStatus: "done",
      notes: "Dialed in for espresso and morning pour-overs.",
      imageUrl:
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
    },
    {
      name: "Weeknight Sheet Pan",
      brand: "Nordic Ware",
      condition: "good",
      quantity: 2,
      categories: ["Bakeware"],
      rooms: ["Kitchen"],
      tags: ["roasting", "easy dinners"],
      completeness: 90,
      enrichmentStatus: "done",
      notes: "Used for salmon, vegetables, and tray bakes.",
      imageUrl:
        "https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=1200&q=80",
    },
  ] as const;

  const inventoryItems = new Map<string, Awaited<ReturnType<typeof tx.inventoryItem.create>>>();
  for (const item of inventoryDefinitions) {
    const created = await tx.inventoryItem.create({
      data: {
        name: item.name,
        brand: item.brand,
        condition: item.condition,
        quantity: item.quantity,
        categories: [...item.categories],
        rooms: [...item.rooms],
        tags: [...item.tags],
        completeness: item.completeness,
        enrichmentStatus: item.enrichmentStatus,
        notes: item.notes,
      },
    });
    inventoryItems.set(item.name, created);
    await tx.inventoryAttachment.create({
      data: {
        itemId: created.id,
        url: item.imageUrl,
        mimeType: "image/jpeg",
        width: 1200,
        height: 900,
      },
    });
  }

  const pantryDefinitions = [
    { name: "Spaghetti", quantity: 2, unit: "box", expiresAt: daysFrom(now, 180), location: "Pantry shelf", notes: "Enough for two dinners." },
    { name: "Crushed tomatoes", quantity: 2, unit: "can", expiresAt: expiringSoon, location: "Pantry shelf", notes: "Front row; use first." },
    { name: "Garlic", quantity: 2, unit: "bulb", expiresAt: expiringSoon, location: "Counter basket" },
    { name: "Olive oil", quantity: 0.25, unit: "bottle", expiresAt: daysFrom(now, 120), location: "Stove side", notes: "Running low" },
    { name: "Chickpeas", quantity: 3, unit: "can", expiresAt: daysFrom(now, 240), location: "Pantry shelf" },
    { name: "Rice", quantity: 1.4, unit: "kg", expiresAt: daysFrom(now, 300), location: "Bulk bin", inventoryItemId: inventoryItems.get("Bulk Rice Bin")?.id },
    { name: "Onion", quantity: 4, unit: "unit", expiresAt: expiringThisWeek, location: "Counter basket" },
    { name: "Vegetable broth", quantity: 2, unit: "carton", expiresAt: daysFrom(now, 90), location: "Pantry shelf" },
    { name: "Cheddar cheese", quantity: 0.5, unit: "block", expiresAt: expiringThisWeek, location: "Fridge" },
    { name: "Frozen berries", quantity: 2, unit: "bag", expiresAt: daysFrom(now, 120), location: "Freezer", inventoryItemId: inventoryItems.get("Chest Freezer")?.id },
    { name: "Rolled oats", quantity: 1, unit: "bag", expiresAt: daysFrom(now, 140), location: "Pantry shelf", notes: "Breakfast staple" },
    { name: "Greek yogurt", quantity: 0.75, unit: "tub", expiresAt: daysFrom(now, 9), location: "Fridge" },
    { name: "Milk", quantity: 1, unit: "carton", expiresAt: daysFrom(now, 6), location: "Fridge door" },
    { name: "Eggs", quantity: 10, unit: "unit", expiresAt: daysFrom(now, 12), location: "Fridge shelf" },
    { name: "Butter", quantity: 1, unit: "block", expiresAt: daysFrom(now, 45), location: "Fridge door" },
    { name: "Baby spinach", quantity: 1, unit: "box", expiresAt: daysFrom(now, 4), location: "Fridge crisper" },
    { name: "Lemons", quantity: 3, unit: "unit", expiresAt: daysFrom(now, 10), location: "Fruit bowl" },
    { name: "Bread", quantity: 1, unit: "loaf", expiresAt: daysFrom(now, 5), location: "Bread box" },
    { name: "Tomato soup", quantity: 2, unit: "can", expiresAt: daysFrom(now, 210), location: "Pantry shelf" },
    { name: "Coconut milk", quantity: 2, unit: "can", expiresAt: daysFrom(now, 200), location: "Pantry shelf" },
    { name: "Red lentils", quantity: 1, unit: "bag", expiresAt: daysFrom(now, 220), location: "Pantry shelf" },
    { name: "Salmon fillets", quantity: 2, unit: "fillet", expiresAt: daysFrom(now, 3), location: "Fridge", notes: "Cook by Thursday" },
    { name: "Broccoli", quantity: 2, unit: "crown", expiresAt: daysFrom(now, 4), location: "Fridge crisper" },
    { name: "Soy sauce", quantity: 1, unit: "bottle", expiresAt: daysFrom(now, 150), location: "Pantry shelf" },
    { name: "Maple syrup", quantity: 0.5, unit: "bottle", expiresAt: daysFrom(now, 260), location: "Pantry shelf" },
    { name: "Coffee beans", quantity: 0.2, unit: "bag", expiresAt: daysFrom(now, 25), location: "Coffee station", inventoryItemId: inventoryItems.get("Espresso Grinder")?.id, notes: "Enough for two mornings" },
    { name: "Panko breadcrumbs", quantity: 1, unit: "box", expiresAt: daysFrom(now, 190), location: "Pantry shelf" },
    { name: "Black beans", quantity: 4, unit: "can", expiresAt: daysFrom(now, 260), location: "Pantry shelf" },
    { name: "Flour tortillas", quantity: 2, unit: "pack", expiresAt: daysFrom(now, 18), location: "Bread box" },
    { name: "Corn tortillas", quantity: 1, unit: "pack", expiresAt: daysFrom(now, 12), location: "Fridge drawer" },
    { name: "Quinoa", quantity: 1, unit: "bag", expiresAt: daysFrom(now, 240), location: "Pantry shelf" },
    { name: "Feta", quantity: 1, unit: "block", expiresAt: daysFrom(now, 14), location: "Fridge" },
    { name: "Cucumbers", quantity: 2, unit: "unit", expiresAt: daysFrom(now, 6), location: "Fridge crisper" },
    { name: "Cherry tomatoes", quantity: 2, unit: "pint", expiresAt: daysFrom(now, 5), location: "Counter basket" },
    { name: "Chicken thighs", quantity: 6, unit: "piece", expiresAt: daysFrom(now, 3), location: "Fridge" },
    { name: "Potatoes", quantity: 8, unit: "unit", expiresAt: daysFrom(now, 40), location: "Pantry floor bin" },
    { name: "Carrots", quantity: 8, unit: "unit", expiresAt: daysFrom(now, 18), location: "Fridge crisper" },
    { name: "Ground turkey", quantity: 1, unit: "pack", expiresAt: daysFrom(now, 2), location: "Fridge", notes: "Use for chili early in the week" },
    { name: "Orzo", quantity: 1, unit: "box", expiresAt: daysFrom(now, 200), location: "Pantry shelf" },
    { name: "Mozzarella", quantity: 1, unit: "ball", expiresAt: daysFrom(now, 7), location: "Fridge" },
    { name: "Marinara", quantity: 2, unit: "jar", expiresAt: daysFrom(now, 180), location: "Pantry shelf" },
    { name: "Peanut butter", quantity: 1, unit: "jar", expiresAt: daysFrom(now, 220), location: "Pantry shelf" },
    { name: "Jam", quantity: 1, unit: "jar", expiresAt: daysFrom(now, 160), location: "Fridge door" },
    { name: "Pesto", quantity: 1, unit: "jar", expiresAt: daysFrom(now, 20), location: "Fridge" },
    { name: "Cannellini beans", quantity: 2, unit: "can", expiresAt: daysFrom(now, 230), location: "Pantry shelf" },
    { name: "Granola", quantity: 1, unit: "bag", expiresAt: daysFrom(now, 90), location: "Pantry shelf" },
    { name: "Bell peppers", quantity: 3, unit: "unit", expiresAt: daysFrom(now, 6), location: "Fridge crisper" },
    { name: "Salsa", quantity: 1, unit: "jar", expiresAt: daysFrom(now, 80), location: "Fridge door" },
    { name: "Avocados", quantity: 3, unit: "unit", expiresAt: daysFrom(now, 4), location: "Counter basket" },
    { name: "Tuna", quantity: 3, unit: "can", expiresAt: daysFrom(now, 260), location: "Pantry shelf" },
    { name: "Mayonnaise", quantity: 1, unit: "jar", expiresAt: daysFrom(now, 120), location: "Fridge door" },
    { name: "Celery", quantity: 1, unit: "bunch", expiresAt: daysFrom(now, 9), location: "Fridge crisper" },
    { name: "Apples", quantity: 8, unit: "unit", expiresAt: daysFrom(now, 16), location: "Fruit bowl" },
    { name: "Honey", quantity: 1, unit: "jar", expiresAt: daysFrom(now, 300), location: "Pantry shelf" },
    { name: "Plain bagels", quantity: 1, unit: "pack", expiresAt: daysFrom(now, 5), location: "Bread box" },
    { name: "Cream cheese", quantity: 1, unit: "tub", expiresAt: daysFrom(now, 12), location: "Fridge" },
  ] as const;

  const pantryItems = await Promise.all(
    pantryDefinitions.map((item) =>
      tx.pantryItem.create({
        data: {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          expiresAt: item.expiresAt,
          location: item.location,
          inventoryItemId: item.inventoryItemId,
          notes: item.notes,
        },
      })
    )
  );
  const pantryByName = new Map(pantryItems.map((item) => [item.name, item]));

  const recipeDefinitions = [
    {
      title: "Weeknight Tomato Pasta",
      description: "Fast pantry pasta with garlic, tomatoes, and a bright basil finish.",
      sourceUrl: "https://www.simplyrecipes.com/quick-tomato-pasta",
      imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 4,
      prepMinutes: 10,
      cookMinutes: 20,
      instructions:
        "1. Bring a large pot of salted water to a boil and cook the spaghetti until just shy of al dente.\n2. While the pasta cooks, warm the olive oil in a skillet and saute the garlic until fragrant but not browned.\n3. Add the crushed tomatoes, a pinch of salt, and black pepper, then simmer until slightly thickened.\n4. Reserve a splash of pasta water, drain the spaghetti, and toss it into the sauce until glossy.\n5. Finish with torn basil and plenty of parmesan before serving.",
      ingredients: [
        { raw: "1 box spaghetti", name: "Spaghetti", quantity: "1", unit: "box", normalizedName: "spaghetti", sortOrder: 0 },
        { raw: "2 cans crushed tomatoes", name: "Crushed tomatoes", quantity: "2", unit: "can", normalizedName: "crushed tomatoes", sortOrder: 1 },
        { raw: "4 cloves garlic", name: "Garlic", quantity: "1", unit: "bulb", normalizedName: "garlic", sortOrder: 2 },
        { raw: "2 tbsp olive oil", name: "Olive oil", quantity: "2", unit: "tbsp", normalizedName: "olive oil", sortOrder: 3 },
        { raw: "1 bunch basil", name: "Basil", quantity: "1", unit: "bunch", normalizedName: "basil", sortOrder: 4 },
        { raw: "Parmesan to serve", name: "Parmesan", normalizedName: "parmesan", sortOrder: 5 },
      ],
    },
    {
      title: "Lemony Chickpea Rice Bowls",
      description: "Warm rice bowls with chickpeas, sauteed onion, yogurt, and lemon.",
      sourceUrl: "https://www.loveandlemons.com/chickpea-rice-bowl",
      imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 4,
      prepMinutes: 15,
      cookMinutes: 20,
      instructions:
        "1. Rinse the rice and simmer it until fluffy, then let it steam off the heat for a few minutes.\n2. Saute sliced onion in olive oil until sweet and golden at the edges.\n3. Add chickpeas, garlic, cumin, and a splash of broth, then cook until warmed through.\n4. Stir together yogurt, lemon zest, and lemon juice for a quick sauce.\n5. Build bowls with rice, chickpeas, greens, and the lemon yogurt, then finish with herbs if you have them.",
      ingredients: [
        { raw: "1 cup rice", name: "Rice", quantity: "1", unit: "cup", normalizedName: "rice", sortOrder: 0 },
        { raw: "1 can chickpeas", name: "Chickpeas", quantity: "1", unit: "can", normalizedName: "chickpeas", sortOrder: 1 },
        { raw: "1 onion", name: "Onion", quantity: "1", unit: "unit", normalizedName: "onion", sortOrder: 2 },
        { raw: "2 cloves garlic", name: "Garlic", quantity: "1", unit: "bulb", normalizedName: "garlic", sortOrder: 3 },
        { raw: "1 lemon", name: "Lemons", quantity: "1", unit: "unit", normalizedName: "lemons", sortOrder: 4 },
        { raw: "1/2 tub Greek yogurt", name: "Greek yogurt", quantity: "0.5", unit: "tub", normalizedName: "greek yogurt", sortOrder: 5 },
        { raw: "2 handfuls baby spinach", name: "Baby spinach", quantity: "2", unit: "handful", normalizedName: "baby spinach", sortOrder: 6 },
      ],
    },
    {
      title: "Cheddar Toasties with Tomato Soup",
      description: "A cozy lunch-for-dinner built from fridge basics and pantry soup.",
      sourceUrl: "https://www.bonappetit.com/grilled-cheese-tomato-soup",
      imageUrl: "https://images.unsplash.com/photo-1515442261605-65987783cb6a?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 2,
      prepMinutes: 10,
      cookMinutes: 12,
      instructions:
        "1. Butter the outside of the bread and layer cheddar generously between the slices.\n2. Toast the sandwiches in a skillet over medium heat until golden and crisp on both sides.\n3. Warm the tomato soup in a saucepan, adding a splash of milk if you like it silkier.\n4. Rest the toasties for a minute, then slice and serve beside the hot soup.",
      ingredients: [
        { raw: "4 slices bread", name: "Bread", quantity: "4", unit: "slice", normalizedName: "bread", sortOrder: 0 },
        { raw: "1/2 block cheddar cheese", name: "Cheddar cheese", quantity: "0.5", unit: "block", normalizedName: "cheddar cheese", sortOrder: 1 },
        { raw: "1 can tomato soup", name: "Tomato soup", quantity: "1", unit: "can", normalizedName: "tomato soup", sortOrder: 2 },
        { raw: "1 tbsp butter", name: "Butter", quantity: "1", unit: "tbsp", normalizedName: "butter", sortOrder: 3 },
      ],
    },
    {
      title: "Very Berry Morning Smoothie",
      description: "Cold blender breakfast with berries, banana, yogurt, and oats.",
      sourceUrl: "https://minimalistbaker.com/berry-smoothie",
      imageUrl: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 2,
      prepMinutes: 5,
      cookMinutes: 0,
      instructions:
        "1. Add the milk to the blender first so the blades catch easily.\n2. Add frozen berries, banana, yogurt, and oats.\n3. Blend on low, then high, until completely smooth and thick.\n4. Taste and add maple syrup if you want it sweeter, then pour immediately.",
      ingredients: [
        { raw: "1 cup frozen berries", name: "Frozen berries", quantity: "1", unit: "cup", normalizedName: "frozen berries", sortOrder: 0 },
        { raw: "1 banana", name: "Banana", quantity: "1", unit: "unit", normalizedName: "banana", sortOrder: 1 },
        { raw: "1 cup milk", name: "Milk", quantity: "1", unit: "cup", normalizedName: "milk", sortOrder: 2 },
        { raw: "1/2 tub Greek yogurt", name: "Greek yogurt", quantity: "0.5", unit: "tub", normalizedName: "greek yogurt", sortOrder: 3 },
        { raw: "1/4 cup rolled oats", name: "Rolled oats", quantity: "0.25", unit: "cup", normalizedName: "rolled oats", sortOrder: 4 },
        { raw: "1 tbsp maple syrup", name: "Maple syrup", quantity: "1", unit: "tbsp", normalizedName: "maple syrup", sortOrder: 5 },
      ],
    },
    {
      title: "Coconut Red Lentil Soup",
      description: "Soft red lentils simmered with coconut milk, broth, and warm spices.",
      sourceUrl: "https://rainbowplantlife.com/red-lentil-soup",
      imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 4,
      prepMinutes: 15,
      cookMinutes: 35,
      instructions:
        "1. Cook onion and garlic in the Dutch oven until tender and fragrant.\n2. Stir in curry powder and red lentils so the spices coat the lentils evenly.\n3. Add broth and bring to a simmer until the lentils begin to collapse.\n4. Pour in coconut milk and simmer again until creamy and thick.\n5. Finish with lemon juice and serve with toast or rice.",
      ingredients: [
        { raw: "1 cup red lentils", name: "Red lentils", quantity: "1", unit: "cup", normalizedName: "red lentils", sortOrder: 0 },
        { raw: "1 onion", name: "Onion", quantity: "1", unit: "unit", normalizedName: "onion", sortOrder: 1 },
        { raw: "3 cloves garlic", name: "Garlic", quantity: "1", unit: "bulb", normalizedName: "garlic", sortOrder: 2 },
        { raw: "1 can coconut milk", name: "Coconut milk", quantity: "1", unit: "can", normalizedName: "coconut milk", sortOrder: 3 },
        { raw: "1 carton vegetable broth", name: "Vegetable broth", quantity: "1", unit: "carton", normalizedName: "vegetable broth", sortOrder: 4 },
        { raw: "1 lemon", name: "Lemons", quantity: "1", unit: "unit", normalizedName: "lemons", sortOrder: 5 },
      ],
    },
    {
      title: "Maple Soy Salmon Tray Bake",
      description: "Sheet-pan salmon with broccoli and onions in a glossy sweet-savory glaze.",
      sourceUrl: "https://www.halfbakedharvest.com/sheet-pan-salmon",
      imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 2,
      prepMinutes: 10,
      cookMinutes: 18,
      instructions:
        "1. Heat the oven and line a sheet pan for easy cleanup.\n2. Toss broccoli and onion with olive oil, salt, and pepper, then spread them out on the tray.\n3. Whisk soy sauce, maple syrup, and garlic, then brush most of it over the salmon.\n4. Roast until the salmon flakes easily and the broccoli is caramelized at the edges.\n5. Spoon over the remaining glaze and serve with rice or bread.",
      ingredients: [
        { raw: "2 salmon fillets", name: "Salmon fillets", quantity: "2", unit: "fillet", normalizedName: "salmon fillets", sortOrder: 0 },
        { raw: "2 broccoli crowns", name: "Broccoli", quantity: "2", unit: "crown", normalizedName: "broccoli", sortOrder: 1 },
        { raw: "1 onion", name: "Onion", quantity: "1", unit: "unit", normalizedName: "onion", sortOrder: 2 },
        { raw: "2 tbsp soy sauce", name: "Soy sauce", quantity: "2", unit: "tbsp", normalizedName: "soy sauce", sortOrder: 3 },
        { raw: "1 tbsp maple syrup", name: "Maple syrup", quantity: "1", unit: "tbsp", normalizedName: "maple syrup", sortOrder: 4 },
        { raw: "1 tbsp olive oil", name: "Olive oil", quantity: "1", unit: "tbsp", normalizedName: "olive oil", sortOrder: 5 },
      ],
    },
    {
      title: "Spinach and Cheddar Egg Muffins",
      description: "Make-ahead egg bites for breakfast or a quick lunchbox add-on.",
      sourceUrl: "https://cookieandkate.com/egg-muffins",
      imageUrl: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 6,
      prepMinutes: 12,
      cookMinutes: 18,
      instructions:
        "1. Whisk the eggs with a splash of milk, salt, and pepper until smooth.\n2. Fold in chopped spinach and grated cheddar.\n3. Divide the mixture into a greased muffin tin.\n4. Bake until puffed and just set in the center.\n5. Cool slightly before storing or serving warm.",
      ingredients: [
        { raw: "6 eggs", name: "Eggs", quantity: "6", unit: "unit", normalizedName: "eggs", sortOrder: 0 },
        { raw: "1 cup baby spinach", name: "Baby spinach", quantity: "1", unit: "cup", normalizedName: "baby spinach", sortOrder: 1 },
        { raw: "1 cup cheddar cheese", name: "Cheddar cheese", quantity: "1", unit: "cup", normalizedName: "cheddar cheese", sortOrder: 2 },
        { raw: "1/4 cup milk", name: "Milk", quantity: "0.25", unit: "cup", normalizedName: "milk", sortOrder: 3 },
      ],
    },
    {
      title: "Crispy Broccoli Crumbs Pasta",
      description: "Pantry pasta with garlicky breadcrumbs and roasted broccoli.",
      sourceUrl: "https://smittenkitchen.com/broccoli-pasta",
      imageUrl: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 4,
      prepMinutes: 15,
      cookMinutes: 25,
      instructions:
        "1. Roast the broccoli until browned and a little crisp around the edges.\n2. Toast breadcrumbs in olive oil with garlic until golden and fragrant.\n3. Cook the pasta until al dente, reserving a little pasta water.\n4. Toss the pasta with broccoli, a splash of pasta water, and lemon zest.\n5. Finish with the crispy crumbs over the top for crunch.",
      ingredients: [
        { raw: "1 box spaghetti", name: "Spaghetti", quantity: "1", unit: "box", normalizedName: "spaghetti", sortOrder: 0 },
        { raw: "2 broccoli crowns", name: "Broccoli", quantity: "2", unit: "crown", normalizedName: "broccoli", sortOrder: 1 },
        { raw: "1/2 box panko breadcrumbs", name: "Panko breadcrumbs", quantity: "0.5", unit: "box", normalizedName: "panko breadcrumbs", sortOrder: 2 },
        { raw: "3 cloves garlic", name: "Garlic", quantity: "1", unit: "bulb", normalizedName: "garlic", sortOrder: 3 },
        { raw: "1 lemon", name: "Lemons", quantity: "1", unit: "unit", normalizedName: "lemons", sortOrder: 4 },
        { raw: "2 tbsp olive oil", name: "Olive oil", quantity: "2", unit: "tbsp", normalizedName: "olive oil", sortOrder: 5 },
      ],
    },
    {
      title: "Overnight Oats with Berries",
      description: "A make-ahead breakfast jar with oats, yogurt, berries, and maple.",
      sourceUrl: "https://www.feastingathome.com/overnight-oats",
      imageUrl: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 2,
      prepMinutes: 10,
      cookMinutes: 0,
      instructions:
        "1. Stir oats, milk, yogurt, and maple syrup together in a jar or bowl.\n2. Fold in a handful of berries so some streak into the mixture.\n3. Cover and chill overnight so the oats soften fully.\n4. In the morning, top with extra berries or granola and serve cold.",
      ingredients: [
        { raw: "1 cup rolled oats", name: "Rolled oats", quantity: "1", unit: "cup", normalizedName: "rolled oats", sortOrder: 0 },
        { raw: "1 cup milk", name: "Milk", quantity: "1", unit: "cup", normalizedName: "milk", sortOrder: 1 },
        { raw: "1/2 tub Greek yogurt", name: "Greek yogurt", quantity: "0.5", unit: "tub", normalizedName: "greek yogurt", sortOrder: 2 },
        { raw: "1 cup frozen berries", name: "Frozen berries", quantity: "1", unit: "cup", normalizedName: "frozen berries", sortOrder: 3 },
        { raw: "1 tbsp maple syrup", name: "Maple syrup", quantity: "1", unit: "tbsp", normalizedName: "maple syrup", sortOrder: 4 },
      ],
    },
    {
      title: "Turkey Chili Pot",
      description: "One-pot turkey chili with beans, tomatoes, and a long simmer.",
      sourceUrl: "https://www.seriouseats.com/turkey-chili",
      imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 6,
      prepMinutes: 15,
      cookMinutes: 45,
      instructions:
        "1. Brown the ground turkey in the Dutch oven, breaking it up as it cooks.\n2. Add onion and garlic and cook until softened.\n3. Stir in crushed tomatoes, black beans, broth, and chili spices.\n4. Simmer until the chili thickens and the flavors deepen.\n5. Serve with yogurt, cheese, or avocado if you have them.",
      ingredients: [
        { raw: "1 pack ground turkey", name: "Ground turkey", quantity: "1", unit: "pack", normalizedName: "ground turkey", sortOrder: 0 },
        { raw: "1 onion", name: "Onion", quantity: "1", unit: "unit", normalizedName: "onion", sortOrder: 1 },
        { raw: "2 cloves garlic", name: "Garlic", quantity: "1", unit: "bulb", normalizedName: "garlic", sortOrder: 2 },
        { raw: "1 can black beans", name: "Black beans", quantity: "1", unit: "can", normalizedName: "black beans", sortOrder: 3 },
        { raw: "1 can crushed tomatoes", name: "Crushed tomatoes", quantity: "1", unit: "can", normalizedName: "crushed tomatoes", sortOrder: 4 },
        { raw: "1 carton vegetable broth", name: "Vegetable broth", quantity: "1", unit: "carton", normalizedName: "vegetable broth", sortOrder: 5 },
        { raw: "1 avocado", name: "Avocados", quantity: "1", unit: "unit", normalizedName: "avocados", sortOrder: 6 },
      ],
    },
    {
      title: "Sheet-Pan Chicken with Carrots and Potatoes",
      description: "A simple tray bake with tender chicken thighs and roast vegetables.",
      sourceUrl: "https://www.thekitchn.com/sheet-pan-chicken",
      imageUrl: "https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 4,
      prepMinutes: 15,
      cookMinutes: 40,
      instructions:
        "1. Heat the oven and cut the potatoes and carrots into even pieces.\n2. Toss the vegetables with oil, salt, and pepper on a sheet pan.\n3. Nestle the chicken thighs on top and season well.\n4. Roast until the chicken is browned and the vegetables are tender.\n5. Finish with lemon juice just before serving.",
      ingredients: [
        { raw: "4 chicken thighs", name: "Chicken thighs", quantity: "4", unit: "piece", normalizedName: "chicken thighs", sortOrder: 0 },
        { raw: "4 potatoes", name: "Potatoes", quantity: "4", unit: "unit", normalizedName: "potatoes", sortOrder: 1 },
        { raw: "4 carrots", name: "Carrots", quantity: "4", unit: "unit", normalizedName: "carrots", sortOrder: 2 },
        { raw: "1 onion", name: "Onion", quantity: "1", unit: "unit", normalizedName: "onion", sortOrder: 3 },
        { raw: "2 tbsp olive oil", name: "Olive oil", quantity: "2", unit: "tbsp", normalizedName: "olive oil", sortOrder: 4 },
        { raw: "1 lemon", name: "Lemons", quantity: "1", unit: "unit", normalizedName: "lemons", sortOrder: 5 },
      ],
    },
    {
      title: "Black Bean Tacos",
      description: "Quick tacos with black beans, salsa, avocado, and warm tortillas.",
      sourceUrl: "https://www.loveandlemons.com/black-bean-tacos",
      imageUrl: "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 4,
      prepMinutes: 15,
      cookMinutes: 12,
      instructions:
        "1. Warm the black beans with garlic and a spoonful of salsa.\n2. Heat the tortillas in a dry skillet until soft and pliable.\n3. Slice avocado and prep any toppings you have ready.\n4. Fill the tortillas with beans and toppings, then serve immediately.",
      ingredients: [
        { raw: "1 can black beans", name: "Black beans", quantity: "1", unit: "can", normalizedName: "black beans", sortOrder: 0 },
        { raw: "8 corn tortillas", name: "Corn tortillas", quantity: "8", unit: "unit", normalizedName: "corn tortillas", sortOrder: 1 },
        { raw: "1 jar salsa", name: "Salsa", quantity: "1", unit: "jar", normalizedName: "salsa", sortOrder: 2 },
        { raw: "1 avocado", name: "Avocados", quantity: "1", unit: "unit", normalizedName: "avocados", sortOrder: 3 },
        { raw: "1 lime", name: "Lime", quantity: "1", unit: "unit", normalizedName: "lime", sortOrder: 4 },
      ],
    },
    {
      title: "Feta Cucumber Quinoa Salad",
      description: "A fridge-friendly lunch salad with quinoa, feta, tomatoes, and cucumber.",
      sourceUrl: "https://www.twopeasandtheirpod.com/quinoa-salad",
      imageUrl: "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 4,
      prepMinutes: 20,
      cookMinutes: 20,
      instructions:
        "1. Cook the quinoa and let it cool slightly so the salad stays fresh.\n2. Chop cucumber, tomatoes, and onion into small bites.\n3. Toss the quinoa with the vegetables, feta, olive oil, and lemon juice.\n4. Season well and chill for a few minutes before serving.",
      ingredients: [
        { raw: "1 cup quinoa", name: "Quinoa", quantity: "1", unit: "cup", normalizedName: "quinoa", sortOrder: 0 },
        { raw: "1 cucumber", name: "Cucumbers", quantity: "1", unit: "unit", normalizedName: "cucumbers", sortOrder: 1 },
        { raw: "1 pint cherry tomatoes", name: "Cherry tomatoes", quantity: "1", unit: "pint", normalizedName: "cherry tomatoes", sortOrder: 2 },
        { raw: "1/2 block feta", name: "Feta", quantity: "0.5", unit: "block", normalizedName: "feta", sortOrder: 3 },
        { raw: "1 lemon", name: "Lemons", quantity: "1", unit: "unit", normalizedName: "lemons", sortOrder: 4 },
        { raw: "2 tbsp olive oil", name: "Olive oil", quantity: "2", unit: "tbsp", normalizedName: "olive oil", sortOrder: 5 },
      ],
    },
    {
      title: "Peanut Butter Banana Toast",
      description: "Fast breakfast toast with peanut butter, banana, and honey.",
      sourceUrl: "https://www.eatingwell.com/recipe/banana-toast",
      imageUrl: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 2,
      prepMinutes: 8,
      cookMinutes: 2,
      instructions:
        "1. Toast the bread until golden.\n2. Spread peanut butter generously over each slice while warm.\n3. Top with sliced banana and a light drizzle of honey.\n4. Finish with cinnamon or flaky salt if you like.",
      ingredients: [
        { raw: "4 slices bread", name: "Bread", quantity: "4", unit: "slice", normalizedName: "bread", sortOrder: 0 },
        { raw: "4 tbsp peanut butter", name: "Peanut butter", quantity: "4", unit: "tbsp", normalizedName: "peanut butter", sortOrder: 1 },
        { raw: "2 bananas", name: "Banana", quantity: "2", unit: "unit", normalizedName: "banana", sortOrder: 2 },
        { raw: "1 tbsp honey", name: "Honey", quantity: "1", unit: "tbsp", normalizedName: "honey", sortOrder: 3 },
      ],
    },
    {
      title: "Veggie Quesadillas",
      description: "Crisp tortillas filled with cheese, peppers, spinach, and salsa.",
      sourceUrl: "https://cookieandkate.com/veggie-quesadillas",
      imageUrl: "https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 4,
      prepMinutes: 15,
      cookMinutes: 12,
      instructions:
        "1. Saute peppers and spinach until just softened and any moisture cooks away.\n2. Layer tortillas with cheddar, the vegetables, and a spoonful of salsa.\n3. Cook in a skillet until the tortillas crisp and the cheese melts.\n4. Slice into wedges and serve hot.",
      ingredients: [
        { raw: "4 flour tortillas", name: "Flour tortillas", quantity: "4", unit: "unit", normalizedName: "flour tortillas", sortOrder: 0 },
        { raw: "1 bell pepper", name: "Bell peppers", quantity: "1", unit: "unit", normalizedName: "bell peppers", sortOrder: 1 },
        { raw: "1 cup baby spinach", name: "Baby spinach", quantity: "1", unit: "cup", normalizedName: "baby spinach", sortOrder: 2 },
        { raw: "1 cup cheddar cheese", name: "Cheddar cheese", quantity: "1", unit: "cup", normalizedName: "cheddar cheese", sortOrder: 3 },
        { raw: "1/4 cup salsa", name: "Salsa", quantity: "0.25", unit: "cup", normalizedName: "salsa", sortOrder: 4 },
      ],
    },
    {
      title: "Pesto White Bean Toasts",
      description: "Pantry lunch toasts with pesto, white beans, and tomato.",
      sourceUrl: "https://www.thekitchn.com/white-bean-toast",
      imageUrl: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 2,
      prepMinutes: 10,
      cookMinutes: 5,
      instructions:
        "1. Toast the bread until crisp at the edges.\n2. Mash the white beans lightly with olive oil, salt, and pepper.\n3. Spread pesto over the toast, then top with the beans.\n4. Finish with cherry tomatoes and a squeeze of lemon.",
      ingredients: [
        { raw: "4 slices bread", name: "Bread", quantity: "4", unit: "slice", normalizedName: "bread", sortOrder: 0 },
        { raw: "1 can cannellini beans", name: "Cannellini beans", quantity: "1", unit: "can", normalizedName: "cannellini beans", sortOrder: 1 },
        { raw: "2 tbsp pesto", name: "Pesto", quantity: "2", unit: "tbsp", normalizedName: "pesto", sortOrder: 2 },
        { raw: "1 cup cherry tomatoes", name: "Cherry tomatoes", quantity: "1", unit: "cup", normalizedName: "cherry tomatoes", sortOrder: 3 },
        { raw: "1 lemon", name: "Lemons", quantity: "1", unit: "unit", normalizedName: "lemons", sortOrder: 4 },
      ],
    },
    {
      title: "Potato and Egg Breakfast Hash",
      description: "Skillet breakfast with crisp potatoes, peppers, and soft-set eggs.",
      sourceUrl: "https://www.simplyrecipes.com/potato-hash",
      imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 4,
      prepMinutes: 15,
      cookMinutes: 25,
      instructions:
        "1. Dice the potatoes small so they crisp quickly in the skillet.\n2. Cook the potatoes with onion and bell pepper until golden.\n3. Make wells in the hash and crack in the eggs.\n4. Cover and cook until the eggs are just set, then serve right away.",
      ingredients: [
        { raw: "4 potatoes", name: "Potatoes", quantity: "4", unit: "unit", normalizedName: "potatoes", sortOrder: 0 },
        { raw: "1 onion", name: "Onion", quantity: "1", unit: "unit", normalizedName: "onion", sortOrder: 1 },
        { raw: "1 bell pepper", name: "Bell peppers", quantity: "1", unit: "unit", normalizedName: "bell peppers", sortOrder: 2 },
        { raw: "4 eggs", name: "Eggs", quantity: "4", unit: "unit", normalizedName: "eggs", sortOrder: 3 },
        { raw: "1 tbsp olive oil", name: "Olive oil", quantity: "1", unit: "tbsp", normalizedName: "olive oil", sortOrder: 4 },
      ],
    },
    {
      title: "Tuna Salad Crunch Sandwiches",
      description: "A simple lunch sandwich with tuna, celery, and lemon.",
      sourceUrl: "https://www.bonappetit.com/tuna-salad-sandwich",
      imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 2,
      prepMinutes: 12,
      cookMinutes: 0,
      instructions:
        "1. Drain the tuna well so the filling stays creamy instead of watery.\n2. Mix with mayonnaise, finely chopped celery, and lemon juice.\n3. Season with salt and pepper, then pile onto bread.\n4. Add spinach or cucumber for crunch if you have it.",
      ingredients: [
        { raw: "1 can tuna", name: "Tuna", quantity: "1", unit: "can", normalizedName: "tuna", sortOrder: 0 },
        { raw: "2 tbsp mayonnaise", name: "Mayonnaise", quantity: "2", unit: "tbsp", normalizedName: "mayonnaise", sortOrder: 1 },
        { raw: "2 stalks celery", name: "Celery", quantity: "2", unit: "stalk", normalizedName: "celery", sortOrder: 2 },
        { raw: "4 slices bread", name: "Bread", quantity: "4", unit: "slice", normalizedName: "bread", sortOrder: 3 },
        { raw: "1 lemon", name: "Lemons", quantity: "1", unit: "unit", normalizedName: "lemons", sortOrder: 4 },
      ],
    },
    {
      title: "Apple Yogurt Granola Bowls",
      description: "A no-cook breakfast bowl with apples, yogurt, granola, and honey.",
      sourceUrl: "https://www.eatingwell.com/yogurt-granola-bowl",
      imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 2,
      prepMinutes: 8,
      cookMinutes: 0,
      instructions:
        "1. Spoon yogurt into bowls.\n2. Top with chopped apples and a handful of granola.\n3. Drizzle with honey and serve immediately for the best crunch.",
      ingredients: [
        { raw: "1 tub Greek yogurt", name: "Greek yogurt", quantity: "1", unit: "tub", normalizedName: "greek yogurt", sortOrder: 0 },
        { raw: "2 apples", name: "Apples", quantity: "2", unit: "unit", normalizedName: "apples", sortOrder: 1 },
        { raw: "1 cup granola", name: "Granola", quantity: "1", unit: "cup", normalizedName: "granola", sortOrder: 2 },
        { raw: "1 tbsp honey", name: "Honey", quantity: "1", unit: "tbsp", normalizedName: "honey", sortOrder: 3 },
      ],
    },
    {
      title: "Bagels with Cream Cheese and Jam",
      description: "Classic quick breakfast with a sweet-savory split filling.",
      sourceUrl: "https://www.thekitchn.com/bagel-breakfast",
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
      parseStatus: "parsed",
      servings: 2,
      prepMinutes: 6,
      cookMinutes: 3,
      instructions:
        "1. Toast the bagels until just crisp around the edges.\n2. Spread cream cheese on both halves while still warm.\n3. Add jam to half of the bagel or serve it on the side for balance.",
      ingredients: [
        { raw: "2 plain bagels", name: "Plain bagels", quantity: "2", unit: "unit", normalizedName: "plain bagels", sortOrder: 0 },
        { raw: "3 tbsp cream cheese", name: "Cream cheese", quantity: "3", unit: "tbsp", normalizedName: "cream cheese", sortOrder: 1 },
        { raw: "2 tbsp jam", name: "Jam", quantity: "2", unit: "tbsp", normalizedName: "jam", sortOrder: 2 },
      ],
    },
  ] as const;

  const recipes = await Promise.all(
    recipeDefinitions.map((recipe) =>
      tx.recipe.create({
        data: {
          title: recipe.title,
          description: recipe.description,
          sourceUrl: recipe.sourceUrl,
          imageUrl: recipe.imageUrl,
          parseStatus: recipe.parseStatus,
          servings: recipe.servings,
          prepMinutes: recipe.prepMinutes,
          cookMinutes: recipe.cookMinutes,
          instructions: recipe.instructions,
          ingredients: { create: recipe.ingredients.map((ingredient) => ({ ...ingredient })) },
        },
      })
    )
  );
  const recipeByTitle = new Map(recipes.map((recipe) => [recipe.title, recipe]));
  const recipeDefinitionByTitle = new Map(recipeDefinitions.map((recipe) => [recipe.title, recipe]));
  const pantryNames = new Set(pantryDefinitions.map((item) => normalizeSeedName(item.name)));

  const mealPlanTemplates = [
    {
      name: "Week of cozy dinners",
      weekStart: monday,
      days: [
        { Breakfast: "Overnight Oats with Berries", Lunch: "Tuna Salad Crunch Sandwiches", Dinner: "Weeknight Tomato Pasta" },
        { Breakfast: "Very Berry Morning Smoothie", Lunch: "Feta Cucumber Quinoa Salad", Dinner: "Lemony Chickpea Rice Bowls" },
        { Breakfast: "Spinach and Cheddar Egg Muffins", Lunch: "Pesto White Bean Toasts", Dinner: "Turkey Chili Pot" },
        { Breakfast: "Apple Yogurt Granola Bowls", Lunch: "Cheddar Toasties with Tomato Soup", Dinner: "Maple Soy Salmon Tray Bake" },
        { Breakfast: "Bagels with Cream Cheese and Jam", Lunch: "Veggie Quesadillas", Dinner: "Coconut Red Lentil Soup" },
        { Breakfast: "Peanut Butter Banana Toast", Lunch: "Feta Cucumber Quinoa Salad", Dinner: "Sheet-Pan Chicken with Carrots and Potatoes" },
        { Breakfast: "Potato and Egg Breakfast Hash", Lunch: "Tuna Salad Crunch Sandwiches", Dinner: "Crispy Broccoli Crumbs Pasta" },
      ],
    },
    {
      name: "Next week prep ideas",
      weekStart: nextWeek,
      days: [
        { Breakfast: "Apple Yogurt Granola Bowls", Lunch: "Pesto White Bean Toasts", Dinner: "Sheet-Pan Chicken with Carrots and Potatoes" },
        { Breakfast: "Overnight Oats with Berries", Lunch: "Veggie Quesadillas", Dinner: "Weeknight Tomato Pasta" },
        { Breakfast: "Bagels with Cream Cheese and Jam", Lunch: "Tuna Salad Crunch Sandwiches", Dinner: "Turkey Chili Pot" },
        { Breakfast: "Very Berry Morning Smoothie", Lunch: "Cheddar Toasties with Tomato Soup", Dinner: "Maple Soy Salmon Tray Bake" },
        { Breakfast: "Spinach and Cheddar Egg Muffins", Lunch: "Feta Cucumber Quinoa Salad", Dinner: "Black Bean Tacos" },
        { Breakfast: "Peanut Butter Banana Toast", Lunch: "Pesto White Bean Toasts", Dinner: "Coconut Red Lentil Soup" },
        { Breakfast: "Potato and Egg Breakfast Hash", Lunch: "Veggie Quesadillas", Dinner: "Crispy Broccoli Crumbs Pasta" },
      ],
    },
    {
      name: "Third week family routine",
      weekStart: thirdWeek,
      days: [
        { Breakfast: "Bagels with Cream Cheese and Jam", Lunch: "Feta Cucumber Quinoa Salad", Dinner: "Lemony Chickpea Rice Bowls" },
        { Breakfast: "Overnight Oats with Berries", Lunch: "Tuna Salad Crunch Sandwiches", Dinner: "Sheet-Pan Chicken with Carrots and Potatoes" },
        { Breakfast: "Very Berry Morning Smoothie", Lunch: "Pesto White Bean Toasts", Dinner: "Turkey Chili Pot" },
        { Breakfast: "Apple Yogurt Granola Bowls", Lunch: "Cheddar Toasties with Tomato Soup", Dinner: "Weeknight Tomato Pasta" },
        { Breakfast: "Spinach and Cheddar Egg Muffins", Lunch: "Veggie Quesadillas", Dinner: "Maple Soy Salmon Tray Bake" },
        { Breakfast: "Peanut Butter Banana Toast", Lunch: "Feta Cucumber Quinoa Salad", Dinner: "Black Bean Tacos" },
        { Breakfast: "Potato and Egg Breakfast Hash", Lunch: "Tuna Salad Crunch Sandwiches", Dinner: "Coconut Red Lentil Soup" },
      ],
    },
  ] as const;

  const [thisWeek, nextPlan, thirdPlan] = await Promise.all(
    mealPlanTemplates.map((plan) =>
      tx.mealPlan.create({
        data: {
          name: plan.name,
          weekStart: plan.weekStart,
          items: {
            create: plan.days.flatMap((day, dayOffset) =>
              (["Breakfast", "Lunch", "Dinner"] as const).map((mealType) => {
                const title = day[mealType];
                const recipe = recipeByTitle.get(title)!;
                return {
                  recipeId: recipe.id,
                  date: daysFrom(plan.weekStart, dayOffset),
                  mealType,
                  servings: recipe.servings ?? (mealType === "Breakfast" ? 2 : 4),
                };
              })
            ),
          },
        },
      })
    )
  );

  const groceryList = await tx.groceryList.create({
    data: {
      name: "Weekly market run",
      isDefault: true,
    },
  });

  const groceryItems = new Map<
    string,
    {
      listId: string;
      name: string;
      canonicalKey: string;
      source: string;
      checked?: boolean;
    }
  >();

  for (const plan of mealPlanTemplates) {
    for (const day of plan.days) {
      for (const mealType of ["Breakfast", "Lunch", "Dinner"] as const) {
        const recipe = recipeDefinitionByTitle.get(day[mealType]);
        if (!recipe) continue;

        for (const ingredient of recipe.ingredients) {
          const ingredientName = ingredient.name ?? ingredient.normalizedName ?? ingredient.raw;
          const normalized = normalizeSeedName(ingredientName);
          if (pantryNames.has(normalized)) continue;

          const canonicalKey = buildCanonicalKey(ingredientName);
          if (!canonicalKey || groceryItems.has(canonicalKey)) continue;

          groceryItems.set(canonicalKey, {
            listId: groceryList.id,
            name: ingredientName,
            canonicalKey,
            source: encodeMealPlanSource(plan.name, "missing"),
          });
        }
      }
    }
  }

  const manualAndRestockItems = [
    { name: "Olive oil", source: encodePantryRestockSource("Olive oil") },
    { name: "Coffee beans", source: encodePantryRestockSource("Coffee beans") },
    { name: "Sourdough bread", source: "manual" },
    { name: "Sparkling water", source: "manual", checked: true },
    { name: "Tortilla chips", source: "manual" },
    { name: "Cilantro", source: encodeRecipeSource("Lemony Chickpea Rice Bowls", "missing") },
    { name: "Fresh dill", source: encodeRecipeSource("Feta Cucumber Quinoa Salad", "missing") },
    { name: "Smoked paprika", source: encodeRecipeSource("Turkey Chili Pot", "missing") },
    { name: "Limes", source: encodeRecipeSource("Black Bean Tacos", "missing") },
  ] as const;

  for (const item of manualAndRestockItems) {
    const canonicalKey = buildCanonicalKey(item.name);
    if (!canonicalKey) continue;
    groceryItems.set(canonicalKey, {
      listId: groceryList.id,
      name: item.name,
      canonicalKey,
      source: item.source,
      checked: item.checked,
    });
  }

  await tx.groceryItem.createMany({
    data: Array.from(groceryItems.values()),
  });

  await Promise.all([
    tx.proposal.create({
      data: {
        agentId: "expiration",
        entityType: "pantry",
        entityId: pantryByName.get("Crushed tomatoes")!.id,
        status: "pending",
        patch: [{ op: "replace", path: "/notes", value: "Use these in pasta night or tomato soup lunches this week." }] as object,
        snapshot: {
          id: pantryByName.get("Crushed tomatoes")!.id,
          name: "Crushed tomatoes",
          notes: pantryByName.get("Crushed tomatoes")!.notes,
        } as object,
        rationale: "These tomatoes are among the closest expirations and match a planned dinner.",
        confidence: 0.94,
        changes: {
          create: [
            {
              field: "notes",
              before: pantryByName.get("Crushed tomatoes")!.notes ?? "",
              after: "Use these in pasta night or tomato soup lunches this week.",
            },
          ],
        },
      },
    }),
    tx.proposal.create({
      data: {
        agentId: "chef",
        entityType: "meal-plan",
        entityId: thisWeek.id,
        status: "pending",
        patch: [{ op: "add", path: "/suggestions", value: [{ dayOffset: 6, mealType: "Dinner", recipeId: recipeByTitle.get("Crispy Broccoli Crumbs Pasta")!.id }] }] as object,
        snapshot: { id: thisWeek.id, name: thisWeek.name } as object,
        rationale: "You have enough broccoli, pasta, and garlic to add one more low-cost dinner with minimal shopping.",
        confidence: 0.8,
        changes: {
          create: [
            {
              field: "suggestions",
              before: "",
              after: "Add Crispy Broccoli Crumbs Pasta for Sunday dinner",
            },
          ],
        },
      },
    }),
    tx.proposal.create({
      data: {
        agentId: "normalization",
        entityType: "grocery-item",
        entityId: null,
        status: "pending",
        patch: [] as object,
        snapshot: { listId: groceryList.id } as object,
        rationale: "Coffee beans appears as a restock candidate and could merge with a manual coffee entry later.",
        confidence: 0.69,
        changes: {
          create: [
            {
              field: "canonicalKey",
              before: "",
              after: "coffee beans",
            },
          ],
        },
      },
    }),
    tx.proposal.create({
      data: {
        agentId: "review",
        entityType: "inventory",
        entityId: inventoryItems.get("Ceramic Pantry Jars")!.id,
        status: "accepted",
        patch: [{ op: "replace", path: "/tags", value: ["flour", "oats", "display", "countertop"] }] as object,
        snapshot: { id: inventoryItems.get("Ceramic Pantry Jars")!.id, name: "Ceramic Pantry Jars" } as object,
        rationale: "The item is used on the counter, not just in pantry storage.",
        confidence: 0.71,
        changes: {
          create: [
            {
              field: "tags",
              before: "flour,oats,display",
              after: "flour,oats,display,countertop",
            },
          ],
        },
        resolvedAt: daysFrom(now, -2),
      },
    }),
  ]);

  await tx.auditLog.createMany({
    data: [
      {
        actor: "system",
        action: "seed.loaded",
        meta: {
          inventoryCount: inventoryDefinitions.length,
          pantryCount: pantryDefinitions.length,
          recipeCount: recipeDefinitions.length,
          groceryListId: groceryList.id,
        } as object,
      },
      {
        actor: "chef",
        action: "proposal.created",
        entityType: "meal-plan",
        entityId: thisWeek.id,
      },
      {
        actor: "expiration",
        action: "proposal.created",
        entityType: "pantry",
        entityId: pantryByName.get("Crushed tomatoes")!.id,
      },
      {
        actor: "normalization",
        action: "proposal.created",
        entityType: "grocery-item",
        entityId: null,
      },
      {
        actor: "user",
        action: "proposal.accepted",
        entityType: "inventory",
        entityId: inventoryItems.get("Ceramic Pantry Jars")!.id,
      },
      {
        actor: "system",
        action: "meal-plan.generated",
        entityType: "meal-plan",
        entityId: nextPlan.id,
      },
      {
        actor: "system",
        action: "meal-plan.generated",
        entityType: "meal-plan",
        entityId: thirdPlan.id,
      },
    ],
  });
}
