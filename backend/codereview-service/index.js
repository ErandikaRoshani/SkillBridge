const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const codeReviewRoutes = require("./src/routes/code-review.routes");
const verifyToken = require("../user-service/middleware/auth");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/code-reviews", verifyToken, codeReviewRoutes);

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
