-- CreateEnum
CREATE TYPE "GroceryItemSource" AS ENUM ('manual', 'recipe', 'agent');

-- AlterTable
ALTER TABLE "GroceryItem" ADD COLUMN     "canonicalKey" TEXT,
ADD COLUMN     "mergedFrom" JSONB,
ADD COLUMN     "normalizedName" TEXT,
ADD COLUMN     "source" "GroceryItemSource" NOT NULL DEFAULT 'manual',
ADD COLUMN     "suggestedCategory" TEXT;
