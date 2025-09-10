import React, { useEffect, useState } from "react";
import { getMyBookings, acceptBooking, declineBooking } from "../api/bookingAPI";
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider
} from "@mui/material";
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from "@mui/icons-material";
import axios from "axios";

export default function MentorBookings({ token : propToken }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menteeNames, setMenteeNames] = useState({});
  const [actionDialog, setActionDialog] = useState({
    open: false,
    booking: null,
    action: ""
  });
    const [token, setToken] = useState(propToken || localStorage.getItem("token"));

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
    async function fetchBookings() {
      try {
        setLoading(true);
        const data = await getMyBookings(token,"mentor");
        setBookings(data);
         const uniqueMenteeIds = [...new Set(data.map(booking => booking.menteeId))];
        const names = {};
        
        await Promise.all(
          uniqueMenteeIds.map(async (menteeId) => {
            const userData = await fetchUserById(menteeId);
            names[menteeId] = userData.name || menteeId;
          })
        );
        
        setMenteeNames(names);
      } catch (err) {
        setError("Failed to fetch bookings");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [token]);

  const handleActionClick = (booking, action) => {
    setActionDialog({
      open: true,
      booking,
      action
    });
  };

  const handleActionConfirm = async () => {
    const { booking, action } = actionDialog;
    try {
      if (action === "accept") {
        await acceptBooking(token, booking.bookingId);
      } else if (action === "decline") {
        await declineBooking(token, booking.bookingId);
      }
      
      // Refresh the bookings list
      const data = await getMyBookings(token,"mentor");
      setBookings(data);
      setActionDialog({ open: false, booking: null, action: "" });
    } catch (err) {
      setError(`Failed to ${action} booking`);
      console.error(err);
    }
  };

  const handleActionCancel = () => {
    setActionDialog({ open: false, booking: null, action: "" });
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

  const getStatusChip = (status) => {
    let color = "default";
    let label = status;
    
    switch(status) {
      case "pending":
        color = "warning";
        label = "Pending Review";
        break;
      case "accepted":
        color = "success";
        label = "accepted";
        break;
      case "declined":
        color = "error";
        label = "Declined";
        break;
      case "cancelled":
        color = "error";
        label = "Cancelled";
        break;
      case "completed":
        color = "info";
        label = "Completed";
        break;
      default:
        color = "default";
    }
    
    return <Chip label={label} color={color} size="small" />;
  };

  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    const [start, end] = timeString.split('-');
    return `${start} - ${end}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        My Booking Requests
      </Typography>
      
      {bookings.length === 0 ? (
        <Box textAlign="center" py={6}>
          <ScheduleIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No booking requests yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your booking requests will appear here when mentees schedule sessions with you.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {bookings.map((booking) => (
            <Grid item xs={12} md={6} key={booking.bookingId}>
              <Card 
                elevation={2} 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  border: booking.status === 'pending' ? '1px solid #ff9800' : 'none'
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h3">
                      Session with {menteeNames[booking.menteeId] || booking.menteeId}
                    </Typography>
                    {getStatusChip(booking.status)}
                  </Box>
                  
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <CalendarIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary="Date" 
                        secondary={formatDate(booking.day)} 
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <ScheduleIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary="Time Slot" 
                        secondary={formatTime(booking.slot)} 
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary="Mentee" 
                        secondary={menteeNames[booking.menteeId] || booking.menteeId} 
                      />
                    </ListItem>
                  </List>
                  
                  {booking.notes && (
                    <Box mt={2}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Mentee Notes:</strong> {booking.notes}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                
                {booking.status === "pending" && (
                  <>
                    <Divider />
                    <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CloseIcon />}
                        onClick={() => handleActionClick(booking, "decline")}
                        size="small"
                      >
                        Decline
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckIcon />}
                        onClick={() => handleActionClick(booking, "accept")}
                        size="small"
                      >
                        Accept
                      </Button>
                    </CardActions>
                  </>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      <Dialog
        open={actionDialog.open}
        onClose={handleActionCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionDialog.action === "accept" ? "Accept Booking Request" : "Decline Booking Request"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {actionDialog.action} the booking session with{" "}
            {actionDialog.booking?.menteeId} on {actionDialog.booking && formatDate(actionDialog.booking.day)}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleActionCancel}>Cancel</Button>
          <Button
            onClick={handleActionConfirm}
            color={actionDialog.action === "accept" ? "success" : "error"}
            variant="contained"
          >
            Confirm {actionDialog.action === "accept" ? "Accept" : "Decline"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}