import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  IconButton,
} from "@mui/material";
import {
  CalendarToday,
  Person,
  Payment,
  ArrowBack,
  CheckCircle,
  Warning,
} from "@mui/icons-material";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { createBooking, getMyBookings } from "../api/bookingAPI";
import axios from "axios";

// Simple Stripe initialization
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Payment Form Component
function PaymentForm({ bookingData, onBack, onSuccess, onError, loading }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError("Payment system not ready. Please try again.");
      return;
    }

    setPaymentLoading(true);
    try {
      // Create payment intent with backend
      const paymentIntentResponse = await axios.post(
        `http://localhost:5002/api/create-payment-intent`,
        {
          amount: Math.round(bookingData.totalAmount * 100), // Convert to cents
          mentorId: bookingData.mentorId,
          slot: bookingData.selectedSlot,
          currency: "usd",
        },
        {
          headers: { Authorization: `Bearer ${bookingData.token}` },
        }
      );

      const { clientSecret } = paymentIntentResponse.data;

      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: "Mentee Name",
          },
        },
      });

      if (result.error) {
        onError(result.error.message);
      } else {
        onSuccess();
      }
    } catch (error) {
      console.error("Payment error:", error);
      onError(
        "Payment failed. Please try again. Make sure you're using test card: 4242 4242 4242 4242"
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const isLoading = loading || paymentLoading;

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Payment Details
      </Typography>

      <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Booking Summary</Typography>
          <Typography>Mentor: {bookingData.mentorId}</Typography>
          <Typography>Session: {bookingData.sessionDuration} hours</Typography>
          <Typography>Rate: ${bookingData.hourlyRate}/hour</Typography>
          <Typography variant="h6" color="primary">
            Total: ${bookingData.totalAmount}
          </Typography>
        </Box>
      </Card>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Credit Card Information
        </Typography>
        <Box
          sx={{
            p: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            minHeight: "50px",
            display: "flex",
            alignItems: "center",
            backgroundColor: "background.paper",
          }}
        >
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                  fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                },
                invalid: {
                  color: "#9e2146",
                },
              },
              hidePostalCode: false,
            }}
            onChange={(event) => {
              setCardComplete(event.complete);
            }}
          />
        </Box>
        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>Test Card:</strong> 4242 4242 4242 4242 |{" "}
          <strong>Exp:</strong> 12/34 | <strong>CVC:</strong> 567 |{" "}
          <strong>ZIP:</strong> 12345
        </Alert>
      </Box>

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          startIcon={<ArrowBack />}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || !cardComplete || isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : <Payment />}
        >
          {isLoading ? "Processing..." : `Pay $${bookingData.totalAmount}`}
        </Button>
      </Box>
    </Box>
  );
}

// Fallback component when Stripe is not available
function PaymentFallback({ bookingData, onBack, onSuccess, loading }) {
  const [simulateLoading, setSimulateLoading] = useState(false);

  const handleSimulatePayment = async () => {
    setSimulateLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      onSuccess();
      setSimulateLoading(false);
    }, 2000);
  };

  const isLoading = loading || simulateLoading;

  return (
    <Box>
      <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Booking Summary</Typography>
          <Typography>Mentor: {bookingData.mentorId}</Typography>
          <Typography>Session: {bookingData.sessionDuration} hours</Typography>
          <Typography>Rate: ${bookingData.hourlyRate}/hour</Typography>
          <Typography variant="h6" color="primary">
            Total: ${bookingData.totalAmount}
          </Typography>
        </Box>
      </Card>

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          startIcon={<ArrowBack />}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleSimulatePayment}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : <Payment />}
        >
          {isLoading
            ? "Processing Payment..."
            : `Payment - $${bookingData.totalAmount}`}
        </Button>
      </Box>
    </Box>
  );
}

