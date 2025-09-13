import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import AuthWrapper from "./components/AuthWrapper";
import LiveSession from "./components/LiveSession";
import Calendar from "./components/Calendar";
import MenteeBookings from "./components/MenteeBooking";
import MentorBookings from "./components/MentorBooking";
import { UserContextProvider } from "./services/UserContext";
import Header from "./components/Header";
import { Box } from "@mui/material";
import { useState, useEffect } from "react";
import { getCurrentUser, fetchAuthSession, signOut as amplifySignOut } from "aws-amplify/auth";
import MentorDiscovery from "./components/MentorDiscovery";
import AvailabilityManager from "./components/AvailabilityManager";
import MenteeCodeReviews from "./components/MenteeCodeReviews";
import MentorCodeReviews from "./components/MentorCodeReviews";
import Messaging from "./components/Messaging";
import ChatWidget from "./components/ChatWidget";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(localStorage.getItem("signupRole") || null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
          localStorage.setItem("userId", user.userId);
          const session = await fetchAuthSession();
          const newToken = session.tokens?.idToken?.toString();
          if (newToken) {
            setToken(newToken);
            localStorage.setItem("token", newToken);
          }
        }
      } catch {
        setCurrentUser(null);
      }
    };
    checkAuthState();
  }, []);

  const handleSignOut = async () => {
    await amplifySignOut();
    setCurrentUser(null);
    setRole(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("signupRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    navigate("/");
  };

  // hide header on `/`
  const hideHeader = location.pathname === "/";

  return (
    <UserContextProvider>
      <Box sx={{ flexGrow: 1 }}>
        {!hideHeader && (
          <Header user={currentUser} role={role} onSignOut={handleSignOut} token={token} />
        )}

        <Box component="main">
          <Routes>
            <Route path="/" element={<AuthWrapper />} />
            <Route path="/live/:bookingId" element={<LiveSession />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/messaging" element={<Messaging />} />
            <Route path="/mentee-code-reviews" element={<MenteeCodeReviews />} />
            <Route path="/mentor-code-reviews" element={<MentorCodeReviews />} />
            <Route path="/mentor-bookings" element={<MentorBookings token={token} />} />
            <Route path="/mentee-bookings" element={<MenteeBookings token={token} />} />
            <Route path="/mentors" element={<MentorDiscovery token={token} />} />
            <Route path="/availability" element={<AvailabilityManager token={token} mentorId={currentUser?.userId} />} />
          </Routes>
        </Box>
        <ChatWidget />
      </Box>
    </UserContextProvider>
  );
}

export default App;