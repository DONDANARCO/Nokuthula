const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const {
  awsCredentialsProvider,
} = require("@vercel/oidc-aws-credentials-provider");

const region = process.env.AWS_REGION || "ap-northeast-1";
const tableName =
  process.env.DYNAMODB_TABLE_NAME ||
  process.env.AWS_DDB_TABLE_NAME ||
  "NMashabpodiatrist";

let client;

function getDb() {
  if (client) return { ddb: client, tableName };

  // Works with either explicit access keys or Vercel/AWS role-based credentials.
  const hasStaticCreds =
    Boolean(process.env.AWS_ACCESS_KEY_ID) &&
    Boolean(process.env.AWS_SECRET_ACCESS_KEY);

  const hasRoleArn = Boolean(process.env.AWS_ROLE_ARN);

  const dynamo = hasStaticCreds
    ? new DynamoDBClient({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      })
    : hasRoleArn
      ? new DynamoDBClient({
          region,
          credentials: awsCredentialsProvider({
            roleArn: process.env.AWS_ROLE_ARN,
            clientConfig: { region },
          }),
        })
      : new DynamoDBClient({ region });

  client = DynamoDBDocumentClient.from(dynamo);
  return { ddb: client, tableName };
}

function requireAdmin(req, res) {
  const token = process.env.ADMIN_API_KEY;
  if (!token) {
    res.status(500).json({ error: "ADMIN_API_KEY is not configured" });
    return false;
  }

  const headerToken =
    req.headers["x-admin-key"] ||
    (req.headers.authorization || "").replace(/^Bearer\s+/i, "");

  if (headerToken !== token) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

module.exports = { getDb, requireAdmin };
