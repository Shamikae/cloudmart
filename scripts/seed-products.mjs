import { readFile } from "node:fs/promises";
import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = "cloudmart-products";          // 🔁 change if your table name is different
const REGION = process.env.AWS_REGION || "us-east-1"; // 🔁 adjust if needed

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function run() {
  // Read your seed file
  const raw = await readFile(new URL("../data/products-seed.json", import.meta.url), "utf8");
  const items = JSON.parse(raw);

  if (!Array.isArray(items)) {
    throw new Error("products-seed.json must contain an array of items");
  }

  const batches = chunk(items, 25); // DynamoDB batchWrite limit

  for (const [index, batch] of batches.entries()) {
    const params = {
      RequestItems: {
        [TABLE_NAME]: batch.map((item) => ({
          PutRequest: { Item: item },
        })),
      },
    };

    console.log(`Writing batch ${index + 1}/${batches.length} (${batch.length} items)...`);

    const command = new BatchWriteCommand(params);
    const response = await docClient.send(command);

    if (response.UnprocessedItems && Object.keys(response.UnprocessedItems).length > 0) {
      console.warn("Some items were unprocessed:", response.UnprocessedItems);
      // For a real app you might retry here; for dev seeding you can usually ignore or rerun.
    }
  }

  console.log(`✅ Done. Wrote ${items.length} items to ${TABLE_NAME}.`);
}

run().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});