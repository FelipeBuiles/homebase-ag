-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "parsingError" TEXT,
ADD COLUMN     "parsingStatus" TEXT NOT NULL DEFAULT 'idle',
ADD COLUMN     "parsingUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft';
