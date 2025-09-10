import { useState, useEffect } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { fetchAuthSession, getCurrentUser, signOut as amplifySignOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import axios from "axios";
import SignUpFormFields from "./SignUpFormFields";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

const components = {
  SignUp: {
    FormFields: SignUpFormFields,
  },
};

export default function AuthWrapper() {
  const [currentUser, setCurrentUser] = useState(null);
  const [hasProcessedUser, setHasProcessedUser] = useState(false);
  const [role, setRole] = useState(localStorage.getItem("signupRole") || null);
  const navigate = useNavigate();

  // check auth state on mount
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
          await handleSignIn(user);
        }
      } catch {
        setCurrentUser(null);
      }
    };
    checkAuthState();
  }, []);

  // listen for sign in / out events
  useEffect(() => {
    const hubListenerCancel = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") {
        setCurrentUser(payload.data);
        handleSignIn(payload.data);
      } else if (payload.event === "signedOut") {
        setCurrentUser(null);
        setRole(null);
        localStorage.removeItem("token");
        localStorage.removeItem("signupRole");
        navigate("/"); // redirect to login
      }
    });

    return () => hubListenerCancel();
  }, []);

  const handleSignIn = async (user) => {
    if (!user || hasProcessedUser) return;

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) return;
      localStorage.setItem("token", token);

      let finalRole = role;
      if (!finalRole) {
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        finalRole = res.data.role;
        setRole(finalRole);
        localStorage.setItem("signupRole", finalRole);
      }

      setHasProcessedUser(true);

      // redirect based on role
      if (finalRole === "mentee") {
        navigate("/mentee-bookings");
      } else if (finalRole === "mentor") {
        navigate("/mentor-bookings");
      }
    } catch (err) {
      console.error("Error during sign-in processing:", err);
    }
  };

  return (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh", // full viewport height
    }}
  >
    <Authenticator components={components}>
      {({ signOut }) => (
        <Box >
          <Box component="main" >
            <h2>Welcome! Please sign in or sign up.</h2>
          </Box>
        </Box>
      )}
    </Authenticator>
  </Box>
);

}
