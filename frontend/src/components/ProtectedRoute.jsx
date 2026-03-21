import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  const token =
    localStorage.getItem("ptl_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("pt_token");

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}