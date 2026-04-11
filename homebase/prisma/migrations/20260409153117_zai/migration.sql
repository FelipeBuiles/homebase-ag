/*
  Warnings:

  - Made the column `source` on table `GroceryItem` required. Existing NULLs are backfilled to 'manual'.

*/
-- AlterTable
ALTER TABLE "AgentConfig" ADD COLUMN     "userPrompt" TEXT;

-- Backfill any existing NULL source values before setting NOT NULL
UPDATE "GroceryItem" SET "source" = 'manual' WHERE "source" IS NULL;

-- AlterTable
ALTER TABLE "GroceryItem" ADD COLUMN     "canonicalKey" TEXT,
ADD COLUMN     "mergedFrom" JSONB,
ALTER COLUMN "source" SET NOT NULL,
ALTER COLUMN "source" SET DEFAULT 'manual';

-- AlterTable
ALTER TABLE "GroceryList" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "enrichmentStatus" TEXT NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "MealPlanItem" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "PantryItem" ADD COLUMN     "inventoryItemId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'in_stock',
ADD COLUMN     "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "parsingError" TEXT,
ADD COLUMN     "parsingUpdatedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddIndex for FK on PantryItem.inventoryItemId
CREATE INDEX "PantryItem_inventoryItemId_idx" ON "PantryItem"("inventoryItemId");
