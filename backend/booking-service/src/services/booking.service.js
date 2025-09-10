const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE || "Bookings";

async function create(data) {
  const booking = {
    bookingId: uuidv4(),
    ...data
  };

  await docClient.send(
    new PutCommand({
      TableName: BOOKINGS_TABLE,
      Item: booking
    })
  );

  return booking;
}

async function getByMentor(mentorId) {
  const result = await docClient.send(
    new ScanCommand({
      TableName: BOOKINGS_TABLE,
      FilterExpression: "mentorId = :m",
      ExpressionAttributeValues: { ":m": mentorId }
    })
  );
  return result.Items || [];
}

async function getByMentee(menteeId) {
  const result = await docClient.send(
    new ScanCommand({
      TableName: BOOKINGS_TABLE,
      FilterExpression: "menteeId = :m",
      ExpressionAttributeValues: { ":m": menteeId }
    })
  );
  return result.Items || [];
}


async function updateStatus(bookingId, status) {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: BOOKINGS_TABLE,
      Key: { bookingId },
      UpdateExpression: "set #s = :s, updatedAt = :u",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":s": status,
        ":u": new Date().toISOString()
      },
      ReturnValues: "ALL_NEW"
    })
  );

  return result.Attributes;
}

async function getAllBookings() {
  try {
    const command = new ScanCommand({ TableName: BOOKINGS_TABLE });
    const data = await docClient.send(command);
    return data.Items || [];
  } catch (err) {
    console.error("Error fetching bookings from DynamoDB:", err);
    throw err;
  }
}

module.exports = { create, getByMentor, getByMentee, updateStatus, getAllBookings};
