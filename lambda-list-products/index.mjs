import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const TABLE = process.env.PRODUCTS_TABLE || "cloudmart-products";
const ALLOWED_ORIGIN =
  process.env.ALLOWED_ORIGIN || "https://shamikae.com"; // tighten to the site domain by default
const baseHeaders = {
  "content-type": "application/json",
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const handler = async (event) => {
  if (event?.requestContext?.http?.method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: baseHeaders,
      body: "",
    };
  }
  try {
    const out = await ddb.send(
      new ScanCommand({ TableName: TABLE, Limit: 50 })
    );
    const items = (out.Items || []).map((i, idx) => {
      const id = i.id?.S;
      const name = i.name?.S;
      const description = i.description?.S;
      const price = i.price?.N ? Number(i.price.N) : undefined;
      const image =
        i.image?.S ||
        i.imageUrl?.S ||
        i.photo?.S ||
        i.thumbnail?.S ||
        null;

      return {
        id: id || `product-${idx + 1}`,
        name: name || "Untitled product",
        description: description || "",
        price,
        image,
      };
    });
    return {
      statusCode: 200,
      headers: baseHeaders,
      body: JSON.stringify(items),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: baseHeaders,
      body: JSON.stringify({ error: e.message }),
    };
  }
};
