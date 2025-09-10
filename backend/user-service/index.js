const express = require("express");
const cors = require("cors");
//const verifyToken = require("./middleware/auth");

const app = express();
app.use(cors());
app.use(express.json());

// list mentors
const userRoutes = require("./src/routes/user.routes");
app.use("/users", userRoutes);

const port = process.env.PORT || 8090;
app.listen(port, () => console.log(`Backend running on port ${port}`));
