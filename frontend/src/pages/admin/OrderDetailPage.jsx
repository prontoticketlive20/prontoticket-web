import React, { useEffect, useState } from "react";
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
} from "lucide-react";

import api from "../../api/api";
import AdminLayout from "../../components/admin/AdminLayout";

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);

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

  useEffect(() => {
    let alive = true;

    const loadOrder = async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        const res = await api.get(`/orders/${id}`);
        const payload = 
           res.data?.data?.data ??
           res.data?.data ??
           res.data ??
           null;

        if (!alive) return;
        setOrder(payload);
      } catch (e) {
        if (!alive) return;
        setErrorMsg("No pude cargar el detalle de la orden.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    if (id) loadOrder();

    return () => {
      alive = false;
    };
  }, [id]);

  const money = (n) => {
    const v = Number(n);
    const safe = Number.isFinite(v) ? v : 0;
    return `$${safe.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  const firstTicket = order?.tickets?.[0];
  const firstFunction = firstTicket?.function;
  const firstEvent = firstFunction?.event;

  return (
    <AdminLayout user={user}>
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
            Información completa de la transacción y sus tickets.
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
            {/* Order summary */}
            <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-[#121212] p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-white/50 text-xs">Order ID</div>
                  <div className="text-white font-mono text-sm break-all">
                    {order.id}
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm">
                  {order.status}
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

            {/* Totals */}
            <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
              <div className="text-white font-semibold mb-4">Totales</div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-white/70">
                  <span>Subtotal</span>
                  <span>{money(order.subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-white/70">
                  <span>Service Fee</span>
                  <span>{money(order.serviceFee)}</span>
                </div>

                <div className="flex items-center justify-between text-white/70">
                  <span>Sales Tax</span>
                  <span>{money(order.salesTax)}</span>
                </div>

                <div className="border-t border-white/10 pt-3 flex items-center justify-between text-white font-semibold">
                  <span>Total</span>
                  <span>{money(order.total)}</span>
                </div>

                <div className="pt-2 text-white/50 text-xs">
                  Tickets en la orden: {order.tickets?.length || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Tickets */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-[#121212] p-5">
            <div className="flex items-center gap-2 text-white font-semibold mb-4">
              <Ticket size={16} />
              Tickets incluidos
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
                      <th className="py-2 pr-3 font-semibold">Ticket ID</th>
                      <th className="py-2 pr-3 font-semibold">Tipo</th>
                      <th className="py-2 pr-3 font-semibold">Asiento</th>
                      <th className="py-2 pr-3 font-semibold">QR</th>
                      <th className="py-2 pr-3 font-semibold">Check-In</th>
                      <th className="py-2 pr-0 font-semibold">Usado en</th>
                    </tr>
                  </thead>

                  <tbody>
                    {order.tickets.map((t) => (
                      <tr key={t.id} className="border-t border-white/10">
                        <td className="py-3 pr-3 text-white/70 text-xs font-mono">
                          {t.id.slice(0, 8)}
                        </td>

                        <td className="py-3 pr-3 text-white/80 text-sm">
                          {t.ticketType?.name || "-"}
                        </td>

                        <td className="py-3 pr-3 text-white/70 text-sm">
                          {t.seatId || "-"}
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
                        </td>

                        <td className="py-3 pr-0 text-white/60 text-sm">
                          {t.checkedInAt
                            ? new Date(t.checkedInAt).toLocaleString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

{qrOpen && selectedTicket && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
    <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 w-[420px] relative">

      <button
        onClick={() => setQrOpen(false)}
        className="absolute top-3 right-3 text-white/60 hover:text-white"
      >
        <X size={18} />
      </button>

      <div className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <QrCode size={18} />
        Ticket QR
      </div>

      <div className="flex justify-center mb-4">
        <div className="bg-white p-4 rounded-lg">
          {/* QR REAL */}
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
          <span className="text-white/40">Estado:</span>{" "}
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