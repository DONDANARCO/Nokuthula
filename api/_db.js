const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const {
  awsCredentialsProvider,
} = require("@vercel/oidc-aws-credentials-provider");
const { timingSafeEqualString } = require("./_security");

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
  const adminUser = process.env.ADMIN_USERNAME || "NMPodiatrist";
  const adminPass = process.env.ADMIN_PASSWORD || "P0diatrist";

  const headerUser = req.headers["x-admin-user"] || "";
  const headerPass = req.headers["x-admin-pass"] || "";

  // Evaluate both comparisons to avoid short-circuit timing differences.
  const userMatches = timingSafeEqualString(headerUser, adminUser);
  const passMatches = timingSafeEqualString(headerPass, adminPass);

  if (!(userMatches && passMatches)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

module.exports = { getDb, requireAdmin };