export default function MenteeBookings({ token : propToken }) {
  const [bookings, setBookings] = useState([]);
  const [mentorId, setMentorId] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [mentorDetails, setMentorDetails] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mentorNames, setMentorNames] = useState({});
  const [token, setToken] = useState(propToken || localStorage.getItem("token"));

  const steps = ["Select Mentor", "Choose Slot", "Payment", "Confirmation"];

   useEffect(() => {
    if (propToken) {
      setToken(propToken);
      localStorage.setItem("token", propToken);
    } else {
      const storedToken = localStorage.getItem("token");
      if (storedToken) setToken(storedToken);
    }
  }, [propToken]);

  useEffect(() => {
    if (!token) return; // wait until token exists
    fetchBookings();
  }, [token]);


  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const data = await getMyBookings(token,"mentee");
     setBookings(Array.isArray(data) ? data : []);

           const uniqueMentorIds = [...new Set(data.map(booking => booking.mentorId))];
        const names = {};
        
        await Promise.all(
          uniqueMentorIds.map(async (mentorId) => {
            const userData = await fetchUserById(mentorId);
            names[mentorId] = userData.name || mentorId;
          })
        );
        
        setMentorNames(names);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load bookings");
    } finally {
      setLoadingBookings(false);
    }
  };

    const fetchUserById = async (id) => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/users/getUserById/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error(`Error fetching user ${id}:`, error);
        return { name: id }; // Fallback to ID if error
      }
    };

  useEffect(() => {
    const fetchMentorDetails = async () => {
      if (!mentorId) {
        setSlots([]);
        setSelectedSlot(null);
        setMentorDetails(null);
        return;
      }

      setLoading(true);
      setError("");
      try {
        // Fetch mentor availability
        const availabilityRes = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/users/${mentorId}/availability`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setSlots(availabilityRes.data.availabilitySlots || []);

        // Try to fetch mentor details, but don't fail if this endpoint doesn't exist
        try {
          const mentorRes = await axios.get(
            `${process.env.REACT_APP_BACKEND_URL}/users/${mentorId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setMentorDetails(mentorRes.data.data || { hourlyRate: 50 });
        } catch (mentorError) {
          console.warn(
            "Mentor details endpoint not available, using default rate"
          );
          setMentorDetails({ hourlyRate: 50 });
        }

        setActiveStep(1);
      } catch (err) {
        console.error("Error fetching mentor details:", err);
        setError(
          "Failed to load mentor information. Please check the Mentor ID."
        );
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    if (mentorId) {
      fetchMentorDetails();
    }
  }, [mentorId, token]);

  const calculateSessionDetails = (slot) => {
    if (!slot || !mentorDetails?.hourlyRate) return null;

    let durationHours = 1;

    if (slot.time) {
      const times = slot.time.split("-");
      if (times.length === 2) {
        const startTime = times[0].replace(/\s/g, "");
        const endTime = times[1].replace(/\s/g, "");

        const [startHour, startMinute] = startTime.split(":").map(Number);
        const [endHour, endMinute] = endTime.split(":").map(Number);

        if (!isNaN(startHour) && !isNaN(endHour)) {
          const start = startHour + (startMinute || 0) / 60;
          const end = endHour + (endMinute || 0) / 60;
          durationHours = end - start > 0 ? end - start : 1;
        }
      }
    }

    const totalAmount = durationHours * mentorDetails.hourlyRate;

    return {
      durationHours,
      hourlyRate: mentorDetails.hourlyRate,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setActiveStep(2);
  };

  const handlePaymentSuccess = async () => {
    setLoading(true);
    setError("");
    try {
      await createBooking(token, mentorId, selectedSlot.time, selectedSlot.day);
      setSuccess("Booking created successfully!");
      setActiveStep(3);
      await fetchBookings();
    } catch (err) {
      console.error("Error creating booking:", err);
      setError("Failed to create booking after payment");
      setActiveStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleReset = () => {
    setMentorId("");
    setSelectedSlot(null);
    setMentorDetails(null);
    setActiveStep(0);
    setError("");
  };

  const sessionDetails = selectedSlot
    ? calculateSessionDetails(selectedSlot)
    : null;
  const isStripeAvailable = !!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <CalendarToday sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Book a Session
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* Step 1: Select Mentor */}
      {activeStep === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Step 1: Select Mentor
            </Typography>
            <TextField
              fullWidth
              label="Mentor ID"
              value={mentorId}
              onChange={(e) => setMentorId(e.target.value)}
              placeholder="Enter mentor ID"
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <Person sx={{ mr: 1, color: "action.active" }} />
                ),
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 2: Choose Slot */}
      {activeStep === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <IconButton onClick={() => setActiveStep(0)} sx={{ mr: 2 }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6">Step 2: Choose Time Slot</Typography>
            </Box>

            {mentorDetails && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1">Mentor: {mentorId}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Hourly Rate: ${mentorDetails.hourlyRate}
                </Typography>
              </Box>
            )}

            {slots.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{ textAlign: "center", py: 4 }}
              >
                {loading
                  ? "Loading availability..."
                  : "No available slots found for this mentor"}
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {slots.map((slot, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        borderColor:
                          selectedSlot?.time === slot.time
                            ? "primary.main"
                            : "divider",
                        backgroundColor:
                          selectedSlot?.time === slot.time
                            ? "action.hover"
                            : "background.paper",
                        "&:hover": {
                          borderColor: "primary.main",
                          backgroundColor: "action.hover",
                        },
                      }}
                      onClick={() => handleSlotSelect(slot)}
                    >
                      <Typography variant="subtitle2">{slot.day}</Typography>
                      <Typography variant="body1" gutterBottom>
                        {slot.time} ({slot.timezone})
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Duration: {calculateSessionDetails(slot)?.durationHours}{" "}
                        hour/s
                      </Typography>
                      {mentorDetails?.hourlyRate && (
                        <Typography variant="body2" color="primary">
                          ${calculateSessionDetails(slot)?.totalAmount}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Payment */}
      {activeStep === 2 && sessionDetails && (
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <IconButton onClick={handleBack} sx={{ mr: 2 }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6">Step 3: Payment</Typography>
            </Box>

            {isStripeAvailable ? (
              <Elements stripe={stripePromise}>
                <PaymentForm
                  bookingData={{
                    mentorId,
                    selectedSlot,
                    sessionDuration: sessionDetails.durationHours,
                    hourlyRate: sessionDetails.hourlyRate,
                    totalAmount: sessionDetails.totalAmount,
                    token,
                  }}
                  onBack={handleBack}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  loading={loading}
                />
              </Elements>
            ) : (
              <PaymentFallback
                bookingData={{
                  mentorId,
                  selectedSlot,
                  sessionDuration: sessionDetails.durationHours,
                  hourlyRate: sessionDetails.hourlyRate,
                  totalAmount: sessionDetails.totalAmount,
                  token,
                }}
                onBack={handleBack}
                onSuccess={handlePaymentSuccess}
                loading={loading}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirmation */}
      {activeStep === 3 && (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <CheckCircle sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Booking Confirmed!
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Your session with {mentorId} has been booked successfully.
            </Typography>
            {selectedSlot && (
              <Typography variant="body2" color="text.secondary">
                Date: {selectedSlot.day} at {selectedSlot.time}
              </Typography>
            )}
            <Button variant="contained" sx={{ mt: 3 }} onClick={handleReset}>
              Book Another Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing Bookings */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom>
          Your Bookings
        </Typography>
        {bookings.length === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ textAlign: "center", py: 4 }}
          >
            No bookings yet
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {bookings.map((booking) => (
              <Grid item xs={12} key={booking.bookingId}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1">
                      {mentorNames[booking.mentorId] || booking.mentorId} 
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {booking.day} at {booking.slot}
                    </Typography>

                    <Chip
                      label={booking.status}
                      size="small"
                      color={
                        booking.status === "confirmed"
                          ? "success"
                          : booking.status === "pending"
                          ? "warning"
                          : "default"
                      }
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}
