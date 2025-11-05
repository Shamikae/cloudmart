import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const TABLE = process.env.PRODUCTS_TABLE || "cloudmart-products";

const CORS = {
  "content-type": "application/json",
  "access-control-allow-origin": "https://shamikae.com",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET,POST,OPTIONS"
};

export const handler = async (event) => {
  if (event?.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }
  try {
    const out = await ddb.send(new ScanCommand({ TableName: TABLE, Limit: 50 }));
    const items = (out.Items || []).map(i => ({
      id: i.id?.S,
      name: i.name?.S,
      description: i.description?.S,
      price: i.price?.N ? Number(i.price.N) : undefined
    }));
    return { statusCode: 200, headers: CORS, body: JSON.stringify(items) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
