const express = require("express");
const verifyToken = require("../../../user-service/middleware/auth");
const {
  createBooking,
  getMyBookings,
  acceptBooking,
  declineBooking,
  cancelBooking,
  getBookingsForUser
} = require("../controllers/booking.controller");

const router = express.Router();

router.post("/", verifyToken, createBooking);
router.get("/me", verifyToken, getMyBookings);
router.patch("/:id/accept", verifyToken, acceptBooking);
router.patch("/:id/decline", verifyToken, declineBooking);
router.patch("/:id/cancel", verifyToken, cancelBooking);
router.get("/user/:userId", verifyToken, getBookingsForUser);


module.exports = router;
