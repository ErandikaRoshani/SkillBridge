const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const {
  S3Client,
  PutBucketCorsCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
require("dotenv").config();

const REGION = process.env.AWS_REGION;

// --- DynamoDB Setup ---
const ddbClient = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const dynamoDb = DynamoDBDocumentClient.from(ddbClient);

// --- S3 Setup ---
const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Set CORS once
async function setCors() {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME || "skillbridge-code-reviews",
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "HEAD"],
            AllowedOrigins: ["http://localhost:3000"],
            ExposeHeaders: [],
          },
        ],
      },
    };
    await s3.send(new PutBucketCorsCommand(params));
    console.log("CORS set successfully");
  } catch (err) {
    console.error("Failed to set CORS:", err);
  }
}

// --- Generate Signed URL ---
const getFileSignedUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME || "skillbridge-code-reviews",
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn: 300 });
};

module.exports = { dynamoDb, s3, getFileSignedUrl, setCors };
