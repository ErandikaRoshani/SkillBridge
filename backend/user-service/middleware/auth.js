const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");
const axios = require("axios");

const region = process.env.AWS_REGION;
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const cognitoIssuer = `https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_HEjAi0uZX`;

let pems = null;

// Load Cognito JSON Web Keys
async function getPems() {
  if (pems) return pems;

  const url = `${cognitoIssuer}/.well-known/jwks.json`;
  const { data } = await axios.get(url);
  pems = {};
  data.keys.forEach((key) => {
    pems[key.kid] = jwkToPem(key);
  });

  return pems;
}

// Middleware to protect routes
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "Missing Authorization header" });

    const token = authHeader.replace("Bearer ", "");
    const decodedHeader = jwt.decode(token, { complete: true });

    if (!decodedHeader) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const kid = decodedHeader.header.kid;
    const pems = await getPems();

    const pem = pems[kid];
    if (!pem) {
      return res.status(401).json({ error: "Invalid token signature" });
    }

    jwt.verify(token, pem, { issuer: cognitoIssuer }, (err, payload) => {
      if (err) {
        return res.status(401).json({ error: "Unauthorized: " + err.message });
      }

      // Attach user info to request
      req.user = payload;
      next();
    });
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: "Token validation failed" });
  }
}

module.exports = verifyToken;
