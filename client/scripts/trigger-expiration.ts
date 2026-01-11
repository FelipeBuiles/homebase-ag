import { expirationQueue } from "../lib/queue";

async function main() {
    console.log("Triggering Expiration Check...");
    await expirationQueue.add("check", {});
    console.log("Sent.");
}

main();
