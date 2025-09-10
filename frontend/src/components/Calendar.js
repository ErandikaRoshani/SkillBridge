import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import {
  Container,
  Typography,
  CircularProgress,
  Box,
  Button,
} from "@mui/material";
import Modal from "react-modal";
import Peer from "simple-peer";
import axios from "axios";
import useUser from "../services/UserContext";

export default function UserCalendar() {
   const { user, role, token } = useUser();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [peers, setPeers] = useState([]);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const wsRef = useRef(null);

  useEffect(() => {
    const fetchBookings = async () => {
      console.log("ab",token, user, role)
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:5002/bookings/user/${user}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = Array.isArray(res.data) ? res.data : [];
        const acceptedBookings = data.filter((b) => b.status === "accepted");
        setBookings(acceptedBookings);
        console.log("ab",acceptedBookings)
      } catch (err) {
        console.error(err);
        setError("Failed to fetch bookings");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [token, user]);

  const events = bookings.map((b) => {
    const [startTime, endTime] = b.slot.split("-");
    const day = b.day.replace(/\//g, "-");
    return {
      title: `Mentor: ${b.mentorId}`,
      start: `${day}T${startTime}:00`,
      end: `${day}T${endTime}:00`,
      color: "green",
      extendedProps: { bookingData: b },
    };
  });

const handleEventClick = (info) => {
  const bookingData = info.event.extendedProps.bookingData;
  const roomId = `${bookingData.mentorId}-${bookingData.menteeId}-${bookingData.day}-${bookingData.slot}`;
  
  // Open live session in new tab with roomId
  window.open(`/live/${encodeURIComponent(roomId)}`, "_blank");
};

  const closeModal = () => {
    peers.forEach((p) => p.destroy());
    setPeers([]);
    if (wsRef.current) wsRef.current.close();
    setIsModalOpen(false);
    setCurrentBooking(null);
  };

  if (loading) return <CircularProgress />;
  if (error)
    return (
      <Typography color="error" sx={{ textAlign: "center", mt: 4 }}>
        {error}
      </Typography>
    );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: "center" }}>
        {role === "mentee" ? "My Calendar" : "Mentor Calendar"}
      </Typography>
      <Box sx={{ mt: 4 }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          height="auto"
          eventClick={handleEventClick}
        />
      </Box>

      {/* Modal for live session */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Live Session"
        style={{ content: { width: "800px", margin: "auto" } }}
      >
        <Typography variant="h6" gutterBottom>
          Live Pair Programming: {currentBooking?.mentorId}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <video ref={localVideoRef} autoPlay muted style={{ width: "48%" }} />
          <video ref={remoteVideoRef} autoPlay style={{ width: "48%" }} />
        </Box>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mt: 2 }}
          onClick={closeModal}
        >
          End Session
        </Button>
      </Modal>
    </Container>
  );
}
