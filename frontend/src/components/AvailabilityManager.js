import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  IconButton,
  Chip,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { Add, Delete, Schedule } from '@mui/icons-material';
import axios from 'axios';
import useUser from "../services/UserContext";

const AvailabilityManager = ({mentorId }) => {
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [newSlot, setNewSlot] = useState({
    date: '',
    startTime: '',
    endTime: '',
    timezone: 'Asia/Colombo'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const {user} = useUser();

  // Time options
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeString);
    }
  }

  // Timezone options
  const timezoneOptions = [
    'Asia/Colombo', 'EST', 'PST', 'CST', 'MST', 'UTC', 
    'GMT', 'CET', 'EET', 'IST', 'JST', 'AEST'
  ];

  // Fetch current availability
  useEffect(() => {
    fetchAvailability();
  }, [token, user]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8090';
      const response = await axios.get(`${baseURL}/users/${user}/availability`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setAvailabilitySlots(response.data.availabilitySlots || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setError('Failed to load availability slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotChange = (e) => {
    setNewSlot({
      ...newSlot,
      [e.target.name]: e.target.value
    });
  };

  // Format date to YYYY/MM/DD format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

const addAvailabilitySlot = async () => {
  if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
    setError('Please fill all fields');
    return;
  }

  if (newSlot.startTime >= newSlot.endTime) {
    setError('End time must be after start time');
    return;
  }

  try {
    setLoading(true);
    setError('');
    setSuccess('');

    // Build DynamoDB-style slot
   const formattedSlot = {
  day:formatDate(newSlot.date),
time:  `${newSlot.startTime}-${newSlot.endTime}`,
timezone:  newSlot.timezone
   }
;
// Result: ["2025/09/13", "14:00-16:00", "Asia/Colombo"]
console.log("fornat",formattedSlot)
    const baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8090';

    // Fetch current user
    const userResponse = await axios.get(`${baseURL}/users/me`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const currentUser = userResponse.data;
    const currentSlots = currentUser.availabilitySlots || [];
console.log("currentSlots",currentSlots)
    // Add new DynamoDB slot
    const updatedSlots = [...currentSlots, formattedSlot];

    console.log('Sending slots to backend:', JSON.stringify(updatedSlots, null, 2));

    // Save updated availability
    await axios.put(`${baseURL}/users/update-availability`, {
      availabilitySlots: updatedSlots
    }, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    setAvailabilitySlots(updatedSlots);
    setNewSlot({ date: '', startTime: '', endTime: '', timezone: 'Asia/Colombo' });
    setSuccess('Availability slot added successfully!');
    setTimeout(() => setSuccess(''), 3000);

  } catch (error) {
    console.error('Error adding availability slot:', error);
    setError('Failed to add availability slot: ' + (error.response?.data?.message || error.message));
  } finally {
    setLoading(false);
  }
};


  const removeAvailabilitySlot = async (index) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8090';
      
      // First get current user data
      const userResponse = await axios.get(`${baseURL}/users/me`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const currentUser = userResponse.data;
      const currentSlots = currentUser.availabilitySlots || [];
      
      // Remove the slot at the specified index
      const updatedSlots = currentSlots.filter((_, i) => i !== index);
      
      // Update user with remaining slots
      await axios.put(`${baseURL}/users/update-availability`, {
        availabilitySlots: updatedSlots
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setAvailabilitySlots(updatedSlots);
      setSuccess('Availability slot removed successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Error removing availability slot:', error);
      setError('Failed to remove availability slot');
    } finally {
      setLoading(false);
    }
  };

  // Function to parse DynamoDB format for display
  const parseDynamoDBSlot = (slot) => {
    if (slot.M) {
      return {
        day: slot.M.day?.S || '',
        timezone: slot.M.timezone?.S || '',
        time: slot.M.time?.S || ''
      };
    }
    return slot; // Fallback for non-DynamoDB format
  };

  const formatSlotForDisplay = (slot) => {
    const parsedSlot = parseDynamoDBSlot(slot);
    
    if (parsedSlot.day && parsedSlot.time) {
      return `${parsedSlot.day} ${parsedSlot.time} (${parsedSlot.timezone})`;
    }
    
    return JSON.stringify(slot);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            <Schedule sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" component="h2">
              Manage Availability
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {/* Add New Slot Form */}
          <Box sx={{ mb: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Add New Time Slot
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth  sx={{ minWidth: 150 }}>
                  <TextField
                    fullWidth
                    name="date"
                    label="Select Date"
                    type="date"
                    value={newSlot.date}
                    onChange={handleSlotChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControl fullWidth  sx={{ minWidth: 150 }}>
                  <InputLabel>Start Time</InputLabel>
                  <Select
                    name="startTime"
                    value={newSlot.startTime}
                    label="Start Time"
                    onChange={handleSlotChange}
                  >
                    {timeOptions.map(time => (
                      <MenuItem key={time} value={time}>{time}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControl fullWidth sx={{ minWidth: 150 }} >
                  <InputLabel>End Time</InputLabel>
                  <Select
                    name="endTime"
                    value={newSlot.endTime}
                    label="End Time"
                    onChange={handleSlotChange}
                  >
                    {timeOptions.map(time => (
                      <MenuItem key={time} value={time}>{time}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControl fullWidth sx={{ minWidth: 150 }}>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    name="timezone"
                    value={newSlot.timezone}
                    label="Timezone"
                    onChange={handleSlotChange}
                  >
                    {timezoneOptions.map(tz => (
                      <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={addAvailabilitySlot}
                  disabled={loading}
                  fullWidth
                >
                  Add Time Slot
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Current Availability Slots */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Current Availability ({availabilitySlots.length} slots)
            </Typography>
            
            {availabilitySlots.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                No availability slots added yet. Add your first time slot above.
              </Typography>
            ) : (
              <Grid container spacing={1}>
                {availabilitySlots.map((slot, index) => {
                  const parsedSlot = parseDynamoDBSlot(slot);
                  return (
                    <Grid item xs={12} key={index}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5,
                          border: '1px solid',
                          borderColor: 'grey.200',
                          borderRadius: 1,
                          bgcolor: 'white',
                          '&:hover': { bgcolor: 'grey.50' }
                        }}
                      >
                        <Box>
                          <Chip
                            label={parsedSlot.day}
                            color="primary"
                            variant="outlined"
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="body1" component="span">
                            {formatSlotForDisplay(slot)}
                          </Typography>
                        </Box>
                        
                        <IconButton
                          color="error"
                          onClick={() => removeAvailabilitySlot(index)}
                          disabled={loading}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AvailabilityManager;