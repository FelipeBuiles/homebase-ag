import { Queue, Worker } from "bullmq";
import type { Processor } from "bullmq";
import "dotenv/config";

const connection = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const inventoryQueue = new Queue("inventory", { connection });
export const groceryQueue = new Queue("grocery", { connection });
export const recipeQueue = new Queue("recipe-parser", { connection });
export const expirationQueue = new Queue("expiration", { connection });
export const chefQueue = new Queue("chef", { connection });
export const proposalQueue = new Queue("proposal", { connection });

export const setupWorker = (queueName: string, processor: Processor) => {
    return new Worker(queueName, processor, { connection });
};
