
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Gift,
  Plus,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  CalendarDays,
  Store,
  Globe2,
  Ticket,
} from "lucide-react";

import { Link } from "react-router-dom";

import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/api";
import NuevaPromocionModal from "./NuevaPromocionModal";

// ==========================================
// ESTADOS DE PROMOCIONES
// ==========================================

const STATUS_CONFIG = {
  DRAFT: {
    label: "Borrador",
    className: "bg-slate-700 text-slate-200",
  },
  ACTIVE: {
    label: "Activa",
    className: "bg-emerald-500/15 text-emerald-300",
  },
  PAUSED: {
    label: "Pausada",
    className: "bg-amber-500/15 text-amber-300",
  },
  ENDED: {
    label: "Finalizada",
    className: "bg-red-500/15 text-red-300",
  },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status || "Sin estado",
    className: "bg-slate-700 text-slate-300",
  };

  return (
    <span
      className={
        "inline-flex items-center rounded-full " +
        "px-3 py-1 text-xs font-semibold " +
        config.className
      }
    >
      {config.label}
    </span>
  );
}

// ==========================================
// FORMATO DE FECHAS
// ==========================================

function formatDate(value) {
  if (!value) return "Sin definir";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha inválida";
  }

  return date.toLocaleDateString("es-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ==========================================
// TARJETA DE PROMOCION
// ==========================================

function PromotionCard({
  promotion,
  onChangeStatus,
  changingStatusId,
}) {
  const associatedEvents = Array.isArray(promotion.events)
    ? promotion.events
    : [];

  const eventCount = associatedEvents.length;

  const isGlobal =
    eventCount === 0 && !promotion.eventId;

  const merchantName =
    promotion.merchant?.name || "Comercio no disponible";

  const quantityLabel =
    promotion.quantityMode === "PER_TICKET"
      ? "Por boleto"
      : "Por orden";

  return (
    <article className="rounded-2xl border border-slate-700 bg-[#111827] p-5 transition-colors hover:border-sky-500/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={promotion.status} />

            <span className="text-xs text-slate-500">
              {isGlobal
                ? "Promoción global"
                : "Eventos específicos"}
            </span>
          </div>

          <h3 className="break-words text-lg font-bold text-white">
            {promotion.title || "Promoción sin título"}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
            <Store size={16} className="shrink-0 text-sky-400" />
            <span className="break-words">{merchantName}</span>
          </div>

          {promotion.description && (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-400">
              {promotion.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isGlobal ? (
            <Globe2 size={22} className="text-sky-400" />
          ) : (
            <Ticket size={22} className="text-sky-400" />
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-700 pt-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs text-slate-500">Alcance</p>
          <p className="mt-1 font-medium text-slate-200">
            {isGlobal
              ? "Todos los eventos elegibles"
              : `${eventCount || 1} evento(s)`}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Generación</p>
          <p className="mt-1 font-medium text-slate-200">
            {quantityLabel}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Cupones por unidad</p>
          <p className="mt-1 font-medium text-slate-200">
            {promotion.quantityPerUnit ?? 1}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Límite de cupones</p>
          <p className="mt-1 font-medium text-slate-200">
            {promotion.maxCoupons ?? "Sin límite"}
          </p>
        </div>

        <div>
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <CalendarDays size={14} />
            Inicio de reclamo
          </p>
          <p className="mt-1 font-medium text-slate-200">
            {formatDate(promotion.claimStartsAt)}
          </p>
        </div>

        <div>
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <CalendarDays size={14} />
            Fin de reclamo
          </p>
          <p className="mt-1 font-medium text-slate-200">
            {formatDate(promotion.claimEndsAt)}
          </p>
        </div>
      </div>
    
      {/* ACCIONES DE LA PROMOCION */}
      {["DRAFT", "ACTIVE", "PAUSED"].includes(promotion.status) && (
        <div className="mt-5 flex justify-end border-t border-slate-700 pt-4">
          <button
            type="button"
            disabled={changingStatusId === promotion.id}
            onClick={() => onChangeStatus(promotion)}
            className={
              "inline-flex min-h-11 w-full items-center justify-center " +
              "gap-2 rounded-xl px-5 py-3 text-sm font-semibold " +
              "transition-colors disabled:cursor-not-allowed " +
              "disabled:opacity-50 sm:w-auto " +
              (promotion.status === "ACTIVE"
                ? "border border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                : "bg-[#007AFF] text-white hover:bg-blue-600")
            }
          >
            {changingStatusId === promotion.id ? (
              <>
                <RefreshCw size={17} className="animate-spin" />
                Procesando...
              </>
            ) : promotion.status === "ACTIVE" ? (
              "Pausar promoción"
            ) : promotion.status === "PAUSED" ? (
              "Reactivar promoción"
            ) : (
              "Activar promoción"
            )}
          </button>
        </div>
      )}

   </article>
  );
}

// ==========================================
// ADMINISTRACION DE PROMOCIONES
// ==========================================

export default function BeneficiosPromocionesPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showNewPromotionModal, setShowNewPromotionModal] = useState(false);
  const [changingStatusId, setChangingStatusId] = useState(null);

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "/beneficios/admin/promotions"
      );

      const data = response.data?.data ?? response.data;

      if (!Array.isArray(data)) {
        throw new Error("Respuesta inesperada del servidor");
      }

      setPromotions(data);
    } catch (err) {
      const serverMessage = err.response?.data?.message;

      setError(
        Array.isArray(serverMessage)
          ? serverMessage.join(" ")
          : typeof serverMessage === "string"
            ? serverMessage
            : "No fue posible consultar las promociones."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  // ==========================================
  // ACTIVAR, PAUSAR Y REACTIVAR PROMOCIONES
  // ==========================================

  const handleChangePromotionStatus = async (promotion) => {
    if (changingStatusId !== null) return;

    const isPausing = promotion.status === "ACTIVE";
    const action = isPausing ? "pause" : "activate";

    const actionLabel = isPausing
      ? "pausar"
      : promotion.status === "PAUSED"
        ? "reactivar"
        : "activar";

    const confirmed = window.confirm(
      `¿Deseas ${actionLabel} la promoción "${promotion.title}"?`
    );

    if (!confirmed) return;

    setChangingStatusId(promotion.id);
    setError("");
    setSuccess("");

    try {
      await api.post(
        `/beneficios/admin/promotions/${promotion.id}/${action}`
      );

      await loadPromotions();

      setSuccess(
        `La promoción "${promotion.title}" se ha ${
          isPausing
            ? "pausado"
            : promotion.status === "PAUSED"
              ? "reactivado"
              : "activado"
        } correctamente.`
      );
    } catch (err) {
      const serverMessage = err.response?.data?.message;

      setError(
        Array.isArray(serverMessage)
          ? serverMessage.join(" ")
          : typeof serverMessage === "string"
            ? serverMessage
            : "No fue posible cambiar el estado de la promoción."
      );
    } finally {
      setChangingStatusId(null);
    }
  };

  const filteredPromotions = useMemo(() => {
    const term = search.trim().toLowerCase();

    return promotions.filter((promotion) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        promotion.status === statusFilter;

      const matchesSearch =
        !term ||
        [
          promotion.title,
          promotion.description,
          promotion.merchant?.name,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(term)
          );

      return matchesStatus && matchesSearch;
    });
  }, [promotions, search, statusFilter]);

  const totalActive = promotions.filter(
    (promotion) => promotion.status === "ACTIVE"
  ).length;

  const totalDraft = promotions.filter(
    (promotion) => promotion.status === "DRAFT"
  ).length;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6 px-3 py-5 text-white sm:px-6 sm:py-8">

        {/* ENCABEZADO */}

        <div className="space-y-4">
          <Link
            to="/admin/beneficios"
            className="inline-flex min-h-11 items-center gap-2 text-sm text-sky-300 hover:text-sky-200"
          >
            <ArrowLeft size={17} />
            Volver a Beneficios
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Gift className="text-sky-400" size={28} />

                <h1 className="text-2xl font-bold sm:text-3xl">
                  Promociones
                </h1>
              </div>

              <p className="mt-2 text-sm text-slate-400">
                Administración de promociones y beneficios
                de los comercios aliados.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowNewPromotionModal(true)}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#007AFF] px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-600"
             >
               <Plus size={19} />
               Nueva promoción
             </button>
          </div>
        </div>

        {/* RESUMEN */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-5">
            <p className="text-sm text-slate-400">
              Total promociones
            </p>
            <p className="mt-2 text-3xl font-bold">
              {promotions.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-5">
            <p className="text-sm text-slate-400">
              Activas
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">
              {totalActive}
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-5">
            <p className="text-sm text-slate-400">
              Borradores
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-200">
              {totalDraft}
            </p>
          </div>
        </div>

        {/* CONFIRMACION */}

        {success && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
          >
            <CheckCircle2 size={20} className="shrink-0" />
            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Cerrar confirmación"
              className="ml-auto p-2"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* LISTADO */}

        <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Promociones registradas
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {loading
                  ? "Consultando promociones..."
                  : `${filteredPromotions.length} de ${promotions.length} promociones`}
              </p>
            </div>

            <button
              type="button"
              onClick={loadPromotions}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Actualizar
            </button>
          </div>

          {/* FILTROS */}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="relative">
              <Search
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Buscar promoción o comercio..."
                className="min-h-12 w-full rounded-xl border border-slate-600 bg-slate-950 py-3 pl-12 pr-4 text-base text-white outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="min-h-12 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-base text-white outline-none focus:border-sky-500"
            >
              <option value="ALL">Todos los estados</option>
              <option value="DRAFT">Borradores</option>
              <option value="ACTIVE">Activas</option>
              <option value="PAUSED">Pausadas</option>
              <option value="ENDED">Finalizadas</option>
            </select>
          </div>

          {/* ERRORES */}

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200"
            >
              <AlertCircle
                size={19}
                className="shrink-0"
              />
              <span>{error}</span>
            </div>
          )}

          {/* CARGA */}

          {loading && (
            <div className="flex items-center justify-center gap-3 py-14 text-slate-400">
              <RefreshCw
                size={22}
                className="animate-spin"
              />
              Consultando promociones...
            </div>
          )}

          {/* SIN RESULTADOS */}

          {!loading && !error && filteredPromotions.length === 0 && (
            <div className="py-14 text-center">
              <Gift
                size={42}
                className="mx-auto mb-4 text-slate-500"
              />

              <h3 className="text-lg font-semibold">
                No hay promociones para mostrar
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                {promotions.length === 0
                  ? "Todavía no existen promociones registradas."
                  : "No se encontraron promociones con los filtros seleccionados."}
              </p>
            </div>
          )}

          {/* PROMOCIONES */}

          {!loading && !error && filteredPromotions.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredPromotions.map((promotion) => (
                <PromotionCard
                  key={promotion.id}
                  promotion={promotion}
                  onChangeStatus={handleChangePromotionStatus}
                  changingStatusId={changingStatusId}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <NuevaPromocionModal
        open={showNewPromotionModal}
        onClose={() => setShowNewPromotionModal(false)}
        onCreated={async () => {
          await loadPromotions();
          setSuccess("Promoción creada correctamente en estado borrador.");
        }}
       />

    </AdminLayout>
  );
}
