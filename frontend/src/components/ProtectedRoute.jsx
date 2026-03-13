import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api, { clearAuth } from "../api/api";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState("loading"); // loading | allowed | denied

  useEffect(() => {
    let alive = true;

    async function check() {
      const token =
        localStorage.getItem("ptl_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("pt_token");

      if (!token) {
        if (alive) setStatus("denied");
        return;
      }

      try {
        // ✅ valida token real
        const res = await api.get("/auth/me");
        const me = res.data?.data ?? res.data;

        // cache rápido para Header/UI
        const label = me?.name || me?.email || "Guest";
        const role = me?.role || null;

        localStorage.setItem("ptl_user_name", label);
        if (role) localStorage.setItem("ptl_user_role", role);

        if (alive) setStatus("allowed");
      } catch (e) {
        const httpStatus = e?.response?.status;

        // token inválido/expirado => limpiar todo
        if (httpStatus === 401 || httpStatus === 403) {
          clearAuth?.();
        }

        if (alive) setStatus("denied");
      }
    }

    setStatus("loading");
    check();

    return () => {
      alive = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-white/70">Validando sesión…</p>
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}