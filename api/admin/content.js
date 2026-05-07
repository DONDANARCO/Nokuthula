const { GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { getDb, requireAdmin } = require("../_db");

const PARTITION_KEY = process.env.DYNAMODB_TABLE_PARTITION_KEY || "PK";
const SORT_KEY = process.env.DYNAMODB_TABLE_SORT_KEY || "SK";

function parseJson(req) {
  if (!req.body) return {};
  if (typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body);
  } catch {
    return {};
  }
}

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { ddb, tableName } = getDb();

  if (req.method === "GET") {
    try {
      const result = await ddb.send(
        new GetCommand({
          TableName: tableName,
          Key: {
            [PARTITION_KEY]: "SITE#CONTENT",
            [SORT_KEY]: "PAGE#HOME",
          },
        })
      );
      return res.status(200).json({ content: (result.Item && result.Item.content) || {} });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch admin content", details: error.message });
    }
  }

  if (req.method === "POST") {
    const body = parseJson(req);
    const content = body.content && typeof body.content === "object" ? body.content : {};

    try {
      await ddb.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            [PARTITION_KEY]: "SITE#CONTENT",
            [SORT_KEY]: "PAGE#HOME",
            entityType: "SITE_CONTENT",
            updatedAt: new Date().toISOString(),
            content,
          },
        })
      );
      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to save content", details: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
