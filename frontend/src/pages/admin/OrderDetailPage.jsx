import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  Phone,
  Ticket,
  User,
  MapPin,
  QrCode,
  CheckCircle2,
  XCircle,
  X,
  RotateCcw,
  Ban,
  RefreshCw,
} from "lucide-react";

import api from "../../api/api";
import AdminLayout from "../../components/admin/AdminLayout";
import icono2026 from "../../assets/icono_2026.png";

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [order, setOrder] = useState(null);
  const [refundableData, setRefundableData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);

  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
  const [refundMode, setRefundMode] = useState("INTERNAL");
  const [refundReason, setRefundReason] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundMsg, setRefundMsg] = useState("");
  const [refundError, setRefundError] = useState("");

  const [resendOpen, setResendOpen] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendError, setResendError] = useState("");

  const [revertLoadingId, setRevertLoadingId] = useState(null);
  const [revertMsg, setRevertMsg] = useState("");
  const [revertError, setRevertError] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ticketToRevert, setTicketToRevert] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const meRes = await api.get("/auth/me");
        const me = meRes.data?.data ?? meRes.data;
        if (alive) setUser(me);
      } catch {}
    })();

    return () => {
      alive = false;
    };
  }, []);

  const loadOrder = async () => {
    const res = await api.get(`/orders/${id}`);
    const payload =
      res.data?.data?.data ??
      res.data?.data ??
      res.data ??
      null;

    setOrder(payload);
  };

  const loadRefundableTickets = async () => {
    try {
      const res = await api.get(`/orders/${id}/refundable-tickets`);
      const payload =
        res.data?.data?.data ??
        res.data?.data ??
        res.data ??
        null;

      setRefundableData(payload);
    } catch {
      setRefundableData(null);
    }
  };

  useEffect(() => {
    let alive = true;

    const init = async () => {
      setLoading(true);
      setErrorMsg("");
      setRefundMsg("");
      setRefundError("");
      setResendMsg("");
      setResendError("");

      try {
        const [orderRes, refundableRes] = await Promise.allSettled([
          api.get(`/orders/${id}`),
          api.get(`/orders/${id}/refundable-tickets`),
        ]);

        if (!alive) return;

        if (orderRes.status === "fulfilled") {
          const payload =
            orderRes.value.data?.data?.data ??
            orderRes.value.data?.data ??
            orderRes.value.data ??
            null;
          setOrder(payload);
        } else {
          throw new Error("No pude cargar la orden");
        }

        if (refundableRes.status === "fulfilled") {
          const payload =
            refundableRes.value.data?.data?.data ??
            refundableRes.value.data?.data ??
            refundableRes.value.data ??
            null;
          setRefundableData(payload);
        } else {
          setRefundableData(null);
        }
      } catch {
        if (!alive) return;
        setErrorMsg("No pude cargar el detalle de la orden.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    if (id) init();

    return () => {
      alive = false;
    };
  }, [id]);

  const money = (n) => {
    const v = Number(n);
    const safe = Number.isFinite(v) ? v : 0;
    return `$${safe.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const refundableById = useMemo(() => {
    const map = new Map();
    const tickets = refundableData?.tickets || [];
    for (const t of tickets) {
      map.set(t.id, t);
    }
    return map;
  }, [refundableData]);

  const firstTicket = order?.tickets?.[0];
  const firstFunction = firstTicket?.function;
  const firstEvent = firstFunction?.event;

  const activeTicketsCount =
    order?.tickets?.filter((t) => t.status === "ACTIVE").length || 0;

  const refundableTickets =
    order?.tickets?.filter((t) => refundableById.get(t.id)?.refundable) || [];

  const selectedTickets = useMemo(() => {
  return (order?.tickets || []).filter((t) =>
    selectedTicketIds.includes(t.id)
  );
}, [order?.tickets, selectedTicketIds]);

const canRevertCheckin =
  user?.role === "ADMIN" || user?.role === "PRODUCER";

const handleRevertCheckin = (ticket) => {
  if (!ticket?.id) return;

  setTicketToRevert(ticket);
  setConfirmOpen(true);
};

const confirmRevert = async () => {
  if (!ticketToRevert?.id) return;

  setConfirmOpen(false);
  setRevertMsg("");
  setRevertError("");
  setRevertLoadingId(ticketToRevert.id);

  try {
    await api.post("/checkin/revert", {
      ticketId: ticketToRevert.id,
    });

    await Promise.all([loadOrder(), loadRefundableTickets()]);
    setRevertMsg("Check-in revertido correctamente.");
  } catch (e) {
    const msg =
      e?.response?.data?.message ||
      e?.message ||
      "No pude revertir el check-in.";

    setRevertError(Array.isArray(msg) ? msg.join(", ") : msg);
  } finally {
    setRevertLoadingId(null);
    setTicketToRevert(null);
  }
};

  const selectedSummary = useMemo(() => {
    return selectedTickets.reduce(
      (acc, t) => {
        acc.subtotal += Number(t.unitPrice || 0);
        acc.serviceFee += Number(t.serviceFeeAmount || 0);
        acc.salesTax += Number(t.salesTaxAmount || 0);
        acc.total += Number(t.totalAmount || 0);
        return acc;
      },
      { subtotal: 0, serviceFee: 0, salesTax: 0, total: 0 }
    );
  }, [selectedTickets]);

  const toggleTicket = (ticketId) => {
    const info = refundableById.get(ticketId);
    if (!info?.refundable) return;

    setSelectedTicketIds((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const toggleSelectAllRefundable = () => {
    const ids = refundableTickets.map((t) => t.id);

    const allSelected =
      ids.length > 0 && ids.every((ticketId) => selectedTicketIds.includes(ticketId));

    if (allSelected) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(ids);
    }
  };

  const handleProcessRefund = async () => {
    if (selectedTicketIds.length === 0) {
      setRefundError("Selecciona al menos un ticket.");
      return;
    }

    setRefundLoading(true);
    setRefundMsg("");
    setRefundError("");

    try {
      await api.post(`/orders/${id}/refunds`, {
        ticketIds: selectedTicketIds,
        mode: refundMode,
        reason: refundReason || null,
        notes: refundNotes || null,
        processedByUserId: user?.id || null,
      });

      await Promise.all([loadOrder(), loadRefundableTickets()]);

      setSelectedTicketIds([]);
      setRefundReason("");
      setRefundNotes("");
      setRefundMsg(
        refundMode === "STRIPE"
          ? "Refund procesado correctamente en Stripe."
          : "Cancelación interna procesada correctamente."
      );
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "No pude procesar la operación.";
      setRefundError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setRefundLoading(false);
    }
  };

  const handleResendTickets = async () => {
    if (!resendEmail) {
      setResendError("Debes ingresar un email.");
      return;
    }

    setResendLoading(true);
    setResendMsg("");
    setResendError("");

    try {
      await api.post(`/orders/${id}/resend`, {
        email: resendEmail,
      });

      setResendMsg("Tickets reenviados correctamente.");
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "No pude reenviar los tickets.";

      setResendError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setResendLoading(false);
    }
  };

  const ticketStatusBadge = (ticket) => {
    if (ticket.status === "REFUNDED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-500/10 border border-blue-500/30 text-blue-300">
          <RotateCcw size={12} />
          Refund
        </span>
      );
    }

    if (ticket.status === "CANCELLED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-500/10 border border-orange-500/30 text-orange-300">
          <Ban size={12} />
          Cancelado
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/10 border border-green-500/30 text-green-300">
        <CheckCircle2 size={12} />
        Activo
      </span>
    );
  };

  return (
    <AdminLayout user={user}>
  {revertMsg ? (
    <div className="mb-4 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-green-200">
      {revertMsg}
    </div>
  ) : null}

  {revertError ? (
    <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
      {revertError}
    </div>
  ) : null}

  <div className="flex items-center justify-between gap-3 mb-5">
    <div>
      <button
        onClick={() => navigate("/admin")}
        className="mb-2 inline-flex items-center gap-2 text-sm text-[#007AFF] hover:underline"
        type="button"
      >
        <ArrowLeft size={16} />
        Volver al Dashboard
      </button>

      <h1 className="text-2xl font-bold text-white">Detalle de Orden</h1>
      <p className="text-white/50 text-sm">
        Información completa de la transacción, tickets y refunds.
      </p>
    </div>
  </div>

  {loading ? (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-6 text-white/70">
      Cargando orden…
    </div>
  ) : errorMsg ? (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
      {errorMsg}
    </div>
  ) : !order ? (
    <div className="rounded-2xl border border-white/10 bg-[#121212] p-6 text-white/70">
      No se encontró la orden.
    </div>
  ) : (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-[#121212] p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-white/50 text-xs">Order ID</div>
              <div className="text-white font-mono text-sm break-all">
                {order.id}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm">
                {order.status}
              </div>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm">
                Tickets activos: {activeTicketsCount}
              </div>
              <button
                onClick={() => {
                  setResendOpen(true);
                  setResendEmail(order?.buyerEmail || order?.user?.email || "");
                  setResendMsg("");
                  setResendError("");
                }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#007AFF] text-white hover:opacity-90"
                type="button"
              >
                <Mail size={16} />
                Reenviar tickets
              </button>
            </div>
          </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-black/30 border border-white/10 p-4">
                  <div className="flex items-center gap-2 text-white font-semibold mb-3">
                    <User size={16} />
                    Comprador
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="text-white/80">
                      {order.buyerName || order.user?.name || "Guest"}
                    </div>

                    <div className="flex items-center gap-2 text-white/60">
                      <Mail size={14} />
                      <span>{order.buyerEmail || order.user?.email || "-"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-white/60">
                      <Phone size={14} />
                      <span>{order.buyerPhone || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-black/30 border border-white/10 p-4">
                  <div className="flex items-center gap-2 text-white font-semibold mb-3">
                    <CalendarDays size={16} />
                    Evento / Función
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="text-white/80">
                      {firstEvent?.title || "Sin evento"}
                    </div>

                    <div className="text-white/60">
                      {firstFunction?.date
                        ? new Date(firstFunction.date).toLocaleString()
                        : "-"}
                    </div>

                    <div className="flex items-center gap-2 text-white/60">
                      <MapPin size={14} />
                      <span>{firstFunction?.venueName || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
              <div className="text-white font-semibold mb-4">Totales</div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-white/70">
                  <span>Subtotal original</span>
                  <span>{money(order.subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-white/70">
                  <span>Service Fee original</span>
                  <span>{money(order.serviceFee)}</span>
                </div>

                <div className="flex items-center justify-between text-white/70">
                  <span>Sales Tax original</span>
                  <span>{money(order.salesTax)}</span>
                </div>

                <div className="border-t border-white/10 pt-3 flex items-center justify-between text-white font-semibold">
                  <span>Total original</span>
                  <span>{money(order.total)}</span>
                </div>

                <div className="border-t border-white/10 pt-3 flex items-center justify-between text-orange-300">
                  <span>Cancelado interno</span>
                  <span>{money(order.cancelledTotal)}</span>
                </div>

                <div className="flex items-center justify-between text-blue-300">
                  <span>Refund Stripe</span>
                  <span>{money(order.refundedTotal)}</span>
                </div>

                <div className="border-t border-white/10 pt-3 flex items-center justify-between text-green-300 font-semibold">
                  <span>Neto retenido</span>
                  <span>
                    {money(
                      Number(order.total || 0) -
                        Number(order.cancelledTotal || 0) -
                        Number(order.refundedTotal || 0)
                    )}
                  </span>
                </div>

                <div className="pt-2 text-white/50 text-xs">
                  Tickets en la orden: {order.tickets?.length || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#121212] p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Ticket size={16} />
                Tickets incluidos
              </div>

              {refundableTickets.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAllRefundable}
                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white/80 text-sm hover:bg-white/10"
                >
                  {refundableTickets.length > 0 &&
                  refundableTickets.every((t) => selectedTicketIds.includes(t.id))
                    ? "Deseleccionar refundables"
                    : "Seleccionar refundables"}
                </button>
              )}
            </div>

            {!order.tickets || order.tickets.length === 0 ? (
              <div className="text-white/50 text-sm">
                Esta orden no tiene tickets asociados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-white/50 text-xs">
                      <th className="py-2 pr-3 font-semibold">Sel.</th>
                      <th className="py-2 pr-3 font-semibold">Ticket ID</th>
                      <th className="py-2 pr-3 font-semibold">Tipo</th>
                      <th className="py-2 pr-3 font-semibold">Asiento</th>
                      <th className="py-2 pr-3 font-semibold">Monto</th>
                      <th className="py-2 pr-3 font-semibold">Estado ticket</th>
                      <th className="py-2 pr-3 font-semibold">QR</th>
                      <th className="py-2 pr-3 font-semibold">Check-In</th>
                      <th className="py-2 pr-0 font-semibold">Usado en</th>
                    </tr>
                  </thead>

                  <tbody>
                    {order.tickets.map((t) => {
                      const refundInfo = refundableById.get(t.id);
                      const canSelect = !!refundInfo?.refundable;

                      return (
                        <tr key={t.id} className="border-t border-white/10">
                          <td className="py-3 pr-3">
                            <input
                              type="checkbox"
                              checked={selectedTicketIds.includes(t.id)}
                              onChange={() => toggleTicket(t.id)}
                              disabled={!canSelect || refundLoading}
                              className="h-4 w-4 accent-[#007AFF] disabled:opacity-40"
                              title={refundInfo?.blockedReason || ""}
                            />
                          </td>

                          <td className="py-3 pr-3 text-white/70 text-xs font-mono">
                            {t.id.slice(0, 8)}
                          </td>

                          <td className="py-3 pr-3 text-white/80 text-sm">
                            {t.ticketType?.name || "-"}
                          </td>

                          <td className="py-3 pr-3 text-white/70 text-sm">
                            {t.seatId || "-"}
                          </td>

                          <td className="py-3 pr-3 text-white/80 text-sm">
                            {money(t.totalAmount)}
                          </td>

                          <td className="py-3 pr-3">
                            <div className="flex flex-col gap-1">
                              {ticketStatusBadge(t)}
                              {!canSelect && refundInfo?.blockedReason && (
                                <span className="text-[11px] text-white/40">
                                  {refundInfo.blockedReason}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 pr-3 text-white/70 text-xs font-mono">
                            <button
                              onClick={() => {
                                setSelectedTicket(t);
                                setQrOpen(true);
                              }}
                              className="flex items-center gap-2 text-[#007AFF] hover:underline"
                            >
                              <QrCode size={14} />
                              <span>{t.qrCode ? t.qrCode.slice(0, 10) : "-"}</span>
                            </button>
                          </td>

                          <td className="py-3 pr-3">
  <div className="flex flex-col items-start gap-2">
    {t.checkedIn ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/10 border border-green-500/30 text-green-300">
        <CheckCircle2 size={12} />
        Usado
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-white/60">
        <XCircle size={12} />
        Pendiente
      </span>
    )}

    {canRevertCheckin &&
      t.status === "ACTIVE" &&
      t.checkedIn && (
        <button
          onClick={() => handleRevertCheckin(t)}
          disabled={revertLoadingId === t.id}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/15 disabled:opacity-60 text-xs"
          type="button"
        >
          <RefreshCw
            size={12}
            className={revertLoadingId === t.id ? "animate-spin" : ""}
          />
          {revertLoadingId === t.id ? "Revirtiendo..." : "Volver a pendiente"}
        </button>
      )}
  </div>
</td>
                          <td className="py-3 pr-0 text-white/60 text-sm">
                            {t.checkedInAt
                              ? new Date(t.checkedInAt).toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#121212] p-5">
            <div className="flex items-center gap-2 text-white font-semibold mb-4">
              <RefreshCw size={16} />
              Refunds / Cancelaciones
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-xl bg-black/30 border border-white/10 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-2">
                      Tipo de operación
                    </label>
                    <select
                      value={refundMode}
                      onChange={(e) => setRefundMode(e.target.value)}
                      className="w-full rounded-xl bg-[#0B0B0B] border border-white/10 px-3 py-2 text-white outline-none"
                      disabled={refundLoading}
                    >
                      <option value="INTERNAL">Cancelación interna (sin Stripe)</option>
                      <option value="STRIPE">Refund real en Stripe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-2">
                      Tickets seleccionados
                    </label>
                    <div className="rounded-xl bg-[#0B0B0B] border border-white/10 px-3 py-2 text-white">
                      {selectedTicketIds.length}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-white/60 text-sm mb-2">
                    Motivo
                  </label>
                  <input
                    type="text"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Ej: solicitud del cliente, error operativo, cortesía..."
                    className="w-full rounded-xl bg-[#0B0B0B] border border-white/10 px-3 py-2 text-white outline-none"
                    disabled={refundLoading}
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-white/60 text-sm mb-2">
                    Notas internas
                  </label>
                  <textarea
                    value={refundNotes}
                    onChange={(e) => setRefundNotes(e.target.value)}
                    placeholder="Notas opcionales para auditoría interna..."
                    rows={4}
                    className="w-full rounded-xl bg-[#0B0B0B] border border-white/10 px-3 py-2 text-white outline-none resize-none"
                    disabled={refundLoading}
                  />
                </div>

                {refundError ? (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
                    {refundError}
                  </div>
                ) : null}

                {refundMsg ? (
                  <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-green-200 text-sm">
                    {refundMsg}
                  </div>
                ) : null}

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleProcessRefund}
                    disabled={refundLoading || selectedTicketIds.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007AFF] text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {refundLoading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Procesando...
                      </>
                    ) : refundMode === "STRIPE" ? (
                      <>
                        <RotateCcw size={16} />
                        Ejecutar Refund Stripe
                      </>
                    ) : (
                      <>
                        <Ban size={16} />
                        Ejecutar Cancelación Interna
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTicketIds([]);
                      setRefundReason("");
                      setRefundNotes("");
                      setRefundError("");
                      setRefundMsg("");
                    }}
                    className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                    disabled={refundLoading}
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-black/30 border border-white/10 p-4">
                <div className="text-white font-semibold mb-3">Resumen seleccionado</div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-white/70">
                    <span>Subtotal</span>
                    <span>{money(selectedSummary.subtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between text-white/70">
                    <span>Service Fee</span>
                    <span>{money(selectedSummary.serviceFee)}</span>
                  </div>

                  <div className="flex items-center justify-between text-white/70">
                    <span>Sales Tax</span>
                    <span>{money(selectedSummary.salesTax)}</span>
                  </div>

                  <div className="border-t border-white/10 pt-3 flex items-center justify-between text-white font-semibold">
                    <span>Total</span>
                    <span>{money(selectedSummary.total)}</span>
                  </div>

                  <div className="pt-2 text-white/40 text-xs">
                    Solo se pueden seleccionar tickets activos y no usados.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#121212] p-5">
            <div className="flex items-center gap-2 text-white font-semibold mb-4">
              <RotateCcw size={16} />
              Historial de ajustes
            </div>

            {!order.refunds || order.refunds.length === 0 ? (
              <div className="text-white/50 text-sm">
                Esta orden aún no tiene refunds o cancelaciones registradas.
              </div>
            ) : (
              <div className="space-y-4">
                {order.refunds.map((refund) => (
                  <div
                    key={refund.id}
                    className="rounded-xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-white font-medium">
                          {refund.type === "STRIPE"
                            ? "Refund Stripe"
                            : "Cancelación Interna"}
                        </div>
                        <div className="text-white/40 text-xs mt-1 font-mono">
                          {refund.id}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs">
                          {refund.status}
                        </div>
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs">
                          {money(refund.total)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="text-white/70">
                        <span className="text-white/40">Fecha:</span>{" "}
                        {refund.createdAt
                          ? new Date(refund.createdAt).toLocaleString()
                          : "-"}
                      </div>

                      <div className="text-white/70">
                        <span className="text-white/40">Procesado por:</span>{" "}
                        {refund.processedByUser?.name ||
                          refund.processedByUser?.email ||
                          "-"}
                      </div>

                      <div className="text-white/70">
                        <span className="text-white/40">Motivo:</span>{" "}
                        {refund.reason || "-"}
                      </div>

                      <div className="text-white/70">
                        <span className="text-white/40">Stripe Refund ID:</span>{" "}
                        {refund.stripeRefundId || "-"}
                      </div>
                    </div>

                    {refund.notes ? (
                      <div className="mt-3 text-sm text-white/70">
                        <span className="text-white/40">Notas:</span> {refund.notes}
                      </div>
                    ) : null}

                    {refund.items?.length > 0 ? (
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-white/50 text-xs">
                              <th className="py-2 pr-3 font-semibold">Ticket</th>
                              <th className="py-2 pr-3 font-semibold">Tipo</th>
                              <th className="py-2 pr-3 font-semibold">Asiento</th>
                              <th className="py-2 pr-0 font-semibold">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {refund.items.map((item) => (
                              <tr key={item.id} className="border-t border-white/10">
                                <td className="py-2 pr-3 text-white/70 text-xs font-mono">
                                  {item.ticketId.slice(0, 8)}
                                </td>
                                <td className="py-2 pr-3 text-white/80 text-sm">
                                  {item.ticket?.ticketType?.name || "-"}
                                </td>
                                <td className="py-2 pr-3 text-white/70 text-sm">
                                  {item.ticket?.seatId || "-"}
                                </td>
                                <td className="py-2 pr-0 text-white/80 text-sm">
                                  {money(item.totalAmount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {resendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 w-[420px] relative">
            <button
              onClick={() => setResendOpen(false)}
              className="absolute top-3 right-3 text-white/60 hover:text-white"
              type="button"
            >
              <X size={18} />
            </button>

            <div className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <Mail size={18} />
              Reenviar tickets
            </div>

            <div className="text-sm text-white/60 mb-4">
              Puedes reenviar los tickets al email original o corregirlo.
            </div>

            <input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full rounded-xl bg-[#0B0B0B] border border-white/10 px-3 py-2 text-white outline-none mb-4"
              disabled={resendLoading}
            />

            {resendError && (
              <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-200 text-sm">
                {resendError}
              </div>
            )}

            {resendMsg && (
              <div className="mb-3 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-green-200 text-sm">
                {resendMsg}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleResendTickets}
                disabled={resendLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#007AFF] text-white hover:opacity-90 disabled:opacity-50"
                type="button"
              >
                {resendLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    Reenviar
                  </>
                )}
              </button>

              <button
                onClick={() => setResendOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                type="button"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
    <div className="relative w-[420px] rounded-2xl border border-white/10 bg-[#0B0B0B] p-6 shadow-2xl">

      {/* Botón cerrar */}
      <button
        onClick={() => setConfirmOpen(false)}
        className="absolute top-3 right-3 text-white/50 hover:text-white"
      >
        <X size={18} />
      </button>

      {/* Logo / Icono */}
      <div className="flex justify-center mb-4">
        <img
          src={icono2026}
          alt="logo"
          className="h-12 opacity-90"
        />
      </div>

      {/* Título */}
      <h2 className="text-white text-lg font-semibold text-center mb-2">
        Confirmar acción
      </h2>

      {/* Texto */}
      <p className="text-white/60 text-sm text-center mb-4">
        ¿Deseas devolver este ticket a <span className="text-yellow-300">PENDIENTE</span>?
      </p>

      {/* Ticket ID */}
      <div className="text-center text-xs text-white/40 mb-6 font-mono">
        {ticketToRevert?.id}
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <button
          onClick={() => setConfirmOpen(false)}
          className="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
        >
          Cancelar
        </button>

        <button
          onClick={confirmRevert}
          className="flex-1 px-4 py-2 rounded-xl bg-[#007AFF] text-white hover:opacity-90"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
)}

      {qrOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 w-[420px] relative">
            <button
              onClick={() => setQrOpen(false)}
              className="absolute top-3 right-3 text-white/60 hover:text-white"
              type="button"
            >
              <X size={18} />
            </button>

            <div className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <QrCode size={18} />
              Ticket QR
            </div>

            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${selectedTicket.qrCode}`}
                  alt="QR Code"
                />
              </div>
            </div>

            <div className="space-y-2 text-sm text-white/70">
              <div>
                <span className="text-white/40">Ticket ID:</span>{" "}
                {selectedTicket.id}
              </div>

              <div>
                <span className="text-white/40">Tipo:</span>{" "}
                {selectedTicket.ticketType?.name || "-"}
              </div>

              <div>
                <span className="text-white/40">Monto:</span>{" "}
                {money(selectedTicket.totalAmount)}
              </div>

              <div>
                <span className="text-white/40">Estado ticket:</span>{" "}
                {selectedTicket.status || "ACTIVE"}
              </div>

              <div>
                <span className="text-white/40">Check-In:</span>{" "}
                {selectedTicket.checkedIn ? "Usado" : "Pendiente"}
              </div>

              {selectedTicket.checkedInAt && (
                <div>
                  <span className="text-white/40">Usado en:</span>{" "}
                  {new Date(selectedTicket.checkedInAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
