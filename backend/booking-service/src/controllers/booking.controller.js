const { create, getByMentor, getByMentee, updateStatus, getAllBookings  } = require("../services/booking.service");

async function createBooking(req, res) {
  try {
    const { sub, email } = req.user;
    const { mentorId, slot, day } = req.body;

    const booking = await create({
      menteeId: sub,
      mentorId,
      slot,
      day,
      status: "pending",
      paymentStatus: "successful",
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ message: "Booking created", booking });
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ error: "Could not create booking" });
  }
}

async function getMyBookings(req, res) {
  try {
    const { sub } = req.user;
    const { role } = req.query;

    let bookings;
    if (role === "mentor") {
      bookings = await getByMentor(sub);
    } else {
      bookings = await getByMentee(sub);
    }

    res.json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ error: "Could not fetch bookings" });
  }
}

async function acceptBooking(req, res) {
  return changeStatus(req, res, "accepted");
}

async function declineBooking(req, res) {
  return changeStatus(req, res, "declined");
}

async function cancelBooking(req, res) {
  return changeStatus(req, res, "cancelled");
}

async function changeStatus(req, res, status) {
  try {
    const { id } = req.params;
    const booking = await updateStatus(id, status);
    res.json({ message: `Booking ${status}`, booking });
  } catch (err) {
    console.error("Error updating booking:", err);
    res.status(500).json({ error: "Could not update booking" });
  }
}

// Create pending booking
async function createPendingBooking(item) {
  await doc.send(new PutCommand({
    TableName: BOOKING_TABLE,
    Item: item,
    ConditionExpression: 'attribute_not_exists(bookingId)'
  }));
  return item;
}

// Get booking by PaymentIntentId using GSI
async function getBookingByPaymentIntent(paymentIntentId) {
  const result = await doc.send(new QueryCommand({
    TableName: BOOKING_TABLE,
    IndexName: 'PaymentIntentIndex',
    KeyConditionExpression: 'paymentIntentId = :pi',
    ExpressionAttributeValues: { ':pi': paymentIntentId }
  }));
  return result.Items && result.Items[0];
}

// Update booking status
async function updateBookingStatus(bookingId, status, extra = {}) {
  const params = {
    TableName: BOOKING_TABLE,
    Key: { bookingId },
    UpdateExpression: 'SET #s = :s, updatedAt = :u, paymentInfo = :p',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':s': status,
      ':u': new Date().toISOString(),
      ':p': extra
    },
    ReturnValues: 'ALL_NEW'
  };
  const res = await doc.send(new UpdateCommand(params));
  return res.Attributes;
}

async function getBookingsForUser(req, res) {
  try {
    const { userId } = req.params;

    const allBookings = await getAllBookings(); // fetch all bookings from DB

    // Return bookings where the user is either mentor or mentee
    const userBookings = allBookings.filter(
      b => b.mentorId === userId || b.menteeId === userId
    );

    res.json(userBookings);
  } catch (err) {
    console.error("Error fetching user bookings:", err);
    res.status(500).json({ error: "Could not fetch bookings" });
  }
}


module.exports = { createBooking, getMyBookings, acceptBooking, declineBooking, cancelBooking, createPendingBooking,
  getBookingByPaymentIntent,
  updateBookingStatus, getBookingsForUser };
