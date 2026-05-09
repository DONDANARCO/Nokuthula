const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { getDb, requireAdmin } = require("../_db");
const { rateLimit } = require("../_security");

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!rateLimit(req, res, "admin-submissions", 120, 10 * 60 * 1000)) return;
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ddb, tableName } = getDb();

  try {
    const result = await ddb.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: "entityType = :type",
        ExpressionAttributeValues: {
          ":type": "FORM_SUBMISSION",
        },
      })
    );

    const items = (result.Items || []).sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );

    return res.status(200).json({ submissions: items });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch submissions",
      details: error.message,
    });
  }
};
