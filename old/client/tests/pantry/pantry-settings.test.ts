import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updatePantryWarningWindow } from "@/app/(protected)/pantry/actions";

it("updates pantry warning window", async () => {
  const form = new FormData();
  form.set("pantryWarningDays", "5");
  await updatePantryWarningWindow(form);
  const prisma = (await import("@/lib/prisma")).default;
  const config = await prisma.appConfig.findFirst();
  expect(config?.pantryWarningDays).toBe(5);
});
