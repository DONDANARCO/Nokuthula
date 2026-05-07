const { GetCommand } = require("@aws-sdk/lib-dynamodb");
const { getDb } = require("./_db");

const PARTITION_KEY = process.env.DYNAMODB_TABLE_PARTITION_KEY || "PK";
const SORT_KEY = process.env.DYNAMODB_TABLE_SORT_KEY || "SK";

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ddb, tableName } = getDb();

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

    return res.status(200).json({
      content: (result.Item && result.Item.content) || {},
      updatedAt: result.Item ? result.Item.updatedAt : null,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch content",
      details: error.message,
    });
  }
};
