
import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Search,
  Check,
  Loader2,
  AlertCircle,
  Globe2,
  CalendarDays,
} from "lucide-react";
import api from "../../api/api";

const INITIAL_FORM = {
  merchantId: "",
  title: "",
  description: "",
  terms: "",
  quantityMode: "PER_ORDER",
  quantityPerUnit: "1",
  maxCoupons: "",
  includeCourtesy: true,
  scope: "GLOBAL",
  eventIds: [],
  claimStartsAt: "",
  claimEndsAt: "",
  validFrom: "",
  validUntil: "",
};

const inputClass =
  "min-h-12 w-full rounded-xl border border-slate-600 " +
  "bg-slate-950 px-4 py-3 text-white outline-none " +
  "focus:border-sky-500";

const labelClass = "mb-2 block text-sm font-medium text-slate-200";

function unwrapList(response) {
  const payload = response?.data?.data ?? response?.data ?? [];

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
}

function getErrorMessage(error) {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) return message.join(" ");
  if (typeof message === "string") return message;

  return error?.message || "No fue posible guardar la promoción.";
}

function toIso(value) {
  return value ? new Date(value).toISOString() : undefined;
}

function formatEventDate(event) {
  const dates = (event.functions || [])
    .map((fn) => new Date(fn.date))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (!dates.length) return "Fecha no disponible";

  return dates[0].toLocaleString("es-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NuevaPromocionModal({
  open,
  onClose,
  onCreated,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [merchants, setMerchants] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [eventSearch, setEventSearch] = useState("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    setForm({ ...INITIAL_FORM, eventIds: [] });
    setEventSearch("");
    setError("");
    setMerchants([]);
    setEvents([]);
    setLoadingData(true);

    async function loadData() {
      try {
        const [merchantsResponse, eventsResponse] =
          await Promise.all([
            api.get("/beneficios/admin/merchants"),
            api.get("/events/public/catalog"),
          ]);

        if (cancelled) return;

        const activeMerchants = unwrapList(merchantsResponse)
          .filter((merchant) => merchant.status === "ACTIVE");

        const catalogEvents = unwrapList(eventsResponse)
          .filter((event) => {
            if (event.isPublished !== true) return false;

            return Array.isArray(event.functions) &&
              event.functions.some((fn) => {
                const date = new Date(fn.date);

                return (
                  fn.isActive === true &&
                  !Number.isNaN(date.getTime())
                );
              });
          });

        setMerchants(activeMerchants);
        setEvents(catalogEvents);
      } catch (err) {
        if (!cancelled) {
          setError(
            "No fue posible cargar comercios y eventos. " +
            getErrorMessage(err)
          );
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving) onClose();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, saving, onClose]);

  const filteredEvents = useMemo(() => {
    const term = eventSearch.trim().toLowerCase();

    return events.filter((event) => {
      const searchable = [
        event.title,
        event.location,
        ...(event.functions || []).flatMap((fn) => [
          fn.venueName,
          fn.city,
          fn.country,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !term || searchable.includes(term);
    });
  }, [events, eventSearch]);

  const updateField = (name, value) => {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const toggleEvent = (eventId) => {
    setForm((previous) => ({
      ...previous,
      eventIds: previous.eventIds.includes(eventId)
        ? previous.eventIds.filter((id) => id !== eventId)
        : [...previous.eventIds, eventId],
    }));
  };

  const handleScopeChange = (scope) => {
    setForm((previous) => ({
      ...previous,
      scope,
      eventIds: scope === "GLOBAL" ? [] : previous.eventIds,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.merchantId) {
      setError("Selecciona un comercio activo.");
      return;
    }

    if (form.title.trim().length < 2) {
      setError("El título debe tener al menos 2 caracteres.");
      return;
    }

    if (
      form.scope === "EVENTS" &&
      form.eventIds.length === 0
    ) {
      setError("Selecciona al menos un evento.");
      return;
    }

    const quantity = Number(form.quantityPerUnit);

    if (!Number.isInteger(quantity) || quantity < 1) {
      setError("La cantidad por unidad debe ser un entero mayor que cero.");
      return;
    }

    if (form.maxCoupons) {
      const maximum = Number(form.maxCoupons);

      if (!Number.isInteger(maximum) || maximum < 1) {
        setError("El límite de cupones debe ser un entero mayor que cero.");
        return;
      }
    }

    const datePairs = [
      ["claimStartsAt", "claimEndsAt", "El período de reclamo"],
      ["validFrom", "validUntil", "El período de validez"],
    ];

    for (const [startKey, endKey, label] of datePairs) {
      const start = form[startKey];
      const end = form[endKey];

      if (start && end && new Date(start) >= new Date(end)) {
        setError(`${label} debe tener una fecha final posterior a la inicial.`);
        return;
      }
    }

    if (
      form.scope === "EVENTS" &&
      form.eventIds.some(
        (id) => !events.some((item) => item.id === id)
      )
    ) {
      setError("La selección contiene eventos que ya no están disponibles.");
      return;
    }

    const payload = {
      merchantId: form.merchantId,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      terms: form.terms.trim() || undefined,
      quantityMode: form.quantityMode,
      quantityPerUnit: quantity,
      includeCourtesy: form.includeCourtesy,
      eventIds: form.scope === "GLOBAL" ? [] : form.eventIds,
      ...(form.maxCoupons
        ? { maxCoupons: Number(form.maxCoupons) }
        : {}),
      ...(form.claimStartsAt
        ? { claimStartsAt: toIso(form.claimStartsAt) }
        : {}),
      ...(form.claimEndsAt
        ? { claimEndsAt: toIso(form.claimEndsAt) }
        : {}),
      ...(form.validFrom
        ? { validFrom: toIso(form.validFrom) }
        : {}),
      ...(form.validUntil
        ? { validUntil: toIso(form.validUntil) }
        : {}),
    };

    try {
      setSaving(true);

      await api.post("/beneficios/admin/promotions", payload);

      if (onCreated) await onCreated();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 sm:p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-promotion-title"
        className="flex h-[100dvh] w-full flex-col overflow-hidden bg-slate-900 text-white shadow-2xl sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl sm:border sm:border-slate-700"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-700 px-5 py-4">
          <div>
            <h2
              id="new-promotion-title"
              className="text-xl font-bold"
            >
              Nueva promoción
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Se guardará inicialmente como borrador.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar formulario"
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            <X size={22} />
          </button>
        </div>

        <form
          id="new-promotion-form"
          onSubmit={handleSave}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            {error && (
              <div
                role="alert"
                className="flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
              >
                <AlertCircle size={20} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loadingData ? (
              <div className="flex items-center justify-center gap-3 py-16 text-slate-300">
                <Loader2 className="animate-spin" size={22} />
                Cargando comercios y eventos...
              </div>
            ) : (
              <>
                <section className="space-y-4">
                  <h3 className="font-semibold text-sky-300">
                    Información de la promoción
                  </h3>

                  <div>
                    <label htmlFor="promotion-merchant" className={labelClass}>
                      Comercio aliado *
                    </label>
                    <select
                      id="promotion-merchant"
                      required
                      value={form.merchantId}
                      onChange={(e) =>
                        updateField("merchantId", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="">Selecciona un comercio</option>
                      {merchants.map((merchant) => (
                        <option key={merchant.id} value={merchant.id}>
                          {merchant.name}
                        </option>
                      ))}
                    </select>
                    {merchants.length === 0 && (
                      <p className="mt-2 text-xs text-amber-300">
                        No hay comercios activos disponibles.
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="promotion-title" className={labelClass}>
                      Título *
                    </label>
                    <input
                      id="promotion-title"
                      required
                      maxLength={200}
                      value={form.title}
                      onChange={(e) =>
                        updateField("title", e.target.value)
                      }
                      placeholder="Ej. 10% de descuento en tu compra"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="promotion-description" className={labelClass}>
                      Descripción
                    </label>
                    <textarea
                      id="promotion-description"
                      rows={3}
                      value={form.description}
                      onChange={(e) =>
                        updateField("description", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="promotion-terms" className={labelClass}>
                      Términos y condiciones
                    </label>
                    <textarea
                      id="promotion-terms"
                      rows={3}
                      value={form.terms}
                      onChange={(e) =>
                        updateField("terms", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                </section>

                <section className="space-y-4 border-t border-slate-700 pt-5">
                  <h3 className="font-semibold text-sky-300">
                    Alcance de la promoción
                  </h3>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleScopeChange("GLOBAL")}
                      className={
                        "flex items-center gap-3 rounded-xl border p-4 text-left " +
                        (form.scope === "GLOBAL"
                          ? "border-sky-500 bg-sky-500/10"
                          : "border-slate-700 bg-slate-950")
                      }
                    >
                      <Globe2 className="text-sky-400" size={22} />
                      <div>
                        <p className="font-semibold">GLOBAL</p>
                        <p className="text-xs text-slate-400">
                          Todos los eventos elegibles
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleScopeChange("EVENTS")}
                      className={
                        "flex items-center gap-3 rounded-xl border p-4 text-left " +
                        (form.scope === "EVENTS"
                          ? "border-sky-500 bg-sky-500/10"
                          : "border-slate-700 bg-slate-950")
                      }
                    >
                      <CalendarDays className="text-sky-400" size={22} />
                      <div>
                        <p className="font-semibold">EVENTOS ESPECÍFICOS</p>
                        <p className="text-xs text-slate-400">
                          Selecciona uno o varios eventos
                        </p>
                      </div>
                    </button>
                  </div>

                  {form.scope === "EVENTS" && (
                    <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                      <label htmlFor="promotion-event-search" className={labelClass}>
                        Buscar eventos publicados y vigentes
                      </label>

                      <div className="relative">
                        <Search
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          id="promotion-event-search"
                          value={eventSearch}
                          onChange={(e) => setEventSearch(e.target.value)}
                          placeholder="Nombre, ciudad o lugar..."
                          className={inputClass + " pl-10"}
                        />
                      </div>

                      <p className="text-xs text-slate-400">
                        {form.eventIds.length} seleccionado(s) ·{" "}
                        {events.length} disponible(s)
                      </p>

                      <div className="max-h-64 space-y-2 overflow-y-auto">
                        {filteredEvents.map((event) => {
                          const selected = form.eventIds.includes(event.id);

                          return (
                            <button
                              key={event.id}
                              type="button"
                              onClick={() => toggleEvent(event.id)}
                              aria-pressed={selected}
                              className={
                                "flex w-full items-start gap-3 rounded-xl border p-3 text-left " +
                                (selected
                                  ? "border-sky-500 bg-sky-500/10"
                                  : "border-slate-700 bg-slate-900 hover:border-slate-500")
                              }
                            >
                              <span
                                className={
                                  "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border " +
                                  (selected
                                    ? "border-sky-500 bg-sky-500"
                                    : "border-slate-500")
                                }
                              >
                                {selected && <Check size={14} />}
                              </span>

                              <span className="min-w-0">
                                <span className="block font-medium">
                                  {event.title}
                                </span>
                                <span className="mt-1 block text-xs text-slate-400">
                                  {formatEventDate(event)}
                                  {event.functions?.[0]?.city
                                    ? " · " + event.functions[0].city
                                    : ""}
                                </span>
                              </span>
                            </button>
                          );
                        })}

                        {filteredEvents.length === 0 && (
                          <p className="py-6 text-center text-sm text-slate-400">
                            No se encontraron eventos disponibles.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                <section className="space-y-4 border-t border-slate-700 pt-5">
                  <h3 className="font-semibold text-sky-300">
                    Generación de cupones
                  </h3>

                  <div>
                    <label htmlFor="promotion-mode" className={labelClass}>
                      Modalidad
                    </label>
                    <select
                      id="promotion-mode"
                      value={form.quantityMode}
                      onChange={(e) =>
                        updateField("quantityMode", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="PER_ORDER">
                        Por orden de compra
                      </option>
                      <option value="PER_TICKET">
                        Por ticket
                      </option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="promotion-quantity" className={labelClass}>
                        Cupones por unidad
                      </label>
                      <input
                        id="promotion-quantity"
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={form.quantityPerUnit}
                        onChange={(e) =>
                          updateField("quantityPerUnit", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label htmlFor="promotion-maximum" className={labelClass}>
                        Máximo de cupones (opcional)
                      </label>
                      <input
                        id="promotion-maximum"
                        type="number"
                        min="1"
                        step="1"
                        value={form.maxCoupons}
                        onChange={(e) =>
                          updateField("maxCoupons", e.target.value)
                        }
                        placeholder="Sin límite"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 bg-slate-950 p-4">
                    <input
                      type="checkbox"
                      checked={form.includeCourtesy}
                      onChange={(e) =>
                        updateField("includeCourtesy", e.target.checked)
                      }
                      className="mt-1 h-5 w-5 accent-sky-500"
                    />
                    <span>
                      <span className="block font-medium">
                        Incluir tickets de cortesía
                      </span>
                      <span className="mt-1 block text-xs text-slate-400">
                        Permitir beneficios para entradas de cortesía elegibles.
                      </span>
                    </span>
                  </label>
                </section>

                <section className="space-y-4 border-t border-slate-700 pt-5">
                  <h3 className="font-semibold text-sky-300">
                    Fechas de la promoción
                  </h3>

                  <p className="text-xs text-slate-400">
                    Las fechas son opcionales. Se interpretan según
                    la zona horaria del dispositivo y se guardan en UTC.
                  </p>

                  {[
                    ["claimStartsAt", "Inicio de reclamo"],
                    ["claimEndsAt", "Fin de reclamo"],
                    ["validFrom", "Inicio de validez"],
                    ["validUntil", "Fin de validez"],
                  ].map(([field, label]) => (
                    <div key={field}>
                      <label htmlFor={"promotion-" + field} className={labelClass}>
                        {label}
                      </label>
                      <input
                        id={"promotion-" + field}
                        type="datetime-local"
                        value={form[field]}
                        onChange={(e) =>
                          updateField(field, e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                  ))}
                </section>
              </>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-700 bg-slate-900 px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="min-h-12 rounded-xl border border-slate-600 px-5 font-semibold text-slate-200 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                loadingData ||
                saving ||
                merchants.length === 0
              }
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#007AFF] px-5 font-semibold text-white disabled:opacity-50"
            >
              {saving && <Loader2 size={18} className="animate-spin" />}
              {saving ? "Guardando..." : "Guardar borrador"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
