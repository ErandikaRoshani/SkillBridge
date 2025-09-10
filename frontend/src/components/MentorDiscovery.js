// src/components/MentorDiscovery.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Pagination,
  CircularProgress,
  Alert
} from '@mui/material';
import { FilterList, Schedule } from '@mui/icons-material';
import axios from 'axios';

const MentorDiscovery = ({ token }) => {
  const [mentors, setMentors] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    domain: '',
    seniority: '',
    badge: '',
    availability: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const mentorsPerPage = 6;

  // Fetch all mentors from backend (with filters)
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use REACT_APP_BACKEND_URL if available, otherwise default to localhost:8090
        const baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8090';
        
        // Build params object (Axios will handle URL encoding)
        const params = {};
        if (filters.domain) params.domain = filters.domain;
        if (filters.seniority) params.seniority = filters.seniority;
        if (filters.badge) params.badge = filters.badge;
        if (filters.availability) params.availability = filters.availability;
        
        console.log('Fetching mentors with params:', params);
        
        const response = await axios.get(`${baseURL}/users/mentors/all`, {
          params, // Axios will handle the query string
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Mentors response:', response.data);
        setMentors(response.data);
        setFilteredMentors(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching mentors:', error);
        setError(error.response?.data?.message || 'Failed to fetch mentors');
        setLoading(false);
      }
    };

    if (token) {
      fetchMentors();
    } else {
      setLoading(false);
      setError('Authentication token is missing');
    }
  }, [token, filters]); // Refetch when filters change

  // Apply search filter locally
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = mentors.filter(mentor => 
        mentor.name?.toLowerCase().includes(term) || 
        mentor.bio?.toLowerCase().includes(term) ||
        (mentor.domains && mentor.domains.some(domain => domain.toLowerCase().includes(term)))
      );
      setFilteredMentors(filtered);
    } else {
      setFilteredMentors(mentors);
    }
    setPage(1); // Reset to first page when search changes
  }, [searchTerm, mentors]);

  // Handle pagination
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Get current mentors for pagination
  const indexOfLastMentor = page * mentorsPerPage;
  const indexOfFirstMentor = indexOfLastMentor - mentorsPerPage;
  const currentMentors = filteredMentors.slice(indexOfFirstMentor, indexOfLastMentor);
  const totalPages = Math.ceil(filteredMentors.length / mentorsPerPage);

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      domain: '',
      seniority: '',
      badge: '',
      availability: ''
    });
    setSearchTerm('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading mentors...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Discover Mentors
      </Typography>
      
      {/* Filters and Search */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <FilterList sx={{ mr: 1 }} />
          <Typography variant="h6">Filters</Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Domain</InputLabel>
              <Select
                value={filters.domain}
                label="Domain"
                onChange={(e) => setFilters({...filters, domain: e.target.value})}
              >
                <MenuItem value="">All Domains</MenuItem>
                <MenuItem value="backend">Backend</MenuItem>
                <MenuItem value="frontend">Frontend</MenuItem>
                <MenuItem value="devops">DevOps</MenuItem>
                <MenuItem value="data">Data</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Seniority</InputLabel>
              <Select
                value={filters.seniority}
                label="Seniority"
                onChange={(e) => setFilters({...filters, seniority: e.target.value})}
              >
                <MenuItem value="">All Levels</MenuItem>
                <MenuItem value="senior">Senior Engineer</MenuItem>
                <MenuItem value="staff">Staff Engineer</MenuItem>
                <MenuItem value="principal">Principal Engineer</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Badge</InputLabel>
              <Select
                value={filters.badge}
                label="Badge"
                onChange={(e) => setFilters({...filters, badge: e.target.value})}
              >
                <MenuItem value="">All Badges</MenuItem>
                <MenuItem value="interview">Interview Coach</MenuItem>
                <MenuItem value="systemDesign">System Design Specialist</MenuItem>
                <MenuItem value="career">Career Advisor</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Availability</InputLabel>
              <Select
                value={filters.availability}
                label="Availability"
                onChange={(e) => setFilters({...filters, availability: e.target.value})}
              >
                <MenuItem value="">Any Time</MenuItem>
                <MenuItem value="morning">Morning</MenuItem>
                <MenuItem value="afternoon">Afternoon</MenuItem>
                <MenuItem value="evening">Evening</MenuItem>
                <MenuItem value="weekend">Weekend</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search by name, bio or domain"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type to search mentors..."
            />
          </Grid>
          
          <Grid item xs={12} md={6} display="flex" alignItems="center">
            <Button 
              variant="outlined" 
              onClick={resetFilters}
              sx={{ mr: 2 }}
              disabled={!filters.domain && !filters.seniority && !filters.badge && !filters.availability && !searchTerm}
            >
              Reset Filters
            </Button>
            <Typography variant="body2">
              {filteredMentors.length} {filteredMentors.length === 1 ? 'mentor' : 'mentors'} found
            </Typography>
          </Grid>
        </Grid>
      </Card>
      
      {/* Debug info - remove in production */}
      <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="caption">
          Debug: Active Filters - Domain: {filters.domain || 'None'}, 
          Seniority: {filters.seniority || 'None'}, 
          Badge: {filters.badge || 'None'}, 
          Availability: {filters.availability || 'None'}
        </Typography>
      </Box>
      
      {/* Mentors Grid */}
      {currentMentors.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {currentMentors.map((mentor) => (
              <Grid item xs={12} sm={6} md={4} key={mentor.id || mentor.userId}>
                <MentorCard mentor={mentor} />
              </Grid>
            ))}
          </Grid>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          )}
        </>
      ) : (
        <Typography variant="h6" textAlign="center" mt={4}>
          No mentors found matching your criteria
        </Typography>
      )}
    </Box>
  );
};

