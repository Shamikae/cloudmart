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
    const items = (out.Items || []).map(i => ({
      id: i.id?.S,
      name: i.name?.S,
      description: i.description?.S,
      price: i.price?.N ? Number(i.price.N) : undefined
    }));
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(items) };
  } catch (e) {
    return { statusCode: 500, headers: { "content-type": "application/json" }, body: JSON.stringify({ error: e.message }) };
  }
};
