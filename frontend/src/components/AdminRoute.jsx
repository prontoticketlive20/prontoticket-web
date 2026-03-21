import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api, { clearAuth } from "../api/api";

function extractUser(payload) {
  if (!payload) return null;

  if (payload?.data?.role || payload?.data?.email || payload?.data?.userId || payload?.data?.id) {
    return payload.data;
  }

  if (payload?.role || payload?.email || payload?.userId || payload?.id) {
    return payload;
  }

  return null;
}

export default function AdminRoute({ children, allowedRoles }) {
  const location = useLocation();
  const [status, setStatus] = useState("loading"); // loading | allowed | denied

  const rolesKey = useMemo(() => {
    if (!allowedRoles || allowedRoles.length === 0) return "";
    return allowedRoles.slice().sort().join("|");
  }, [allowedRoles]);

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

      // ✅ Si no hay restricción de rol, con token basta
      if (!allowedRoles || allowedRoles.length === 0) {
        if (alive) setStatus("allowed");
        return;
      }

      // ✅ Primero intentamos con el rol cacheado
      const cachedRole =
        localStorage.getItem("ptl_user_role") ||
        localStorage.getItem("user_role") ||
        null;

      if (cachedRole && allowedRoles.includes(cachedRole)) {
        if (alive) setStatus("allowed");
        return;
      }

      // ✅ Si no hay role cacheado o no coincide, consultamos backend
      try {
        const res = await api.get("/auth/me");
        const me = extractUser(res.data);

        const role =
          me?.role ||
          localStorage.getItem("ptl_user_role") ||
          localStorage.getItem("user_role") ||
          null;

        const label =
          me?.name ||
          me?.email ||
          localStorage.getItem("ptl_user_name") ||
          "Cuenta";

        localStorage.setItem("ptl_user_name", label);
        if (role) localStorage.setItem("ptl_user_role", role);

        if (!alive) return;

        if (role && allowedRoles.includes(role)) {
          setStatus("allowed");
        } else {
          setStatus("denied");
        }
      } catch (e) {
        if (!alive) return;

        const httpStatus = e?.response?.status;

        if (httpStatus === 401 || httpStatus === 403) {
          clearAuth?.();
        }

        setStatus("denied");
      }
    }

    setStatus("loading");
    check();

    return () => {
      alive = false;
    };
  }, [rolesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-white/70">Validando acceso…</p>
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}