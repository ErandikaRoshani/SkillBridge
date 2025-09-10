import React, {createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";

export const UserContext = createContext({});

export const UserContextProvider = ({children}) => {
    const [user, setUser] = useState();
    const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [role, setRole] = useState(localStorage.getItem("signupRole") || null);

    const decodeToken = (token) => {
        if(token){
            const decoded = jwtDecode(token);
            const userData = decoded.sub;
            console.log("UserID: ", decoded.sub);
            setUser(userData);
        } else {
            const tokenLocal = localStorage.getItem("token");
            if(tokenLocal){
                console.log("UserID: from local ");
                decodeToken(tokenLocal);
            }
        }
    }
    useEffect(() => {
        const tokenLocal = localStorage.getItem("token");
    const roleLocal = localStorage.getItem("signupRole");

    if (roleLocal) setRole(roleLocal);
        decodeToken();
    }, [])

     // Keep localStorage in sync when role changes
  useEffect(() => {
    if (role) {
      localStorage.setItem("signupRole", role);
    }
  }, [role]);

  // Keep localStorage in sync when token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    }
  }, [token]);


    return (
        <UserContext.Provider value={{user, setUser, decodeToken,token, setToken, role, setRole}}>
            {children}
        </UserContext.Provider>
    )
}
const useUser = () => {
    const context = useContext(UserContext);
    if (context) {
        return context;
      }
}
export default useUser;