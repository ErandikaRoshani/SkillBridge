import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

export const UserContext = createContext({});

export const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState();
  const [userName, setUserName] = useState(
    localStorage.getItem("userName") || null
  );
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [role, setRole] = useState(localStorage.getItem("signupRole") || null);

  const decodeToken = async (tokenToDecode = token) => {
    if (tokenToDecode) {
      try {
        const decoded = jwtDecode(tokenToDecode);
        const userId = decoded.sub;
        setUser(userId);

        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/users/getUserById/${userId}`,
          {
            headers: { Authorization: `Bearer ${tokenToDecode}` },
          }
        );

        const userData = response.data;
        const name = userData.name || userData.username;

        setUserName(name);
        localStorage.setItem("userName", name);
        return userData;
      } catch (error) {
        console.error("Error decoding token or fetching user:", error);
        try {
          const decoded = jwtDecode(tokenToDecode);
          const name = decoded.name || decoded.username || decoded.sub;
          setUserName(name);
          localStorage.setItem("userName", name);
          return { name };
        } catch (decodeError) {
          console.error("Error decoding token:", decodeError);
          return null;
        }
      }
    }
    return null;
  };

  // Update user data when token changes
  useEffect(() => {
    if (token) {
      decodeToken(token);
    } else {
      // Clear user data when token is removed
      setUser(null);
      setUserName(null);
      localStorage.removeItem("userName");
    }
  }, [token]);

  // Initial load - check for existing token
  useEffect(() => {
    const tokenLocal = localStorage.getItem("token");
    const roleLocal = localStorage.getItem("signupRole");
    const userNameLocal = localStorage.getItem("userName");

    if (roleLocal) setRole(roleLocal);
    if (userNameLocal) setUserName(userNameLocal);

    if (tokenLocal && !token) {
      setToken(tokenLocal);
      decodeToken(tokenLocal);
    }
  }, []);

  // Keep localStorage in sync when role changes
  useEffect(() => {
    if (role) {
      localStorage.setItem("signupRole", role);
    } else {
      localStorage.removeItem("signupRole");
    }
  }, [role]);

  // Keep localStorage in sync when token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        userName,
        setUserName,
        decodeToken,
        token,
        setToken,
        role,
        setRole,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserContextProvider");
  }
  return context;
};

export default useUser;
