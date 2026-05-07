const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");
const { getDb } = require("./_db");

const PARTITION_KEY = process.env.DYNAMODB_TABLE_PARTITION_KEY || "PK";
const SORT_KEY = process.env.DYNAMODB_TABLE_SORT_KEY || "SK";

function parseBody(reqBody, contentType = "") {
  if (!reqBody) return {};

  if (typeof reqBody === "object" && !Buffer.isBuffer(reqBody)) {
    return reqBody;
  }

  if (Buffer.isBuffer(reqBody)) {
    reqBody = reqBody.toString("utf8");
  }

  if (typeof reqBody !== "string") return {};

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(reqBody);
    } catch {
      return {};
    }
  }

  const params = new URLSearchParams(reqBody);
  return Object.fromEntries(params.entries());
}

function sanitize(input) {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, 5000);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = parseBody(req.body, req.headers["content-type"] || "");
  const { ddb, tableName } = getDb();

  if (!tableName) {
    return res.status(500).json({ error: "DynamoDB table name not configured" });
  }

  const item = {
    [PARTITION_KEY]: `SUBMISSION#${crypto.randomUUID()}`,
    [SORT_KEY]: `AT#${new Date().toISOString()}`,
    entityType: "FORM_SUBMISSION",
    createdAt: new Date().toISOString(),
    formType: sanitize(body.formType) || "unknown",
    sourcePage: sanitize(body.sourcePage) || "unknown",
    name: sanitize(body.name),
    email: sanitize(body.email),
    phone: sanitize(body.phone),
    message: sanitize(body.message),
    userAgent: sanitize(req.headers["user-agent"] || ""),
  };

  if (!item.name || !item.email || !item.message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await ddb.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );

    const referer = req.headers.referer || "/";
    const redirectUrl = referer.includes("?")
      ? `${referer}&submitted=1`
      : `${referer}?submitted=1`;

    res.writeHead(302, { Location: redirectUrl });
    return res.end();
  } catch (error) {
    return res.status(500).json({
      error: "Failed to save submission",
      details: error.message,
    });
  }
};
