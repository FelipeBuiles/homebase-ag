-- AlterTable
ALTER TABLE "AppConfig" ADD COLUMN     "textModel" TEXT NOT NULL DEFAULT 'google/gemini-2.0-flash-001',
ADD COLUMN     "visionModel" TEXT NOT NULL DEFAULT 'google/gemini-2.0-flash-001',
ALTER COLUMN "llmProvider" SET DEFAULT 'openrouter';
