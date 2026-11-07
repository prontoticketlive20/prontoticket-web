
import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  LogOut,
  Settings,
  PlusSquare,
  DollarSign,
  FileBarChart2,
  Receipt,
  Landmark,
  ScanLine,
  Gift,
  Menu,
  X,
} from "lucide-react";

import api, { setAuthToken } from "../../api/api";

export default function AdminLayout({ children, user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  useEffect(() => {
    if (user) return;

    let active = true;

    const loadUser = async () => {
      try {
        const response = await api.get("/auth/me");
        const data = response.data?.data ?? response.data;

        if (active) {
          setAuthenticatedUser(data);
        }
      } catch (error) {
        console.error("No se pudo obtener el usuario administrativo");
      }
    };

    loadUser();

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const currentUser = user || authenticatedUser;

  const isAdminOrProducer =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "PRODUCER";

  const isAdmin = currentUser?.role === "ADMIN";

  const menu = [
    {
      to: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: "/admin/events",
      label: "Eventos",
      icon: CalendarDays,
    },
    {
      to: "/admin/events/new",
      label: "Crear evento",
      icon: PlusSquare,
    },
    ...(isAdminOrProducer
      ? [
          {
            to: "/checkin",
            label: "Scanner / Check-In",
            icon: ScanLine,
          },
          {
            to: "/analytics",
            label: "Analytics",
            icon: FileBarChart2,
          },
          {
            to: "/admin/orders",
            label: "Órdenes",
            icon: Receipt,
          },
          {
            to: "/admin/manual-sales",
            label: "Venta manual",
            icon: DollarSign,
          },
          {
            to: "/admin/reports/event-close",
            label: "Reporte cierre",
            icon: FileBarChart2,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            to: "/admin/reports/financial",
            label: "Reporte financiero",
            icon: Landmark,
          },
          ...(isAdmin
            ? [
               {
                 to: "/admin/beneficios",
                 label: "Beneficios",
                 icon: Gift,
               },
              ]
           : []),
        ]
      : []),
    {
      to: "/admin/users",
      label: "Usuarios",
      icon: Users,
    },
    {
      to: "/admin/settings",
      label: "Configuración",
      icon: Settings,
    },
  ];

  const logout = () => {
    localStorage.removeItem("ptl_token");
    localStorage.removeItem("ptl_user_name");
    localStorage.removeItem("ptl_user_role");

    setAuthToken?.(null);
    navigate("/", { replace: true });
    window.location.reload();
  };

  const renderMenu = () => (
    <>
      <div className="p-5 border-b border-white/10">
        <div className="text-lg font-bold">
          <span className="text-[#007AFF]">PRONTO</span>
          <span className="text-[#FF9500]">TICKET</span>
          <span className="text-white/70 ml-2 text-sm">
            ADMIN
          </span>
        </div>

        <div className="mt-2 text-xs text-white/50">
          {currentUser?.email || "admin"}
        </div>
      </div>

      <nav className="p-3 flex-1 space-y-1 overflow-y-auto">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                  isActive
                    ? "bg-[#007AFF]/15 text-white border border-[#007AFF]/25"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <Icon size={18} />
              <span className="text-sm font-semibold">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 hover:bg-red-500/15"
          type="button"
        >
          <LogOut size={18} />
          <span className="text-sm font-semibold">
            Cerrar sesión
          </span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      <aside className="w-[260px] hidden md:flex flex-col border-r border-white/10 bg-[#0E0E0E]">
        {renderMenu()}
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileMenuOpen(false)}
          />

          <aside className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] flex flex-col bg-[#0E0E0E] border-r border-white/10 shadow-2xl">
            <div className="flex justify-end px-3 pt-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Cerrar menú"
                className="p-2 rounded-lg hover:bg-white/10"
              >
                <X size={22} />
              </button>
            </div>

            {renderMenu()}
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0">
        <div className="h-16 flex items-center justify-between gap-3 px-4 md:px-6 border-b border-white/10 bg-[#0E0E0E]">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Abrir menú"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10"
            >
              <Menu size={22} />
            </button>

            <div className="text-white/80 font-semibold truncate">
              Panel de Administración
            </div>
          </div>

          <div className="text-xs text-white/50 shrink-0">
            {currentUser?.role
              ? `Rol: ${currentUser.role}`
              : ""}
          </div>
        </div>

        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
