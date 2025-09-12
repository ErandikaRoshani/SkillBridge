const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const { dynamoDb, s3 } = require("../../aws");

const {
  PutCommand,
  ScanCommand,
  UpdateCommand,
  GetCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

// -----------------------
// MENTEE FUNCTIONS
// -----------------------

async function createCodeReview({ menteeId, mentorId, repoUrl, file }) {
  let diffFileUrl = null;

  // Upload file to S3 if file present
  if (file) {
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `diffs/${uuidv4()}-${file.originalname}`,
      Body: fs.createReadStream(file.path),
    };

    await s3.send(new PutObjectCommand(uploadParams));
    diffFileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${uploadParams.Key}`;
  }

  const reviewId = uuidv4();
  const timestamp = new Date().toISOString();

  const params = {
    TableName: process.env.CODE_REVIEW_TABLE,
    Item: {
      reviewId,
      menteeId,
      mentorId: mentorId || null,
      repoUrl: repoUrl || null,
      diffFile: diffFileUrl,
      status: "pending",
      annotations: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };

  await dynamoDb.send(new PutCommand(params));
  return reviewId;
}

async function getReviewsByMentee(menteeId) {
  const params = {
    TableName: process.env.CODE_REVIEW_TABLE,
    FilterExpression: "menteeId = :menteeId",
    ExpressionAttributeValues: { ":menteeId": menteeId },
  };
  const data = await dynamoDb.send(new ScanCommand(params));
  return data.Items;
}

async function deleteReviewById(reviewId) {
  const params = {
    TableName: process.env.CODE_REVIEW_TABLE,
    Key: {
      reviewId: reviewId,
    },
    ConditionExpression: "attribute_exists(reviewId)", // ensures it exists
  };

  try {
    await dynamoDb.send(new DeleteCommand(params));
    return true;
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") return false;
    throw err;
  }
}

// -----------------------
// MENTOR FUNCTIONS
// -----------------------

async function getReviewsByMentor(mentorId) {
  const params = {
    TableName: process.env.CODE_REVIEW_TABLE,
    FilterExpression: "mentorId = :mentorId",
    ExpressionAttributeValues: { ":mentorId": mentorId },
  };
  const data = await dynamoDb.send(new ScanCommand(params));
  console.log(mentorId);

  return data.Items;
}

async function addAnnotations(reviewId, annotations) {
  const params = {
    TableName: process.env.CODE_REVIEW_TABLE,
    Key: { reviewId },
    UpdateExpression:
      "SET annotations = list_append(annotations, :ann), updatedAt = :updatedAt, #st = :status",
    ExpressionAttributeNames: {
      "#st": "status",
    },
    ExpressionAttributeValues: {
      ":ann": annotations,
      ":updatedAt": new Date().toISOString(),
      ":status": "in-progress",
    },
    ReturnValues: "UPDATED_NEW",
  };
  const result = await dynamoDb.send(new UpdateCommand(params));
  return result;
}

async function markReviewComplete(reviewId) {
  const params = {
    TableName: process.env.CODE_REVIEW_TABLE,
    Key: { reviewId },
    UpdateExpression: "SET #st = :status, updatedAt = :updatedAt",
    ExpressionAttributeNames: {
      "#st": "status",
    },
    ExpressionAttributeValues: {
      ":status": "completed",
      ":updatedAt": new Date().toISOString(),
    },
    ReturnValues: "UPDATED_NEW",
  };
  const result = await dynamoDb.send(new UpdateCommand(params));
  return result;
}

// -----------------------
// COMMON FUNCTIONS
// -----------------------

async function getReviewById(reviewId) {
  const params = {
    TableName: process.env.CODE_REVIEW_TABLE,
    Key: { reviewId },
  };
  const data = await dynamoDb.send(new GetCommand(params));
  return data.Item;
}

module.exports = {
  createCodeReview,
  getReviewsByMentee,
  getReviewsByMentor,
  getReviewById,
  addAnnotations,
  markReviewComplete,
  deleteReviewById,
};
