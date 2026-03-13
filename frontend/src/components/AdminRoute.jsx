import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api, { clearAuth } from "../api/api";

/**
 * AdminRoute (flexible)
 *
 * - Si NO pasas allowedRoles => deja pasar a cualquier usuario AUTENTICADO.
 * - Si pasas allowedRoles (ej: ['ADMIN']) => sólo esos roles entran.
 *
 * Uso recomendado:
 * 1) Dashboard general (todos):
 *   <AdminRoute>
 *     <Dashboard />
 *   </AdminRoute>
 *
 * 2) Admin-only:
 *   <AdminRoute allowedRoles={['ADMIN']}>
 *     <AdminDashboard />
 *   </AdminRoute>
 */
export default function AdminRoute({ children, allowedRoles }) {
  const location = useLocation();
  const [status, setStatus] = useState("loading"); // loading | allowed | denied

  // ✅ clave estable para evitar re-check innecesario por referencia de array
  const rolesKey = useMemo(() => {
    if (!allowedRoles || allowedRoles.length === 0) return "";
    return allowedRoles.slice().sort().join("|");
  }, [allowedRoles]);

  useEffect(() => {
    let alive = true;

    async function check() {
      try {
        const token =
          localStorage.getItem("ptl_token") ||
          localStorage.getItem("token") ||
          localStorage.getItem("access_token");

        if (!token) {
          if (alive) setStatus("denied");
          return;
        }

        // api.js agrega Bearer automáticamente
        const res = await api.get("/auth/me");
        const me = res.data?.data ?? res.data;

        const role = me?.role || null;
        const label = me?.name || me?.email || "Guest";

        // Cache rápido para Header
        localStorage.setItem("ptl_user_name", label);
        if (role) localStorage.setItem("ptl_user_role", role);

        if (!alive) return;

        // ✅ Si NO especificas allowedRoles => cualquier logueado entra
        if (!allowedRoles || allowedRoles.length === 0) {
          setStatus("allowed");
          return;
        }

        // ✅ Si especificas allowedRoles => validar por rol
        if (role && allowedRoles.includes(role)) setStatus("allowed");
        else setStatus("denied");
      } catch (e) {
        if (!alive) return;

        const httpStatus = e?.response?.status;

        // ✅ si token inválido/expirado => limpiar storage y negar
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
    // usamos rolesKey para evitar loops por arrays nuevos
  }, [rolesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-white/70">Validando acceso…</p>
      </div>
    );
  }

  if (status === "denied") {
    // guardamos "from" como location completo (Login lo lee como from.pathname)
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}