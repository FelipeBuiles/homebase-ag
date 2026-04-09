-- AlterTable
ALTER TABLE "AgentConfig" ADD COLUMN     "modelOverride" TEXT,
ADD COLUMN     "overrideEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visionModelOverride" TEXT;

-- AlterTable
ALTER TABLE "AppConfig" ADD COLUMN     "llmModel" TEXT,
ADD COLUMN     "llmVisionModel" TEXT;
