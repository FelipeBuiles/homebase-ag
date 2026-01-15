-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "enrichmentError" TEXT,
ADD COLUMN     "enrichmentStatus" TEXT DEFAULT 'idle',
ADD COLUMN     "enrichmentUpdatedAt" TIMESTAMP(3);
