const API_BASE = "http://localhost:5002"; // Booking service URL

export async function createBooking(token, mentorId, slot, day) {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ mentorId, slot, day })
  });
  return res.json();
}

export async function getMyBookings(token, role) {
  const res = await fetch(`${API_BASE}/bookings/me?role=${role}`, {
    headers: { 
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  return res.json();
}

export async function acceptBooking(token, bookingId) {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/accept`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${token}` }
  });
  return res.json();
}

export async function declineBooking(token, bookingId) {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/decline`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${token}` }
  });
  return res.json();
}

export async function cancelBooking(token, bookingId) {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${token}` }
  });
  return res.json();
}
