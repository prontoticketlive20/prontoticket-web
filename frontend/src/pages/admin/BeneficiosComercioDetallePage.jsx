
import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Store,
  MapPin,
  Mail,
  Phone,
  Globe,
  Gift,
  Users,
  RefreshCw,
  AlertCircle,
  CalendarDays,
  Image as ImageIcon,
  Pencil,
  Save,
  X,
  CheckCircle2,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/api";

const FIELDS = [
  { key: "name", label: "Nombre del comercio", required: true },
  { key: "description", label: "Descripción", multiline: true },
  { key: "address", label: "Dirección" },
  { key: "city", label: "Ciudad" },
  { key: "country", label: "País" },
  { key: "email", label: "Correo electrónico", type: "email" },
  { key: "phone", label: "Teléfono", type: "tel" },
  { key: "website", label: "Sitio web", type: "url" },
  { key: "logoUrl", label: "URL del logotipo", type: "url" },
];

function getErrorMessage(error) {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(". ");
  }

  if (typeof message === "string") {
    return message;
  }

  return "No fue posible completar la operación.";
}

function formatDate(value) {
  if (!value) return "No disponible";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No disponible";

  return date.toLocaleDateString("es-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        status === "ACTIVE"
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-slate-700 text-slate-300"
      }`}
    >
      {status === "ACTIVE" ? "Activo" : status || "Sin estado"}
    </span>
  );
}

function InfoItem({ icon: Icon, label, children }) {
  return (
    <div className="flex min-w-0 items-start gap-3 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10">
        <Icon size={19} className="text-sky-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400">{label}</p>
        <div className="mt-1 break-words text-sm text-white">
          {children || (
            <span className="text-slate-500">No registrado</span>
          )}
        </div>
      </div>
    </div>
  );
}

function MerchantEditForm({ merchant, onCancel, onSaved }) {
  const [form, setForm] = useState(() =>
    Object.fromEntries(
      FIELDS.map(({ key }) => [key, merchant[key] ?? ""])
    )
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const name = form.name.trim();

    if (name.length < 2 || name.length > 150) {
      setError("El nombre debe tener entre 2 y 150 caracteres.");
      return;
    }

    const payload = {};

    for (const { key } of FIELDS) {
      const value = form[key].trim();
      const original = merchant[key] ?? "";

      if (value === String(original).trim()) continue;

      if (key === "name") {
        payload.name = value;
      } else if (key === "email") {
        payload.email = value ? value.toLowerCase() : null;
      } else {
        payload[key] = value || null;
      }
    }

    if (Object.keys(payload).length === 0) {
      onCancel();
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.patch(
        `/beneficios/admin/merchants/${merchant.id}`,
        payload
      );
      await onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-sky-500/40 bg-slate-900 p-4 sm:p-6">
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Pencil size={20} className="text-sky-400" />
          Editar comercio
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Modifica los datos del comercio. Los campos vacíos
          opcionales se eliminarán cuando hayan cambiado.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {FIELDS.map(({ key, label, required, multiline, type }) => (
            <div
              key={key}
              className={multiline ? "md:col-span-2" : ""}
            >
              <label
                htmlFor={`merchant-edit-${key}`}
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                {label}
                {required && (
                  <span className="ml-1 text-red-400">*</span>
                )}
              </label>

              {multiline ? (
                <textarea
                  id={`merchant-edit-${key}`}
                  value={form[key]}
                  onChange={(event) =>
                    updateField(key, event.target.value)
                  }
                  disabled={saving}
                  rows={3}
                  className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-base text-white outline-none focus:border-sky-400 disabled:opacity-60"
                />
              ) : (
                <input
                  id={`merchant-edit-${key}`}
                  type={type || "text"}
                  value={form[key]}
                  onChange={(event) =>
                    updateField(key, event.target.value)
                  }
                  disabled={saving}
                  required={required}
                  minLength={key === "name" ? 2 : undefined}
                  maxLength={key === "name" ? 150 : undefined}
                  placeholder={
                    type === "url" ? "https://ejemplo.com" : ""
                  }
                  className="min-h-12 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-base text-white outline-none focus:border-sky-400 disabled:opacity-60"
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200"
          >
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-3 border-t border-slate-700 bg-slate-900 px-4 py-4 sm:static sm:mx-0 sm:flex-row sm:justify-end sm:px-0">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-600 px-5 py-3 font-medium text-slate-200 disabled:opacity-60"
          >
            <X size={18} />
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {saving ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default function BeneficiosComercioDetallePage() {
  const { id } = useParams();

  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState("");

  const loadMerchant = useCallback(async () => {
    const response = await api.get(
      `/beneficios/admin/merchants/${id}`
    );

    const data = response.data?.data ?? response.data;

    if (!data || typeof data !== "object" || !data.id) {
      throw new Error("Respuesta inesperada del servidor.");
    }

    setMerchant(data);
  }, [id]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setEditing(false);
    setSuccess("");
    setMerchant(null);

    api
      .get(`/beneficios/admin/merchants/${id}`)
      .then((response) => {
        if (!active) return;
        const data = response.data?.data ?? response.data;
        if (!data?.id) {
          throw new Error("Respuesta inesperada del servidor.");
        }
        setMerchant(data);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleSaved = async () => {
    await loadMerchant();
    setEditing(false);
    setSuccess("Los datos del comercio se actualizaron correctamente.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const promotions = Array.isArray(merchant?.promotions)
    ? merchant.promotions
    : [];

  const users = Array.isArray(merchant?.users)
    ? merchant.users
    : [];

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6 px-3 py-5 text-white sm:px-6 sm:py-8">
        <Link
          to="/admin/beneficios/comercios"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-sky-300 hover:text-sky-200"
        >
          <ArrowLeft size={18} />
          Volver a Comercios
        </Link>

        {loading && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-10 text-slate-300">
            <RefreshCw size={20} className="animate-spin" />
            Cargando comercio...
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-5 text-sm text-red-200"
          >
            <AlertCircle size={20} className="shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && merchant && (
          <>
            {success && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200"
              >
                <CheckCircle2 size={20} className="shrink-0" />
                {success}
              </div>
            )}

            <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
                    {merchant.logoUrl ? (
                      <img
                        src={merchant.logoUrl}
                        alt={`Logotipo de ${merchant.name}`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Store size={30} className="text-sky-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h1 className="break-words text-2xl font-bold sm:text-3xl">
                      {merchant.name}
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                      Ficha del comercio aliado
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={merchant.status} />

                  {!editing && (
                    <button
                      type="button"
                      onClick={() => {
                        setSuccess("");
                        setEditing(true);
                      }}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500"
                    >
                      <Pencil size={17} />
                      Editar comercio
                    </button>
                  )}
                </div>
              </div>

              {merchant.description && (
                <p className="mt-5 border-t border-slate-700 pt-5 text-sm leading-relaxed text-slate-300">
                  {merchant.description}
                </p>
              )}
            </section>

            {editing ? (
              <MerchantEditForm
                key={merchant.id}
                merchant={merchant}
                onCancel={() => setEditing(false)}
                onSaved={handleSaved}
              />
            ) : (
              <>
                <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 sm:p-6">
                  <h2 className="mb-3 text-lg font-semibold">
                    Información general
                  </h2>

                  <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
                    <InfoItem icon={MapPin} label="Dirección">
                      {merchant.address}
                    </InfoItem>

                    <InfoItem icon={MapPin} label="Ciudad">
                      {merchant.city}
                    </InfoItem>

                    <InfoItem icon={MapPin} label="País">
                      {merchant.country}
                    </InfoItem>

                    <InfoItem icon={CalendarDays} label="Fecha de registro">
                      {formatDate(merchant.createdAt)}
                    </InfoItem>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 sm:p-6">
                  <h2 className="mb-3 text-lg font-semibold">
                    Información de contacto
                  </h2>

                  <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
                    <InfoItem icon={Mail} label="Correo electrónico">
                      {merchant.email ? (
                        <a
                          href={`mailto:${merchant.email}`}
                          className="break-all text-sky-300 hover:underline"
                        >
                          {merchant.email}
                        </a>
                      ) : null}
                    </InfoItem>

                    <InfoItem icon={Phone} label="Teléfono">
                      {merchant.phone ? (
                        <a
                          href={`tel:${merchant.phone}`}
                          className="text-sky-300 hover:underline"
                        >
                          {merchant.phone}
                        </a>
                      ) : null}
                    </InfoItem>

                    <InfoItem icon={Globe} label="Sitio web">
                      {merchant.website ? (
                        <a
                          href={merchant.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-sky-300 hover:underline"
                        >
                          {merchant.website}
                        </a>
                      ) : null}
                    </InfoItem>

                    <InfoItem icon={ImageIcon} label="URL del logotipo">
                      {merchant.logoUrl ? (
                        <a
                          href={merchant.logoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-sky-300 hover:underline"
                        >
                          Ver imagen
                        </a>
                      ) : null}
                    </InfoItem>
                  </div>
                </section>
              </>
            )}

            <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <Gift size={21} className="text-sky-400" />
                <h2 className="text-lg font-semibold">
                  Promociones asociadas ({promotions.length})
                </h2>
              </div>

              {promotions.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Este comercio todavía no tiene promociones registradas.
                </p>
              ) : (
                <div className="space-y-3">
                  {promotions.map((promotion) => (
                    <div
                      key={promotion.id}
                      className="rounded-xl border border-slate-700 bg-slate-800/60 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h3 className="font-semibold">
                          {promotion.title}
                        </h3>
                        <span className="rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-200">
                          {promotion.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        Registrada: {formatDate(promotion.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <Users size={21} className="text-sky-400" />
                <h2 className="text-lg font-semibold">
                  Usuarios asociados ({users.length})
                </h2>
              </div>

              {users.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Este comercio todavía no tiene usuarios asociados.
                </p>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="rounded-xl border border-slate-700 bg-slate-800/60 p-4"
                    >
                      <p className="break-all text-sm text-slate-300">
                        Usuario: {user.userId}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-700 px-3 py-1 text-xs">
                          {user.role}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            user.isActive
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {user.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
