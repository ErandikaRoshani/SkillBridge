const express = require("express");
const cors = require("cors");
const bookingRoutes = require("./src/routes/booking.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/bookings", bookingRoutes);
// const webhookRoutes = require('./src/routes/webhook.routes');
// app.use('/webhook', webhookRoutes);
const paymentRoutes = require('./src/routes/payment.routes');
app.use("/api", paymentRoutes);


const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Booking Service running on port ${PORT}`);
});
