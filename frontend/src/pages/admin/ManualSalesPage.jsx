import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/api";
import {
  ArrowLeft,
  DollarSign,
  Ticket,
  User,
  CreditCard,
  Gift,
  Loader2,
  CalendarDays,
  Hash,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Percent,
  BadgeDollarSign,
} from "lucide-react";
import icono2026 from "../../assets/icono_2026.png";

export default function ManualSalesPage() {
  const [user, setUser] = useState(null);

  const [events, setEvents] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);

  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedFunction, setSelectedFunction] = useState("");

  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [salesChannel, setSalesChannel] = useState("ADMIN");
  const [externalPaymentReference, setExternalPaymentReference] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [items, setItems] = useState([]);

  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingTicketTypes, setLoadingTicketTypes] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successBox, setSuccessBox] = useState(null);
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    let alive = true;

    const loadInitialData = async () => {
      setLoadingPage(true);
      setErrorMsg("");
      setSuccessBox(null);

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
            ? rawList.filter(
                (e) => e.producerId === me.id || e.producerId === me.userId
              )
            : rawList;

        if (!alive) return;

        setUser(me);
        setEvents(filteredEvents);
      } catch (error) {
        console.error("[ManualSalesPage] Error loading initial data:", error);
        if (!alive) return;
        setErrorMsg("No pude cargar la información inicial.");
      } finally {
        if (alive) setLoadingPage(false);
      }
    };

    loadInitialData();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const event = events.find((e) => e.id === selectedEvent);

    setFunctions(Array.isArray(event?.functions) ? event.functions : []);
    setSelectedFunction("");
    setTicketTypes([]);
    setItems([]);
    setQuote(null);
    setErrorMsg("");
    setSuccessBox(null);
  }, [selectedEvent, events]);

  useEffect(() => {
    let alive = true;

    const loadTicketTypes = async () => {
      if (!selectedFunction) {
        setTicketTypes([]);
        setItems([]);
        setQuote(null);
        return;
      }

      setLoadingTicketTypes(true);
      setErrorMsg("");
      setSuccessBox(null);

      try {
        const res = await api.get(
          `/function-ticket-types/function/${selectedFunction}`
        );

        const payload = res.data?.data ?? res.data ?? [];
        const rows = Array.isArray(payload) ? payload : [];

        const normalized = rows.map((row) => ({
          pricingId: row.id,
          ticketTypeId: row.ticketType?.id || row.ticketTypeId,
          name: row.ticketType?.name || "Entrada",
          price: Number(row.price || 0),
          available: Number(row.available || 0),
          sold: Number(row.sold || 0),
          remaining: Math.max(
            Number(row.available || 0) - Number(row.sold || 0),
            0
          ),
        }));

        if (!alive) return;

        setTicketTypes(normalized);
        setItems([]);
        setQuote(null);
      } catch (error) {
        console.error("[ManualSalesPage] Error loading ticket types:", error);
        if (!alive) return;
        setTicketTypes([]);
        setItems([]);
        setQuote(null);
        setErrorMsg("No pude cargar los tipos de entrada de esta función.");
      } finally {
        if (alive) setLoadingTicketTypes(false);
      }
    };

    loadTicketTypes();

    return () => {
      alive = false;
    };
  }, [selectedFunction]);

  useEffect(() => {
    if (paymentMethod === "COURTESY") {
      setSalesChannel("ADMIN");
    }
  }, [paymentMethod]);

  useEffect(() => {
    let alive = true;

    const loadQuote = async () => {
      const validItems = items.filter((i) => Number(i.quantity || 0) > 0);

      if (!selectedFunction || validItems.length === 0) {
        setQuote(null);
        return;
      }

      setLoadingQuote(true);

      try {
        const res = await api.post("/orders/admin/manual/quote", {
          functionId: selectedFunction,
          paymentMethod,
          items: validItems,
        });

        const payload =
          res.data?.data?.data ||
          res.data?.data ||
          res.data ||
          null;

        if (!alive) return;
        setQuote(payload);
      } catch (error) {
        console.error("[ManualSalesPage] Error loading quote:", error);
        if (!alive) return;
        setQuote(null);
      } finally {
        if (alive) setLoadingQuote(false);
      }
    };

    loadQuote();

    return () => {
      alive = false;
    };
  }, [selectedFunction, paymentMethod, items]);

  const reloadTicketTypes = async () => {
    if (!selectedFunction) return;

    setLoadingTicketTypes(true);

    try {
      const res = await api.get(
        `/function-ticket-types/function/${selectedFunction}`
      );

      const payload = res.data?.data ?? res.data ?? [];
      const rows = Array.isArray(payload) ? payload : [];

      const normalized = rows.map((row) => ({
        pricingId: row.id,
        ticketTypeId: row.ticketType?.id || row.ticketTypeId,
        name: row.ticketType?.name || "Entrada",
        price: Number(row.price || 0),
        available: Number(row.available || 0),
        sold: Number(row.sold || 0),
        remaining: Math.max(
          Number(row.available || 0) - Number(row.sold || 0),
          0
        ),
      }));

      setTicketTypes(normalized);
      setItems([]);
      setQuote(null);
    } catch (error) {
      console.error("[ManualSalesPage] Error reloading ticket types:", error);
      setErrorMsg("La venta se registró, pero no pude refrescar disponibilidad.");
    } finally {
      setLoadingTicketTypes(false);
    }
  };

  const resetFormForNextSale = async (resultData) => {
    setBuyerName("");
    setBuyerEmail("");
    setBuyerPhone("");
    setExternalPaymentReference("");
    setInternalNotes("");
    setItems([]);
    setQuote(null);

    await reloadTicketTypes();

    setSuccessBox({
      title: "Venta registrada correctamente",
      method: resultData?.order?.paymentMethod || paymentMethod,
      ticketsCount: resultData?.tickets?.length || 0,
      total: resultData?.order?.total || 0,
      emailSent: Boolean(resultData?.emailSent),
      emailError: resultData?.emailError || null,
    });
  };

  const updateQuantity = (ticketTypeId, qtyRaw) => {
    const qty = Math.max(0, Number(qtyRaw || 0));
    const pricing = ticketTypes.find((t) => t.ticketTypeId === ticketTypeId);

    if (!pricing) return;

    const safeQty = Math.min(qty, pricing.remaining);

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.ticketTypeId === ticketTypeId);

      if (safeQty <= 0) {
        return prev.filter((i) => i.ticketTypeId !== ticketTypeId);
      }

      if (existingIndex >= 0) {
        return prev.map((i) =>
          i.ticketTypeId === ticketTypeId ? { ...i, quantity: safeQty } : i
        );
      }

      return [...prev, { ticketTypeId, quantity: safeQty }];
    });
  };

  const selectedItemsDetailed = useMemo(() => {
    return items
      .map((item) => {
        const pricing = ticketTypes.find((t) => t.ticketTypeId === item.ticketTypeId);
        if (!pricing) return null;

        return {
          ...item,
          name: pricing.name,
          price: pricing.price,
          subtotal: pricing.price * Number(item.quantity || 0),
        };
      })
      .filter(Boolean);
  }, [items, ticketTypes]);

  const totalTickets = useMemo(() => {
    if (quote?.ticketsCount != null) return Number(quote.ticketsCount || 0);

    return selectedItemsDetailed.reduce(
      (acc, item) => acc + Number(item.quantity || 0),
      0
    );
  }, [quote, selectedItemsDetailed]);

  const canSubmit =
    !!selectedFunction &&
    totalTickets > 0 &&
    !!buyerName.trim() &&
    !!buyerEmail.trim() &&
    !submitting;

  const selectedEventObj = events.find((e) => e.id === selectedEvent) || null;
  const selectedFunctionObj =
    functions.find((f) => f.id === selectedFunction) || null;

  const money = (n) => {
    const v = Number(n);
    const safe = Number.isFinite(v) ? v : 0;
    return `$${safe.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  const handleSubmit = async () => {
    if (!selectedFunction) {
      setErrorMsg("Selecciona una función.");
      return;
    }

    if (totalTickets <= 0) {
      setErrorMsg("Debes seleccionar al menos una entrada.");
      return;
    }

    if (!buyerName.trim() || !buyerEmail.trim()) {
      setErrorMsg("Nombre y email del comprador son requeridos.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessBox(null);

    try {
      const payload = {
        functionId: selectedFunction,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim(),
        buyerPhone: buyerPhone.trim() || undefined,
        paymentMethod,
        salesChannel,
        items: items.filter((i) => Number(i.quantity || 0) > 0),
        externalPaymentReference:
          externalPaymentReference.trim() || undefined,
        internalNotes: internalNotes.trim() || undefined,
      };

      const res = await api.post("/orders/admin/manual", payload);
      const resultData =
        res.data?.data?.data ||
        res.data?.data ||
        res.data ||
        null;

      await resetFormForNextSale(resultData);
    } catch (error) {
      console.error("[ManualSalesPage] Error creating manual order:", error);

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "No pude generar la orden manual.";

      if (Array.isArray(backendMessage)) {
        setErrorMsg(backendMessage.join(", "));
      } else {
        setErrorMsg(String(backendMessage));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPage) {
    return (
      <AdminLayout user={user}>
        <div className="rounded-[28px] border border-white/10 bg-[#121212] p-8 text-white/80 flex flex-col items-center justify-center gap-4 min-h-[280px]">
          <div className="w-24 h-24 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl shadow-black/30">
            <img
              src={icono2026}
              alt="ProntoTicketLive"
              className="w-14 h-14 object-contain animate-pulse"
            />
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <Loader2 size={18} className="animate-spin" />
            <span>Cargando venta manual…</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80"
            type="button"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-white">Venta Manual / Cortesía</h1>
            <p className="text-white/50 text-sm">
              Emite tickets manuales con Cash, Card o Courtesy.
            </p>
          </div>
        </div>

        {successBox ? (
          <div className="mb-5 rounded-[28px] border border-[#007AFF]/20 bg-gradient-to-r from-[#0f1c2c] to-[#101826] px-5 py-4 shadow-xl shadow-black/20">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <img
                  src={icono2026}
                  alt="ProntoTicketLive"
                  className="w-8 h-8 object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[#8ec5ff] font-semibold mb-1">
                  <CheckCircle2 size={18} className="text-green-400" />
                  <span>{successBox.title}</span>
                </div>

                <div className="text-white/75 text-sm leading-relaxed">
                  Método: <span className="text-white font-semibold">{successBox.method}</span> ·{" "}
                  Tickets emitidos: <span className="text-white font-semibold">{successBox.ticketsCount}</span> ·{" "}
                  Total: <span className="text-white font-semibold">{money(successBox.total)}</span>
                </div>

                <div className="mt-1 text-sm">
                  {successBox.emailSent ? (
                    <span className="text-green-300">
                      Email enviado correctamente al comprador.
                    </span>
                  ) : successBox.emailError ? (
                    <span className="text-yellow-300">
                      La venta fue exitosa, pero el email no se pudo enviar.
                    </span>
                  ) : (
                    <span className="text-white/60">
                      Venta lista para continuar con la siguiente operación.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {errorMsg ? (
          <div className="mb-5 rounded-[28px] border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-200 shadow-xl shadow-black/20">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <img
                  src={icono2026}
                  alt="ProntoTicketLive"
                  className="w-8 h-8 object-contain"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <AlertTriangle size={18} />
                  <span>No se pudo completar la operación</span>
                </div>
                <div className="text-sm leading-relaxed">{errorMsg}</div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
              <div className="flex items-center gap-2 text-white font-semibold mb-4">
                <CalendarDays size={18} className="text-[#007AFF]" />
                Selección de evento
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/60">Evento</label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="mt-1 w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-white/20"
                  >
                    <option value="">Seleccionar evento</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/60">Función</label>
                  <select
                    value={selectedFunction}
                    onChange={(e) => setSelectedFunction(e.target.value)}
                    disabled={!selectedEvent}
                    className="mt-1 w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-white/20 disabled:opacity-50"
                  >
                    <option value="">
                      {!selectedEvent
                        ? "Selecciona un evento primero"
                        : "Seleccionar función"}
                    </option>
                    {functions.map((f) => (
                      <option key={f.id} value={f.id}>
                        {new Date(f.date).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
              <div className="flex items-center gap-2 text-white font-semibold mb-4">
                <User size={18} className="text-[#007AFF]" />
                Comprador
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-white/60">Nombre</label>
                  <input
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Nombre del comprador"
                    className="mt-1 w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-white/30 outline-none focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/60">Email</label>
                  <input
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="correo@email.com"
                    className="mt-1 w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-white/30 outline-none focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/60">Teléfono</label>
                  <input
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="Teléfono"
                    className="mt-1 w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-white/30 outline-none focus:border-white/20"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
              <div className="flex items-center gap-2 text-white font-semibold mb-4">
                <DollarSign size={18} className="text-[#FF9500]" />
                Método y control
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-white/60">Método de pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-white/20"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="COURTESY">Courtesy</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/60">Canal</label>
                  <select
                    value={salesChannel}
                    onChange={(e) => setSalesChannel(e.target.value)}
                    disabled={paymentMethod === "COURTESY"}
                    className="mt-1 w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-white/20 disabled:opacity-50"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="DOOR">DOOR</option>
                    <option value="WEB">WEB</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/60">
                    Referencia externa
                  </label>
                  <div className="relative mt-1">
                    <Hash
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                    />
                    <input
                      value={externalPaymentReference}
                      onChange={(e) => setExternalPaymentReference(e.target.value)}
                      placeholder="Voucher, caja, POS..."
                      className="w-full pl-9 p-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-white/30 outline-none focus:border-white/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/60">Notas internas</label>
                  <div className="relative mt-1">
                    <FileText
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                    />
                    <input
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Observaciones internas"
                      className="w-full pl-9 p-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-white/30 outline-none focus:border-white/20"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs border ${
                    paymentMethod === "CASH"
                      ? "bg-green-500/10 border-green-500/30 text-green-300"
                      : "bg-white/5 border-white/10 text-white/60"
                  }`}
                >
                  <DollarSign size={13} />
                  Cash
                </span>

                <span
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs border ${
                    paymentMethod === "CARD"
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                      : "bg-white/5 border-white/10 text-white/60"
                  }`}
                >
                  <CreditCard size={13} />
                  Card
                </span>

                <span
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs border ${
                    paymentMethod === "COURTESY"
                      ? "bg-orange-500/10 border-orange-500/30 text-orange-300"
                      : "bg-white/5 border-white/10 text-white/60"
                  }`}
                >
                  <Gift size={13} />
                  Courtesy
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
              <div className="flex items-center gap-2 text-white font-semibold mb-4">
                <Ticket size={18} className="text-[#FF9500]" />
                Tipos de entrada
              </div>

              {!selectedFunction ? (
                <div className="text-white/50 text-sm">
                  Selecciona una función para cargar los tipos de entrada.
                </div>
              ) : loadingTicketTypes ? (
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-8 flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center shadow-xl shadow-black/20">
                    <img
                      src={icono2026}
                      alt="ProntoTicketLive"
                      className="w-12 h-12 object-contain animate-pulse"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    Cargando tipos de entrada…
                  </div>
                </div>
              ) : ticketTypes.length === 0 ? (
                <div className="text-white/50 text-sm">
                  Esta función no tiene pricing configurado.
                </div>
              ) : (
                <div className="space-y-3">
                  {ticketTypes.map((t) => {
                    const selectedQty =
                      items.find((i) => i.ticketTypeId === t.ticketTypeId)?.quantity || 0;

                    return (
                      <div
                        key={t.pricingId}
                        className="rounded-xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <div className="text-white font-semibold">{t.name}</div>
                            <div className="text-white/50 text-sm mt-1">
                              Precio: {money(t.price)} · Disponibles: {t.remaining}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-white/50 text-sm">Cantidad</span>
                            <input
                              type="number"
                              min="0"
                              max={t.remaining}
                              value={selectedQty}
                              onChange={(e) =>
                                updateQuantity(t.ticketTypeId, e.target.value)
                              }
                              className="w-24 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white outline-none focus:border-white/20"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#121212] p-5 xl:sticky xl:top-24">
              <div className="text-white font-semibold mb-4">Resumen</div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-white/70">
                  <span>Evento</span>
                  <span className="text-right max-w-[180px] truncate">
                    {selectedEventObj?.title || "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-white/70">
                  <span>Función</span>
                  <span className="text-right max-w-[180px] truncate">
                    {selectedFunctionObj?.date
                      ? new Date(selectedFunctionObj.date).toLocaleString()
                      : "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-white/70">
                  <span>Método</span>
                  <span>{paymentMethod}</span>
                </div>

                <div className="flex items-center justify-between text-white/70">
                  <span>Canal</span>
                  <span>{salesChannel}</span>
                </div>

                <div className="border-t border-white/10 pt-3 flex items-center justify-between text-white/70">
                  <span>Tickets</span>
                  <span>{totalTickets}</span>
                </div>

                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between text-white/70">
                    <span className="inline-flex items-center gap-2">
                      <BadgeDollarSign size={15} className="text-[#007AFF]" />
                      Entradas
                    </span>
                    <span>
                      {loadingQuote ? "..." : money(quote?.subtotal || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-white/70">
                    <span className="inline-flex items-center gap-2">
                      <Receipt size={15} className="text-[#FF9500]" />
                      Service Fee
                    </span>
                    <span>
                      {loadingQuote ? "..." : money(quote?.serviceFee || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-white/70">
                    <span className="inline-flex items-center gap-2">
                      <Percent size={15} className="text-[#8ec5ff]" />
                      Sales Tax
                    </span>
                    <span>
                      {loadingQuote ? "..." : money(quote?.salesTax || 0)}
                    </span>
                  </div>

                  <div className="border-t border-white/10 pt-3 flex items-center justify-between text-white font-semibold text-base">
                    <span>Total</span>
                    <span>
                      {loadingQuote ? "..." : money(quote?.total || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {quote?.items?.length > 0 ? (
                <div className="mt-5 pt-5 border-t border-white/10 space-y-2">
                  {quote.items.map((item) => {
                    const pricing = ticketTypes.find(
                      (t) => t.ticketTypeId === item.ticketTypeId
                    );

                    return (
                      <div
                        key={item.ticketTypeId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-white/70">
                          {(pricing?.name || "Entrada")} x {item.quantity}
                        </span>
                        <span className="text-white/90">
                          {money(item.total)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-[#FF9500] to-[#ff7700] text-white font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                type="button"
              >
                {submitting ? (
                  <>
                    <img
                      src={icono2026}
                      alt="ProntoTicketLive"
                      className="w-5 h-5 object-contain animate-pulse"
                    />
                    <Loader2 size={18} className="animate-spin" />
                    <span>Procesando…</span>
                  </>
                ) : (
                  <>
                    <Ticket size={18} />
                    <span>Emitir tickets</span>
                  </>
                )}
              </button>

              <div className="mt-3 text-white/35 text-xs leading-relaxed">
                {paymentMethod === "COURTESY"
                  ? "Las cortesías se emitirán con monto total en cero."
                  : "Cash y Card generan tickets sin pasar por Stripe, con precio normal, fee e impuesto."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}