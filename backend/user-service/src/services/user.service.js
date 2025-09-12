const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE || "Users";

async function saveUser(user) {
  const params = {
    TableName: USERS_TABLE,
    Item: user,
    //ConditionExpression: "attribute_not_exists(userId)" // prevent overwrite
  };

  try {
    await docClient.send(new PutCommand(params));
    return user;
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      throw new Error("User already exists");
    }
    throw err;
  }
}

async function getUser(userId) {
  const result = await docClient.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId }
    })
  );
  return result.Item;
}

async function getMentors() {
  try {
    const scanParams = {
      TableName: USERS_TABLE,
      FilterExpression: "#role = :role",
      ExpressionAttributeNames: {
        "#role": "role"
      },
      ExpressionAttributeValues: {
        ":role": "mentor"
      }
    };

    const result = await docClient.send(new ScanCommand(scanParams));
    return result.Items || [];
  } catch (err) {
    console.error("Error querying all mentors:", err);
    throw err;
  }
}

module.exports = { saveUser, getUser, getMentors };
