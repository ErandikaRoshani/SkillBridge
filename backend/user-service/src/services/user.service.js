const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE || "Users";

async function saveUser(user) {
  const params = {
    TableName: USERS_TABLE,
    Item: user,
    ConditionExpression: "attribute_not_exists(userId)" // prevent overwrite
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

async function getMentors(filters = {}) {
  try {
    // Use expression attribute names for reserved keywords
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

    // Apply additional filters if provided
    let filterExpressions = [];
    let expressionAttributeValues = { ...scanParams.ExpressionAttributeValues };
    let expressionAttributeNames = { ...scanParams.ExpressionAttributeNames };

    if (filters.domain) {
      filterExpressions.push("contains(domains, :domain)");
      expressionAttributeValues[":domain"] = filters.domain;
    }

    if (filters.seniority) {
      filterExpressions.push("seniority = :seniority");
      expressionAttributeValues[":seniority"] = filters.seniority;
    }

    if (filters.badge) {
      filterExpressions.push("contains(badges, :badge)");
      expressionAttributeValues[":badge"] = filters.badge;
    }

    if (filters.availability) {
      filterExpressions.push("contains(availabilitySlots, :availability)");
      expressionAttributeValues[":availability"] = filters.availability;
    }

    if (filterExpressions.length > 0) {
      scanParams.FilterExpression += " AND " + filterExpressions.join(" AND ");
      scanParams.ExpressionAttributeValues = expressionAttributeValues;
      scanParams.ExpressionAttributeNames = expressionAttributeNames;
    }

    const result = await docClient.send(new ScanCommand(scanParams));
    return result.Items || [];
  } catch (err) {
    console.error("Error querying mentors:", err);
    throw err;
  }
}

module.exports = { saveUser, getUser, getMentors };
