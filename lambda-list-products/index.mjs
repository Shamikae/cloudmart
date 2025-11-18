import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const TABLE = process.env.PRODUCTS_TABLE || "cloudmart-products";

export const handler = async (event) => {
  if (event?.requestContext?.http?.method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: { "content-type": "application/json" },
      body: "",
    };
  }
  try {
    const out = await ddb.send(new ScanCommand({ TableName: TABLE, Limit: 50 }));
    const items = (out.Items || []).map((i, idx) => {
      const id = i.id?.S;
      const name = i.name?.S;
      const description = i.description?.S;
      const price = i.price?.N ? Number(i.price.N) : undefined;
      const image = i.image?.S;

      return {
        id: id || `product-${idx + 1}`,
        name: name || "Untitled product",
        description: description || "",
        price,
        image: image || null,
      };
    });
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(items) };
  } catch (e) {
    return { statusCode: 500, headers: { "content-type": "application/json" }, body: JSON.stringify({ error: e.message }) };
  }
};
