import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const SOURCE = join(process.cwd(), "data", "products-seed.json");
const TARGET = join(process.cwd(), "infra", "products-seed-ddb.json");
const TABLE = "cloudmart-products";

function toDdb(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return { S: value };
  if (typeof value === "number") return { N: String(value) };
  if (typeof value === "boolean") return { BOOL: value };
  if (Array.isArray(value)) {
    // Simple list conversion; assumes primitives
    return { L: value.map((v) => toDdb(v)).filter(Boolean) };
  }
  if (typeof value === "object") {
    return {
      M: Object.fromEntries(
        Object.entries(value)
          .map(([k, v]) => [k, toDdb(v)])
          .filter(([, v]) => Boolean(v))
      ),
    };
  }
  throw new Error(`Unsupported type for value: ${value}`);
}

async function run() {
  const raw = await readFile(SOURCE, "utf8");
  const items = JSON.parse(raw);
  if (!Array.isArray(items)) {
    throw new Error("Expected an array in products-seed.json");
  }

  const converted = {
    [TABLE]: items.map((item) => ({
      PutRequest: {
        Item: Object.fromEntries(
          Object.entries(item).map(([k, v]) => [k, toDdb(v)])
        ),
      },
    })),
  };

  await writeFile(TARGET, JSON.stringify(converted, null, 2));
  console.log(`Wrote DynamoDB seed to ${TARGET}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
