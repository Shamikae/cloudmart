import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { GoogleAuth } from "google-auth-library";
import fetch from "node-fetch";

const ddb = new DynamoDBClient({});
const secrets = new SecretsManagerClient({});
const TABLE = process.env.PRODUCTS_TABLE || "cloudmart-products";
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const DATASET = process.env.BQ_DATASET || "cloudmart_analytics";
const TABLE_NAME = process.env.BQ_TABLE || "products";
const SECRET_NAME = process.env.GCP_CREDENTIALS_SECRET || "cloudmart/gcp/credentials";

async function getGoogleClient() {
  const sec = await secrets.send(new GetSecretValueCommand({ SecretId: SECRET_NAME }));
  const creds = JSON.parse(sec.SecretString);
  const auth = new GoogleAuth({ credentials: creds, scopes: ["https://www.googleapis.com/auth/bigquery"] });
  return await auth.getClient();
}

async function bqInsertRows(rows) {
  const client = await getGoogleClient();
  const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${GCP_PROJECT_ID}/datasets/${DATASET}/tables/${TABLE_NAME}/insertAll`;
  const token = await client.getAccessToken();

  const res = await fetch(url, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token.token || token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "bigquery#tableDataInsertAllRequest",
      skipInvalidRows: true,
      ignoreUnknownValues: true,
      rows: rows.map(r => ({ json: r }))
    })
  });

  if (!res.ok) throw new Error(`BigQuery insert failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export const handler = async () => {
  // scan DDB (paginate)
  let items = [], ExclusiveStartKey;
  do {
    const out = await ddb.send(new ScanCommand({ TableName: TABLE, ExclusiveStartKey, Limit: 100 }));
    items.push(...(out.Items || []).map(i => ({
      id: i.id?.S, name: i.name?.S, description: i.description?.S,
      price: i.price?.N ? Number(i.price.N) : null, timestamp: new Date().toISOString()
    })));
    ExclusiveStartKey = out.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  if (!items.length) return { statusCode: 200, body: JSON.stringify({ inserted: 0 }) };

  // insert in chunks
  for (let i = 0; i < items.length; i += 500) {
    await bqInsertRows(items.slice(i, i + 500));
  }
  return { statusCode: 200, body: JSON.stringify({ inserted: items.length }) };
};
