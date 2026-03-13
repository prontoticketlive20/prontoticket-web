import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePurchase } from "../context/PurchaseContext";
import api from "../api/api";

export default function TicketSelection({ event, onClose }) {
  const navigate = useNavigate();
  const { updateTickets, formatPrice } = usePurchase();

  const [pricingTypes, setPricingTypes] = useState([]);

  const selectedFunctionId = useMemo(() => {
    return (
      event?.selectedFunctionId ||
      event?.functionId ||
      event?.selectedFunction?.id ||
      event?.activeFunction?.id ||
      event?.function?.id ||
      event?.functions?.[0]?.id ||
      null
    );
  }, [event]);

  useEffect(() => {
    const loadPricing = async () => {
      if (!selectedFunctionId) {
        setPricingTypes([]);
        return;
      }

      try {
        const res = await api.get(
          `/function-ticket-types/function/${selectedFunctionId}`
        );

        const raw = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];

        const mapped = raw.map((p) => ({
          id: p.ticketType?.id || p.ticketTypeId,
          pricingId: p.id,
          name: p.ticketType?.name || "Ticket",
          price: Number(p.price) || 0,
          serviceFee: Number(p.ticketType?.serviceFee || 0),
          available:
            p.available == null || Number(p.available) === 0
              ? 999999
              : Number(p.available),
        }));

        setPricingTypes(mapped);
      } catch (err) {
        console.error("Error loading function pricing", err);
        setPricingTypes([]);
      }
    };

    loadPricing();
  }, [selectedFunctionId]);

  const ticketTypes = useMemo(() => {
    if (pricingTypes.length > 0) {
      return pricingTypes;
    }

    const list = Array.isArray(event?.ticketTypes) ? event.ticketTypes : [];

    return list.map((t) => ({
      id: t.id,
      pricingId: null,
      name: t.name,
      price: Number(t.price) || 0,
      serviceFee: Number(t.serviceFee || 0),
      available:
        t.available == null || t.available === 0 ? 999999 : t.available,
    }));
  }, [event, pricingTypes]);

  useEffect(() => {
    console.log("[TicketSelection] event.id:", event?.id);
    console.log("[TicketSelection] selectedFunctionId:", selectedFunctionId);
    console.log("[TicketSelection] ticketTypes:", ticketTypes);
  }, [event, selectedFunctionId, ticketTypes]);

  const [qtyById, setQtyById] = useState({});

  useEffect(() => {
    const initial = {};
    ticketTypes.forEach((t) => {
      initial[t.id] = 0;
    });
    setQtyById(initial);
  }, [ticketTypes]);

  const increase = (id) => {
    setQtyById((prev) => {
      const current = prev[id] ?? 0;
      const tt = ticketTypes.find((x) => x.id === id);
      const max = tt?.available ?? 999999;
      if (current >= max) return prev;
      return { ...prev, [id]: current + 1 };
    });
  };

  const decrease = (id) => {
    setQtyById((prev) => {
      const current = prev[id] ?? 0;
      if (current <= 0) return prev;
      return { ...prev, [id]: current - 1 };
    });
  };

  const selectedTicketsArray = useMemo(() => {
    return ticketTypes
      .map((t) => ({
        id: t.id,
        pricingId: t.pricingId,
        name: t.name,
        price: t.price,
        serviceFee: t.serviceFee,
        quantity: qtyById[t.id] ?? 0,
      }))
      .filter((t) => t.quantity > 0);
  }, [ticketTypes, qtyById]);

  const total = useMemo(() => {
    return selectedTicketsArray.reduce((sum, t) => sum + t.price * t.quantity, 0);
  }, [selectedTicketsArray]);

  const canContinue = selectedTicketsArray.length > 0;

  const handleContinue = () => {
    updateTickets(selectedTicketsArray);
    onClose?.();
    navigate(`/evento/${event.id}/resumen`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#121212] shadow-2xl overflow-hidden mx-auto mt-24"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10">
          <div>
            <h2
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Seleccionar entradas
            </h2>
            <p className="text-white/60 text-sm mt-1">{event?.title}</p>
          </div>

          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-white/60 text-sm">
            Selecciona el tipo y cantidad de entradas que deseas.
          </p>

          <div className="space-y-3">
            {ticketTypes.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm">
                No hay tipos de tickets disponibles para este evento.
              </div>
            ) : (
              ticketTypes.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div>
                    <div className="text-white font-semibold">{t.name}</div>
                    <div className="text-white/60 text-sm">
                      {formatPrice ? formatPrice(t.price) : `$${t.price}`}
                      <span className="ml-2 text-white/40">
                        (Disp: {t.available === 999999 ? "—" : t.available})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => decrease(t.id)}
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition"
                      aria-label={`Disminuir ${t.name}`}
                    >
                      -
                    </button>

                    <div className="w-8 text-center text-white font-semibold">
                      {qtyById[t.id] ?? 0}
                    </div>

                    <button
                      type="button"
                      onClick={() => increase(t.id)}
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition"
                      aria-label={`Aumentar ${t.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total */}
          <div className="pt-4 border-t border-white/10">
            <div className="text-white/50 text-xs uppercase tracking-wide mb-1">
              Total
            </div>
            <div
              className="text-3xl font-bold text-white"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {formatPrice ? formatPrice(total) : `$${total}`}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="w-full px-8 py-4 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white text-base font-bold rounded-full transition-all duration-300 hover:brightness-110 shadow-lg hover:shadow-[0_8px_30px_rgba(0,122,255,0.6)] active:scale-95 tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}