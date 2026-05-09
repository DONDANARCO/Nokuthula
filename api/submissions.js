const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");
const { getDb } = require("./_db");
const { rateLimit, isAllowedOrigin, getClientIp } = require("./_security");

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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isValidPhone(phone) {
  if (!phone) return true;
  return /^[+0-9()\-\s]{7,24}$/.test(phone);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "no-store");

  if (!rateLimit(req, res, "contact-submit", 10, 5 * 60 * 1000)) {
    return;
  }

  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: "Forbidden origin" });
  }

  const body = parseBody(req.body, req.headers["content-type"] || "");
  const { ddb, tableName } = getDb();

  if (!tableName) {
    return res.status(500).json({ error: "DynamoDB table name not configured" });
  }

  const honeypot = sanitize(body.company);
  if (honeypot) {
    // Silent success for bots filling hidden fields.
    return res.status(200).end();
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
    clientIp: sanitize(getClientIp(req)),
  };

  if (!item.name || !item.email || !item.phone || !item.message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (item.name.length < 2 || item.name.length > 120) {
    return res.status(400).json({ error: "Invalid name length" });
  }

  if (item.message.length < 5 || item.message.length > 2500) {
    return res.status(400).json({ error: "Invalid message length" });
  }

  if (!isValidEmail(item.email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (!isValidPhone(item.phone)) {
    return res.status(400).json({ error: "Invalid phone format" });
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
