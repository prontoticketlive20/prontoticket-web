import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Ticket,
  Users,
  DollarSign,
  RefreshCw,
  Search,
  Plus,
  ChevronRight,
  Receipt,
  Percent,
  BadgeDollarSign,
  Filter,
  XCircle,
 } from "lucide-react";

import api, { setAuthToken, getAuthToken } from "../../api/api";
import AdminLayout from "../../components/admin/AdminLayout";
import { FileBarChart2 } from "lucide-react";
import { BarChart3 } from "lucide-react";

// ---------- Helpers ----------
function toISOStartOfDay(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00.000`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function toISOEndOfDay(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [stats, setStats] = useState({
    events: 0,
    ticketsSold: 0,
    users: 0,

    netTickets: 0,
    fees: 0,
    taxes: 0,
    totalCollected: 0,

    ordersPaidCount: 0,
  });

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [checkinStats, setCheckinStats] = useState({
    total: 0,
    used: 0,
    pending: 0,
    percent: 0,
  });

  const [checkinByType, setCheckinByType] = useState([]);
  const [checkinByTypeLoading, setCheckinByTypeLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedFunctionId, setSelectedFunctionId] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    const tokenFromApi =
      typeof getAuthToken === "function" ? getAuthToken() : null;
    const tokenFromLegacy = localStorage.getItem("ptl_token");
    const token = tokenFromApi || tokenFromLegacy;

    if (token && typeof setAuthToken === "function") {
      setAuthToken(token);
    }
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await api.get("/auth/me");
        const data = res.data?.data ?? res.data;
        if (!alive) return;
        setUser(data);
      } catch (e) {}
    })();

    return () => {
      alive = false;
    };
  }, []);

  const fetchEvents = async () => {
    setEventsLoading(true);
    setErrorMsg("");

    try {
      const [eventsRes, meRes] = await Promise.all([
        api.get("/events"),
        api.get("/auth/me"),
      ]);

      const list = eventsRes.data?.data ?? eventsRes.data;
      const me = meRes.data?.data ?? meRes.data;

      const rawList = Array.isArray(list) ? list : [];

      const filteredList =
        me?.role === "PRODUCER"
          ? rawList.filter((e) => e.producerId === me.id || e.producerId === me.userId)
          : rawList;

      const normalized = filteredList.map((e) => ({
        id: e.id,
        title: e.title ?? e.name ?? "Evento",
        category: e.category ?? "OTHER",
        saleType: e.saleType ?? "GENERAL",
        createdAt: e.createdAt ?? null,
        functionsCount: Array.isArray(e.functions)
          ? e.functions.length
          : e.functionsCount ?? 0,
        ticketTypesCount: Array.isArray(e.ticketTypes)
          ? e.ticketTypes.length
          : e.ticketTypesCount ?? 0,
        status: e.status ?? (e.isPublished ? "active" : "draft"),
        producerId: e.producerId ?? null,
        functionsRaw: Array.isArray(e.functions) ? e.functions : [],
      }));

      setEvents(normalized);

      setStats((prev) => ({
        ...prev,
        events: normalized.length,
      }));
    } catch (e) {
      setEvents([]);
      setErrorMsg(
        "No pude cargar eventos desde el backend (endpoint /events). Si aún no lo tienes, es normal."
      );
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchAdminSummary = async (params) => {
    const res = await api.get("/admin/summary", { params });
    return res.data?.data ?? res.data;
  };

  const fetchRecentOrders = async () => {
    setOrdersLoading(true);

    try {
      const params = {};

      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      if (selectedEventId) params.eventId = selectedEventId;
      if (selectedFunctionId) params.functionId = selectedFunctionId;

      params.status = "PAID";
      params.limit = 10;

      const res = await api.get("/admin/orders", { params });

      const raw =
        res.data?.data?.data ??
        res.data?.data ??
        res.data ??
        [];

      const data = Array.isArray(raw) ? raw : [];

      setRecentOrders(data);
    } catch (e) {
      console.error("Error loading recent orders", e);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchCheckinStats = async () => {
    try {
      const params = {};

      if (!selectedEventId) {
        setCheckinStats({
          total: 0,
          used: 0,
          pending: 0,
          percent: 0,
        });
        return;
      }
      if (selectedEventId) params.eventId = selectedEventId;
      if (selectedFunctionId) params.functionId = selectedFunctionId;

      const res = await api.get("/checkin/stats", { params });

      const raw =
        res.data?.data?.data ??
        res.data?.data ??
        res.data ??
        {};

      const total = Number(raw.totalTickets || 0);
      const used = Number(raw.usedTickets || 0);

      const pending = Number(raw.validTickets || Math.max(total - used, 0));

      const percent = total > 0 ? Math.round((used / total) * 100) : 0;

      setCheckinStats({
        total,
        used,
        pending,
        percent,
      });
    } catch (err) {
      console.error("Error loading checkin stats", err);
    }
  };

  const fetchCheckinStatsByType = async (params = {}) => {
    try {
      setCheckinByTypeLoading(true);

      if (!params.eventId) {
        setCheckinByType([]);
        return;
      }

      const res = await api.get("/checkin/stats-by-type", { params });

      console.log("stats-by-type response:", res.data);

      const payload = res.data?.data;
      const list = payload?.data?.items || [];
      const normalized = list.map((item) => {
        const label =
          item.ticketTypeName ||
          item.name ||
          item.ticketType ||
          "Tipo";

        const used = Number(
          item.usedTickets ?? item.used ?? item.checkedIn ?? 0
        );

        const total = Number(
          item.totalTickets ?? item.total ?? item.count ?? used
        );

        const pending = Number(
          item.validTickets ?? item.pending ?? Math.max(total - used, 0)
        );

        return {
          label,
          used,
          total,
          pending,
        };
      });

      setCheckinByType(normalized);
    } catch (err) {
      console.error("ERROR REAL EN fetchCheckinStatsByType:", err);
      console.log("err.response?.status:", err?.response?.status);
      console.log("err.response?.data:", err?.response?.data);
      setCheckinByType([]);
    } finally {
      setCheckinByTypeLoading(false);
    }
  };

  const applySummaryFilters = async () => {
    setSummaryLoading(true);
    setErrorMsg("");

    try {
      const params = {};

      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      if (selectedEventId) params.eventId = selectedEventId;
      if (selectedFunctionId) params.functionId = selectedFunctionId;

      const s = await fetchAdminSummary(params);
      await fetchRecentOrders();

      try {
        await fetchCheckinStats();
      } catch {}

      try {
        await fetchCheckinStatsByType(params);
      } catch (err) {
        console.error("FALLO fetchCheckinStatsByType en applySummaryFilters:", err);
      }

      setStats((prev) => ({
        ...prev,
        events: Number.isFinite(Number(s?.events)) ? Number(s.events) : prev.events,
        ticketsSold: Number.isFinite(Number(s?.ticketsSold))
          ? Number(s.ticketsSold)
          : prev.ticketsSold,
        users: Number.isFinite(Number(s?.users)) ? Number(s.users) : prev.users,

        netTickets: Number.isFinite(Number(s?.netTickets))
          ? Number(s.netTickets)
          : prev.netTickets,
        fees: Number.isFinite(Number(s?.fees)) ? Number(s.fees) : prev.fees,
        taxes: Number.isFinite(Number(s?.taxes)) ? Number(s.taxes) : prev.taxes,
        totalCollected: Number.isFinite(Number(s?.totalCollected))
          ? Number(s.totalCollected)
          : prev.totalCollected,

        ordersPaidCount: Number.isFinite(Number(s?.ordersPaidCount))
          ? Number(s.ordersPaidCount)
          : prev.ordersPaidCount,
      }));
    } catch (e) {
      setErrorMsg(
        "No pude cargar /admin/summary (revisa backend o permisos ADMIN)."
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const resetSummaryFilters = async () => {
    setFromDate("");
    setToDate("");
    setSelectedEventId("");
    setSelectedFunctionId("");
    await applySummaryFilters();
  };

  const refresh = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      await fetchEvents();
      await applySummaryFilters();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchEvents();
      await applySummaryFilters();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;

    const interval = setInterval(() => {
      fetchCheckinStats();
      fetchCheckinStatsByType({
        eventId: selectedEventId,
        functionId: selectedFunctionId,
      });
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId, selectedFunctionId]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return (events || []).find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  const functionOptions = useMemo(() => {
    const fns = selectedEvent?.functionsRaw || [];
    return fns.map((fn) => {
      const d = fn?.date ? new Date(fn.date) : null;
      const dateLabel =
        d && !Number.isNaN(d.getTime())
          ? d.toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Función";
      const venue = fn?.venueName ? ` • ${fn.venueName}` : "";
      return {
        id: fn.id,
        label: `${dateLabel}${venue}`,
      };
    });
  }, [selectedEvent]);

  useEffect(() => {
    setSelectedFunctionId("");
  }, [selectedEventId]);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (events || [])
      .filter((e) => {
        if (!q) return true;
        return (
          (e.title || "").toLowerCase().includes(q) ||
          (e.category || "").toLowerCase().includes(q) ||
          (e.saleType || "").toLowerCase().includes(q)
        );
      })
      .filter((e) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "active") return e.status === "active";
        if (statusFilter === "draft") return e.status === "draft";
        if (statusFilter === "past") return e.status === "past";
        return true;
      });
  }, [events, query, statusFilter]);

  const displayedEvents = useMemo(() => {
    const hasEventFilters = query.trim() !== "" || statusFilter !== "all";

    if (hasEventFilters) {
      return filteredEvents;
    }

    const now = Date.now();

    const withNextFunction = filteredEvents.map((e) => {
      const upcomingDates = (e.functionsRaw || [])
        .map((fn) => {
          const time = fn?.date ? new Date(fn.date).getTime() : NaN;
          return Number.isNaN(time) ? null : time;
        })
        .filter((v) => v !== null)
        .filter((time) => time >= now);

      const nextFunctionAt =
        upcomingDates.length > 0 ? Math.min(...upcomingDates) : null;

      return {
        ...e,
        nextFunctionAt,
      };
    });

    const upcoming = withNextFunction
      .filter((e) => e.nextFunctionAt !== null)
      .sort((a, b) => a.nextFunctionAt - b.nextFunctionAt)
      .slice(0, 5);

    if (upcoming.length > 0) {
      return upcoming;
    }

    return [...filteredEvents]
      .sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, 5);
  }, [filteredEvents, query, statusFilter]);

  const money = (n) => {
    const v = Number(n);
    const safe = Number.isFinite(v) ? v : 0;
    return `$${safe.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  const opsCards = [
    { label: "Eventos", value: stats.events, icon: CalendarDays },
    { label: "Tickets vendidos", value: stats.ticketsSold, icon: Ticket },
    { label: "Órdenes PAID", value: stats.ordersPaidCount || 0, icon: Receipt },
    { label: "Usuarios", value: stats.users, icon: Users },
    { label: "Total cobrado", value: money(stats.totalCollected), icon: DollarSign },
  ];

  const financeCards = [
    {
      label: "Net (boletos)",
      value: money(stats.netTickets),
      icon: BadgeDollarSign,
      hint: "Sin fees / taxes",
    },
    {
      label: "Fees",
      value: money(stats.fees),
      icon: Receipt,
      hint: "Service fee / platform fee",
    },
    { label: "Taxes", value: money(stats.taxes), icon: Percent, hint: "Impuestos" },
  ];

  const handleCreateEvent = () => {
    navigate("/admin/events/new");
  };

  const handleEditEvent = (eventId) => {
    navigate(`/admin/events/${eventId}/edit`);
  };

  const handleManageFunctions = (eventId) => {
    setSelectedEventId(eventId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleManageTicketTypes = (eventId) => {
    navigate(`/admin/events/${eventId}/ticket-types`);
  };

  const showingDefaultTopEvents = query.trim() === "" && statusFilter === "all";

  return (
    <AdminLayout user={user}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
          <p className="text-white/50 text-sm">
            Control total: eventos, ventas, usuarios y check-in.
          </p>
        </div>

        <div className="flex items-center gap-2">
  <button
    onClick={refresh}
    disabled={loading}
    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 disabled:opacity-60"
    type="button"
  >
    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
    <span className="text-sm font-semibold">Actualizar</span>
  </button>

  <button
    onClick={handleCreateEvent}
    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-semibold shadow-lg shadow-[#007AFF]/20 hover:brightness-110 active:scale-[0.99]"
    type="button"
  >
    <Plus size={16} />
    <span className="text-sm">Crear evento</span>
  </button>

  <button
    onClick={() => navigate("/admin/manual-sales")}
    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#FF9500] to-[#ff7700] text-white font-semibold shadow-lg shadow-[#FF9500]/20 hover:brightness-110 active:scale-[0.99]"
    type="button"
  >
    <DollarSign size={16} />
    <span className="text-sm">Venta Manual</span>
  </button>

<button
  onClick={() => navigate("/analytics")}
  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] text-white font-semibold shadow-lg shadow-[#7c3aed]/20 hover:brightness-110 active:scale-[0.99]"
  type="button"
>
  <BarChart3 size={16} />
  <span className="text-sm">Analytics</span>
</button>

<button
  onClick={() => navigate("/admin/reports/event-close")}
  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#34C759] to-[#1faa4a] text-white font-semibold shadow-lg shadow-[#34C759]/20 hover:brightness-110 active:scale-[0.99]"
  type="button"
>
  <FileBarChart2 size={16} />
  <span className="text-sm">Reporte cierre</span>
</button>

<button
  onClick={() => navigate("/admin/orders")}
  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#6b7280] to-[#4b5563] text-white font-semibold shadow-lg shadow-black/20 hover:brightness-110 active:scale-[0.99]"
  type="button"
>
  <Receipt size={16} />
  <span className="text-sm">Órdenes</span>
</button>

<button
  onClick={() => navigate("/checkin")}
  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-semibold shadow-lg shadow-[#007AFF]/20 hover:brightness-110 active:scale-[0.99]"
  type="button"
>
  <span className="text-sm">Scanner</span>
</button>

</div>
      </div>

      <div className="mb-5 rounded-2xl border border-white/10 bg-[#121212] p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
              <Filter size={18} className="text-white/70" />
            </div>
            <div>
              <div className="text-white font-semibold">Filtros (Auditoría)</div>
              <div className="text-white/45 text-xs">
                Rango por fecha de Order.createdAt • Opcional: evento y función
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={applySummaryFilters}
              disabled={summaryLoading}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 disabled:opacity-60"
              type="button"
            >
              {summaryLoading ? "Aplicando…" : "Aplicar"}
            </button>

            <button
              onClick={resetSummaryFilters}
              disabled={summaryLoading}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 disabled:opacity-60 flex items-center gap-2"
              type="button"
              title="Reset filtros"
            >
              <XCircle size={16} />
              Reset
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-white/60">Desde</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-white/20"
            />
          </div>

          <div>
            <label className="text-xs text-white/60">Hasta</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-white/20"
            />
          </div>

          <div>
            <label className="text-xs text-white/60">Evento (opcional)</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-white/20"
            >
              <option value="">Todos los eventos</option>
              {(events || []).map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/60">Función (opcional)</label>
            <select
              value={selectedFunctionId}
              onChange={(e) => setSelectedFunctionId(e.target.value)}
              disabled={!selectedEventId || functionOptions.length === 0}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-white/20 disabled:opacity-60"
            >
              <option value="">
                {!selectedEventId
                  ? "Selecciona un evento primero"
                  : functionOptions.length === 0
                    ? "Este evento no tiene funciones"
                    : "Todas las funciones"}
              </option>
              {functionOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {errorMsg ? (
        <div className="mb-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3">
          <p className="text-yellow-200 text-sm">{errorMsg}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {opsCards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-2xl border border-white/10 bg-[#121212] p-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-white/60 text-sm font-semibold">{c.label}</div>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Icon size={18} className="text-white/70" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-bold text-white">{c.value}</div>
              <div className="mt-1 text-xs text-white/40">
                (Filtrable por fecha / evento / función)
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {financeCards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-2xl border border-white/10 bg-[#121212] p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white/60 text-sm font-semibold">{c.label}</div>
                  {c.hint ? (
                    <div className="text-white/35 text-xs mt-0.5">{c.hint}</div>
                  ) : null}
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Icon size={18} className="text-white/70" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-bold text-white">{c.value}</div>
              <div className="mt-1 text-xs text-white/40">
                (Filtrable por fecha / evento / función)
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-[#121212] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-white font-semibold text-lg">Eventos</div>
            <div className="text-white/50 text-sm">
              {showingDefaultTopEvents
                ? "Mostrando los 5 eventos más próximos. Usa los filtros para ver más."
                : "Busca, filtra y administra eventos."}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título, categoría…"
                className="w-full md:w-[320px] pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-white/20"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-white/20"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="draft">Borradores</option>
              <option value="past">Pasados</option>
            </select>
          </div>
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          {eventsLoading ? (
            <div className="flex items-center gap-2 text-white/60">
              <RefreshCw size={16} className="animate-spin" />
              <span className="text-sm">Cargando eventos…</span>
            </div>
          ) : displayedEvents.length === 0 ? (
            <div className="text-white/50 text-sm">
              No hay eventos para mostrar (o el backend aún no devuelve /events).
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-white/50 text-xs">
                    <th className="py-2 pr-3 font-semibold">Evento</th>
                    <th className="py-2 pr-3 font-semibold">Categoría</th>
                    <th className="py-2 pr-3 font-semibold">Venta</th>
                    <th className="py-2 pr-3 font-semibold">Funciones</th>
                    <th className="py-2 pr-3 font-semibold">Tipos</th>
                    <th className="py-2 pr-3 font-semibold">Estado</th>
                    <th className="py-2 pr-0 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedEvents.map((e) => (
                    <tr key={e.id} className="border-t border-white/10">
                      <td className="py-3 pr-3">
                        <div className="text-white font-semibold">{e.title}</div>
                        <div className="text-white/40 text-xs font-mono truncate max-w-[360px]">
                          {e.id}
                        </div>
                      </td>

                      <td className="py-3 pr-3 text-white/70 text-sm">
                        {e.category}
                      </td>

                      <td className="py-3 pr-3 text-white/70 text-sm">
                        {e.saleType}
                      </td>

                      <td className="py-3 pr-3 text-white/70 text-sm">
                        {e.functionsCount ?? 0}
                      </td>

                      <td className="py-3 pr-3 text-white/70 text-sm">
                        {e.ticketTypesCount ?? 0}
                      </td>

                      <td className="py-3 pr-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-white/10 bg-white/5 text-white/70">
                          {e.status}
                        </span>
                      </td>

                      <td className="py-3 pr-0">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditEvent(e.id)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-sm"
                            type="button"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => navigate(`/admin/events/${e.id}/functions`)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-sm"
                            type="button"
                          >
                            Funciones
                          </button>

                          <button
                            onClick={() => handleManageTicketTypes(e.id)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-sm"
                            type="button"
                          >
                            Ticket Types
                          </button>

                          <button
                            onClick={() => alert("Próximo paso: vista detalle del evento")}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80"
                            type="button"
                            title="Ver detalle"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-3 text-xs text-white/40">
                {showingDefaultTopEvents
                  ? "Vista resumida inicial: 5 eventos más próximos."
                  : "Resultado filtrado completo según búsqueda/estado."}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121212] p-4">
        <div className="text-white font-semibold mb-3">
          Ventas recientes
          <span className="ml-2 text-white/40 text-sm font-normal">
            (últimas 10)
          </span>
        </div>

        {ordersLoading ? (
          <div className="text-white/60 text-sm">Cargando órdenes…</div>
        ) : recentOrders.length === 0 ? (
          <div className="text-white/50 text-sm">
            No hay órdenes en este rango.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-white/50 text-xs">
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Orden</th>
                  <th className="py-2 pr-3">Comprador</th>
                  <th className="py-2 pr-3">Evento</th>
                  <th className="py-2 pr-3">Tickets</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((o) => {
                  const d = new Date(o.createdAt);

                  return (
                    <tr key={o.id} className="border-t border-white/10">
                      <td className="py-3 pr-3 text-white/70 text-sm">
                        {d.toLocaleString()}
                      </td>

                      <td className="py-3 pr-3 text-white font-mono text-xs">
                        <Link
                          to={`/admin/orders/${o.id}`}
                          className="text-[#007AFF] hover:underline"
                        >
                          {o.id.slice(0, 8)}
                        </Link>
                      </td>

                      <td className="py-3 pr-3 text-white/70 text-sm">
                        {o.buyer?.name || o.buyer?.email || "Guest"}
                      </td>

                      <td className="py-3 pr-3 text-white/70 text-sm">
                        {o.event?.title || "-"}
                      </td>

                      <td className="py-3 pr-3 text-white/70 text-sm">
                        {o.ticketsCount}
                      </td>

                      <td className="py-3 pr-3 text-white font-semibold">
                        ${Number(o.total).toLocaleString()}
                      </td>

                      <td className="py-3 pr-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 border border-green-500/30 text-green-300">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121212] p-4">
        <div className="text-white font-semibold mb-4">
          Check-in / Accesos
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-black/30 border border-white/10 rounded-xl p-4">
            <div className="text-white/50 text-sm">Tickets totales</div>
            <div className="text-white text-2xl font-bold mt-1">
              {checkinStats.total}
            </div>
          </div>

          <div className="bg-black/30 border border-white/10 rounded-xl p-4">
            <div className="text-white/50 text-sm">Tickets usados</div>
            <div className="text-green-400 text-2xl font-bold mt-1">
              {checkinStats.used}
            </div>
          </div>

          <div className="bg-black/30 border border-white/10 rounded-xl p-4">
            <div className="text-white/50 text-sm">Pendientes</div>
            <div className="text-yellow-400 text-2xl font-bold mt-1">
              {checkinStats.pending}
            </div>
          </div>

          <div className="bg-black/30 border border-white/10 rounded-xl p-4">
            <div className="text-white/50 text-sm">Asistencia</div>
            <div className="text-[#007AFF] text-2xl font-bold mt-1">
              {checkinStats.percent}%
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-[#121212] p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-white font-semibold">
              Asistencia por tipo de entrada
            </div>
            <div className="text-white/50 text-sm mt-1">
              Distribución de tickets usados por categoría.
            </div>
          </div>
        </div>

        {checkinByTypeLoading ? (
          <div className="text-white/60 text-sm">Cargando gráfico…</div>
        ) : checkinByType.length === 0 ? (
          <div className="text-white/50 text-sm">
            No hay datos por tipo de entrada para este filtro.
          </div>
        ) : (
          <div className="space-y-4">
            {checkinByType.map((item, idx) => {
              const maxUsed = Math.max(...checkinByType.map((x) => x.used), 1);
              const widthPercent = Math.max(
                8,
                Math.round((item.used / maxUsed) * 100)
              );

              const percentOfTotal =
                item.total > 0 ? Math.round((item.used / item.total) * 100) : 0;

              return (
                <div key={`${item.label}-${idx}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-white/80 text-sm font-medium">
                      {item.label}
                    </div>
                    <div className="text-white/50 text-xs">
                      Usados: {item.used} · Total: {item.total} · {percentOfTotal}%
                    </div>
                  </div>

                  <div className="w-full h-3 rounded-full bg-black/40 border border-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#007AFF] to-[#00C2FF]"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}