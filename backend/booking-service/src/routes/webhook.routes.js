// const express = require('express');
// const router = express.Router();
// const Stripe = require('stripe');
// const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
// const { updateBookingStatus, getBookingByPaymentIntent } = require('../services/booking.service');

// router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
//   const sig = req.headers['stripe-signature'];
//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
//   } catch (err) {
//     console.error('Webhook signature verification failed.', err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   try {
//     switch (event.type) {
//       case 'payment_intent.succeeded': {
//         const pi = event.data.object;
//         const booking = await getBookingByPaymentIntent(pi.id);
//         if (booking) {
//           await updateBookingStatus(booking.bookingId, 'confirmed', {
//             paymentIntentId: pi.id,
//             amountReceived: pi.amount_received,
//             currency: pi.currency
//           });
//         }
//         break;
//       }
//       case 'payment_intent.payment_failed': {
//         const pi = event.data.object;
//         const booking = await getBookingByPaymentIntent(pi.id);
//         if (booking) {
//           await updateBookingStatus(booking.bookingId, 'failed', { paymentIntentId: pi.id });
//         }
//         break;
//       }
//     }
//     res.json({ received: true });
//   } catch (err) {
//     console.error('Error handling webhook:', err);
//     res.status(500).end();
//   }
// });

// module.exports = router;
