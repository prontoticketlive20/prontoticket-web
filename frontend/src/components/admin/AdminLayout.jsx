import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  Users,
  LogOut,
  Settings,
  PlusSquare,
  DollarSign,
  FileBarChart2,
} from "lucide-react";

import { setAuthToken } from "../../api/api";

export default function AdminLayout({ children, user }) {
  const navigate = useNavigate();

  const isAdminOrProducer =
    user?.role === "ADMIN" || user?.role === "PRODUCER";

  const menu = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/events", label: "Eventos", icon: CalendarDays },
    { to: "/admin/events/new", label: "Crear evento", icon: PlusSquare },
    ...(isAdminOrProducer
      ? [
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
    { to: "/admin/tickets", label: "Tickets", icon: Ticket },
    { to: "/admin/users", label: "Usuarios", icon: Users },
    { to: "/admin/settings", label: "Configuración", icon: Settings },
  ];

  const logout = () => {
    localStorage.removeItem("ptl_token");
    localStorage.removeItem("ptl_user_name");
    localStorage.removeItem("ptl_user_role");
    setAuthToken?.(null);
    navigate("/", { replace: true });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      {/* Sidebar */}
      <aside className="w-[260px] hidden md:flex flex-col border-r border-white/10 bg-[#0E0E0E]">
        <div className="p-5 border-b border-white/10">
          <div className="text-lg font-bold">
            <span className="text-[#007AFF]">PRONTO</span>
            <span className="text-[#FF9500]">TICKET</span>
            <span className="text-white/70 ml-2 text-sm">ADMIN</span>
          </div>
          <div className="mt-2 text-xs text-white/50">
            {user?.email || "admin"}
          </div>
        </div>

        <nav className="p-3 flex-1 space-y-1">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                    isActive
                      ? "bg-[#007AFF]/15 text-white border border-[#007AFF]/25"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                <Icon size={18} />
                <span className="text-sm font-semibold">{item.label}</span>
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
            <span className="text-sm font-semibold">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1">
        {/* Topbar */}
        <div className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/10 bg-[#0E0E0E]">
          <div className="text-white/80 font-semibold">
            Panel de Administración
          </div>
          <div className="text-xs text-white/50">
            {user?.role ? `Rol: ${user.role}` : ""}
          </div>
        </div>

        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}