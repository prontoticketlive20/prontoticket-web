import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Filter,
  ChevronRight,
  Receipt,
  CalendarDays,
  User2,
  Ticket,
} from "lucide-react";

import api from "../../api/api";
import AdminLayout from "../../components/admin/AdminLayout";

function money(n) {
  const v = Number(n);
  const safe = Number.isFinite(v) ? v : 0;
  return `$${safe.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function OrdersPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [functions, setFunctions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    lastPage: 1,
  });

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedFunctionId, setSelectedFunctionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    let alive = true;

    const loadInitial = async () => {
      try {
        const [meRes, eventsRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/events"),
        ]);

        const me = meRes.data?.data ?? meRes.data;
        const list = eventsRes.data?.data ?? eventsRes.data ?? [];
        const rawList = Array.isArray(list) ? list : [];

        const filteredEvents =
          me?.role === "PRODUCER"
            ? rawList.filter((e) => e.producerId === me.id || e.producerId === me.userId)
            : rawList;

        if (!alive) return;

        setUser(me);
        setEvents(filteredEvents);
      } catch (error) {
        console.error("[OrdersPage] Error loading initial data:", error);
        if (!alive) return;
        setErrorMsg("No pude cargar la información inicial.");
      }
    };

    loadInitial();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const event = events.find((e) => e.id === selectedEventId);
    setFunctions(Array.isArray(event?.functions) ? event.functions : []);
    setSelectedFunctionId("");
  }, [selectedEventId, events]);

  const fetchOrders = async (pageToLoad = 1) => {
    setLoading(true);
    setErrorMsg("");

    try {
      const params = {
        page: pageToLoad,
        limit: meta.limit || 20,
      };

      if (query.trim()) params.q = query.trim();
      if (status) params.status = status;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (selectedEventId) params.eventId = selectedEventId;
      if (selectedFunctionId) params.functionId = selectedFunctionId;
      if (paymentMethod) params.paymentMethod = paymentMethod;

      const res = await api.get("/admin/orders", { params });

      const envelope = res.data?.data ?? res.data ?? {};

      const rows =
       envelope?.data?.data ??
       envelope?.data ??
     [];

     const nextMeta =
      envelope?.data?.meta ??
      envelope?.meta ?? {
      total: 0,
      page: pageToLoad,
      limit: meta.limit || 20,
      lastPage: 1,
    };

      setOrders(Array.isArray(rows) ? rows : []);
      setMeta(nextMeta);
    } catch (error) {
      console.error("[OrdersPage] Error loading orders:", error);
      setOrders([]);
      setErrorMsg("No pude cargar las órdenes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canGoPrev = meta.page > 1;
  const canGoNext = meta.page < meta.lastPage;

  const resultsLabel = useMemo(() => {
    if (!meta.total) return "Sin resultados";
    return `${meta.total} orden(es) encontradas`;
  }, [meta.total]);

  return (
    <AdminLayout user={user}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Órdenes / Transacciones</h1>
          <p className="text-white/50 text-sm mt-1">
            Búsqueda operativa por orden, nombre, email, fecha, evento y función.
          </p>
        </div>

        <button
          onClick={() => fetchOrders(meta.page || 1)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 disabled:opacity-60"
          type="button"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span className="text-sm font-semibold">Actualizar</span>
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#121212] p-5 mb-6">
        <div className="flex items-center gap-2 text-white font-semibold mb-4">
          <Filter size={18} className="text-[#007AFF]" />
          Filtros de búsqueda
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-2">
            <label className="text-xs text-white/60">Buscar</label>
            <div className="mt-1 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Order ID, nombre, email o teléfono"
                className="w-full pl-9 pr-3 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-white/20"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/60">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full px-3 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-white/20"
            >
              <option value="">Todos</option>
              <option value="PAID">PAID</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="PENDING">PENDING</option>
            </select>
          </div>

         <div>
              <label className="text-xs text-white/60">Forma de Pago</label>
                <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 w-full px-3 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none       focus:border-white/20"
              >
             <option value="">All</option>
             <option value="STRIPE">Stripe</option>
             <option value="CASH">Cash</option>
             <option value="CARD">Card</option>
             <option value="COURTESY">Courtesy</option>
             </select>
         </div>

          <div>
            <label className="text-xs text-white/60">Evento</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="mt-1 w-full px-3 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-white/20"
            >
              <option value="">Todos los eventos</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/60">Función</label>
            <select
              value={selectedFunctionId}
              onChange={(e) => setSelectedFunctionId(e.target.value)}
              disabled={!selectedEventId}
              className="mt-1 w-full px-3 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-white/20 disabled:opacity-60"
            >
              <option value="">
                {!selectedEventId ? "Selecciona un evento primero" : "Todas las funciones"}
              </option>
              {functions.map((fn) => (
                <option key={fn.id} value={fn.id}>
                  {new Date(fn.date).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/60">Desde</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 w-full px-3 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-white/20"
            />
          </div>

          <div>
            <label className="text-xs text-white/60">Hasta</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 w-full px-3 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-white/20"
            />
          </div>

          <div>
            <label className="text-xs text-white/60">Resultados por página</label>
            <select
              value={meta.limit}
              onChange={(e) =>
                setMeta((prev) => ({
                  ...prev,
                  limit: Number(e.target.value),
                }))
              }
              className="mt-1 w-full px-3 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-white/20"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => fetchOrders(1)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-semibold hover:brightness-110 disabled:opacity-60"
              type="button"
            >
              Buscar órdenes
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#121212] p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <div className="text-white font-semibold text-lg">Resultados</div>
            <div className="text-white/45 text-sm mt-1">{resultsLabel}</div>
          </div>

          <div className="text-white/40 text-sm">
            Página {meta.page} de {meta.lastPage}
          </div>
        </div>

        {errorMsg ? (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
            {errorMsg}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 text-white/60">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-sm">Cargando órdenes...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-white/50 text-sm">No hay órdenes para mostrar.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-white/50 text-xs">
                    <th className="py-2 pr-3 font-semibold">Fecha</th>
                    <th className="py-2 pr-3 font-semibold">Orden</th>
                    <th className="py-2 pr-3 font-semibold">Comprador</th>
                    <th className="py-2 pr-3 font-semibold">Evento</th>
                    <th className="py-2 pr-3 font-semibold">Tickets</th>
                    <th className="py-2 pr-3 font-semibold">Total</th>
                    <th className="py-2 pr-3 font-semibold">Status</th>
                    <th className="py-2 pr-0 font-semibold text-right">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((o) => {
                    const d = new Date(o.createdAt);

                    return (
                      <tr key={o.id} className="border-t border-white/10">
                        <td className="py-3 pr-3 text-white/70 text-sm">
                          {d.toLocaleString()}
                        </td>

                        <td className="py-3 pr-3">
                          <div className="text-white font-mono text-xs break-all">
                            {o.id}
                          </div>
                        </td>

                        <td className="py-3 pr-3">
                          <div className="text-white/80 text-sm font-medium">
                            {o.buyer?.name || "Guest"}
                          </div>
                          <div className="text-white/45 text-xs">
                            {o.buyer?.email || "-"}
                          </div>
                        </td>

                        <td className="py-3 pr-3 text-white/70 text-sm">
                          {o.event?.title || "-"}
                        </td>

                        <td className="py-3 pr-3 text-white/70 text-sm">
                          {o.ticketsCount}
                        </td>

                        <td className="py-3 pr-3 text-white font-semibold text-sm">
                          {money(o.total)}
                        </td>

                        <td className="py-3 pr-3">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs border border-white/10 bg-white/5 text-white/70">
                            {o.status}
                          </span>
                        </td>

                        <td className="py-3 pr-0 text-right">
                          <button
                            onClick={() => navigate(`/admin/orders/${o.id}`)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-sm"
                            type="button"
                          >
                            <span>Ver detalle</span>
                            <ChevronRight size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white/45 text-sm">
                <Receipt size={15} />
                <span>{meta.total} registros totales</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchOrders(meta.page - 1)}
                  disabled={!canGoPrev || loading}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 disabled:opacity-40"
                  type="button"
                >
                  Anterior
                </button>

                <button
                  onClick={() => fetchOrders(meta.page + 1)}
                  disabled={!canGoNext || loading}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 disabled:opacity-40"
                  type="button"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}