import { inventoryQueue } from "../lib/queue";

async function main() {
    console.log("Triggering inventory.created event...");

    // Simulate creating an item
    const itemId = "test-item-" + Date.now();
    await inventoryQueue.add("created", {
        itemId,
        name: "Green Apple",
    });

    console.log("Event sent!");
    process.exit(0);
}

main();