// Mentor Card Component
const MentorCard = ({ mentor }) => {
  // Function to format availability slots
  const formatAvailabilitySlot = (slot) => {
    if (typeof slot === 'string') {
      return slot; // Already a string, return as is
    }
    
    if (typeof slot === 'object' && slot !== null) {
      // Handle object format {day, timezone, time}
      if (slot.day && slot.time) {
        return `${slot.day} ${slot.time}`;
      }
      // Handle other object formats if needed
      return JSON.stringify(slot); // Fallback: stringify the object
    }
    
    return 'Unknown availability'; // Fallback for unexpected formats
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar 
            src={mentor.profilePicture} 
            sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}
          >
            {mentor.name?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6">{mentor.name || 'Unknown Mentor'}</Typography>
            <Typography variant="body2" color="textSecondary">
              {mentor.title || 'Mentor'} • {mentor.company || 'Unknown Company'}
            </Typography>
            <Rating value={mentor.rating || 0} readOnly size="small" />
          </Box>
        </Box>
        
        <Typography variant="body2" sx={{ mb: 2, minHeight: '40px' }}>
          {mentor.bio || 'No bio available'}
        </Typography>
        
        {/* Domains */}
        {mentor.domains && mentor.domains.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Domains:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {mentor.domains.map((domain, index) => (
                <Chip 
                  key={index} 
                  label={domain} 
                  size="small" 
                  variant="outlined" 
                  color="primary"
                />
              ))}
            </Box>
          </Box>
        )}
        
        {/* Seniority */}
        {mentor.seniority && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Seniority:
            </Typography>
            <Chip 
              label={mentor.seniority} 
              size="small" 
              color="primary" 
              variant="filled" 
            />
          </Box>
        )}
        
        {/* Badges */}
        {mentor.badges && mentor.badges.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Badges:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {mentor.badges.map((badge, index) => (
                <Chip 
                  key={index} 
                  label={badge} 
                  size="small" 
                  color="secondary" 
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}
        
        {/* Availability */}
        {mentor.availabilitySlots && mentor.availabilitySlots.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              <Schedule fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Available Slots:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {mentor.availabilitySlots.slice(0, 3).map((slot, index) => (
                <Chip 
                  key={index} 
                  label={formatAvailabilitySlot(slot)} 
                  size="small" 
                  variant="outlined" 
                  color="info"
                />
              ))}
              {mentor.availabilitySlots.length > 3 && (
                <Chip 
                  label={`+${mentor.availabilitySlots.length - 3} more`} 
                  size="small" 
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}
        
        {/* Hourly Rate */}
        {mentor.hourlyRate && (
          <Box mt={2}>
            <Typography variant="subtitle2" color="primary">
              ${mentor.hourlyRate}/hour
            </Typography>
          </Box>
        )}
      </CardContent>
      
      <Box p={2}>
        <Button 
          variant="contained" 
          fullWidth
          onClick={() => window.location.href = `/mentor-bookings?mentorId=${mentor.id || mentor.userId}`}
          sx={{ mt: 'auto' }}
        >
          Book Session
        </Button>
      </Box>
    </Card>
  );
};

export default MentorDiscovery;