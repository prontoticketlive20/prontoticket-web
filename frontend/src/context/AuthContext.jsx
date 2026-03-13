import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const token =
    localStorage.getItem("ptl_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token");

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/me");
        const me = res.data?.data ?? res.data;

        setUser(me);

        localStorage.setItem("ptl_user_name", me.name || me.email);
        localStorage.setItem("ptl_user_role", me.role);
      } catch (e) {
        setUser(null);
      }

      setLoading(false);
    }

    loadUser();
  }, [token]);

  const logout = () => {
    localStorage.removeItem("ptl_token");
    localStorage.removeItem("ptl_user_name");
    localStorage.removeItem("ptl_user_role");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};