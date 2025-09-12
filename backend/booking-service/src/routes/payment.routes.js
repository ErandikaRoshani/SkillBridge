const express = require("express");
const Stripe = require("stripe");
const dotenv = require("dotenv");

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Payment Intent
router.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency, mentorId, slot, description } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({ error: "Missing payment details" });
    }
    

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // amount in cents
      currency,
      description: description || `Mentoring session with ${mentorId} at ${slot}`,
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
