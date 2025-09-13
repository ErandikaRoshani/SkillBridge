require('dotenv').config();
const express = require('express');
const cors = require('cors');
const messageRoutes = require('./src/routes/messaging.routes');

const app = express();
const PORT = process.env.PORT || 5004;

// Middleware
app.use(cors());
app.use(express.json());

app.use('/messages', messageRoutes);

app.listen(PORT, () => {
  console.log(`Chat service running on port ${PORT}`);
});