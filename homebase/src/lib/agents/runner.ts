import { Queue } from "bullmq";
import { Redis } from "ioredis";

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const agentQueue = new Queue("agents", { connection });

export type AgentJobName = "enrichment" | "recipe-parser" | "expiration" | "normalization" | "chef" | "pantry-maintenance";

export interface AgentJobData {
  entityId: string;
  entityType?: string;
  context?: Record<string, unknown>;
}
