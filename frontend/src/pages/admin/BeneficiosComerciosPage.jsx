
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Store,
  Plus,
  RefreshCw,
  Search,
  MapPin,
  Mail,
  Phone,
  Globe,
  AlertCircle,
  X,
  Save,
  CheckCircle2,
} from "lucide-react";

import { Link } from "react-router-dom";

import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/api";

// ==========================================
// CONFIGURACION DEL FORMULARIO
// ==========================================

const emptyMerchant = {
  name: "",
  description: "",
  address: "",
  city: "",
  country: "",
  email: "",
  phone: "",
  website: "",
  logoUrl: "",
};

const inputClass =
  "w-full min-h-12 rounded-xl border border-slate-600 " +
  "bg-slate-950 px-4 py-3 text-base text-white " +
  "placeholder:text-slate-500 outline-none " +
  "focus:border-sky-500 focus:ring-1 focus:ring-sky-500";

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  maxLength,
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-medium text-slate-200">
        {label}
        {required && (
          <span className="ml-1 text-red-400">*</span>
        )}
      </span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        className={inputClass}
      />
    </label>
  );
}

function StatusBadge({ status }) {
  const active = status === "ACTIVE";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-slate-700 text-slate-300"
      }`}
    >
      {active ? "Activo" : status || "Sin estado"}
    </span>
  );
}

// ==========================================
// FORMULARIO NUEVO COMERCIO
// ==========================================

function NewMerchantModal({
  onClose,
  onCreated,
}) {
  const [form, setForm] = useState({ ...emptyMerchant });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, saving]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    const name = form.name.trim();

    if (name.length < 2 || name.length > 150) {
      setError(
        "El nombre del comercio debe tener entre 2 y 150 caracteres."
      );
      return;
    }

    const payload = {
      name,
    };

    Object.entries(form).forEach(([key, value]) => {
      if (key === "name") return;

      const trimmedValue = value.trim();

      if (trimmedValue) {
        payload[key] = trimmedValue;
      }
    });

    if (payload.email) {
      payload.email = payload.email.toLowerCase();
    }

    setSaving(true);
    setError("");

    try {
      await api.post(
        "/beneficios/admin/merchants",
        payload
      );

      await onCreated();
    } catch (err) {
      const status = err.response?.status;
      const serverMessage = err.response?.data?.message;

      if (status === 409) {
        setError(
          "Ya existe un comercio registrado con este correo electrónico."
        );
      } else if (Array.isArray(serverMessage)) {
        setError(serverMessage.join(" "));
      } else if (typeof serverMessage === "string") {
        setError(serverMessage);
      } else {
        setError(
          "No fue posible registrar el comercio. Verifica los datos y la conexión."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 sm:p-5"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-merchant-title"
        className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#111827] text-white sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl sm:border sm:border-slate-700"
      >
        {/* ENCABEZADO */}

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-700 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Store
              size={23}
              className="shrink-0 text-sky-400"
            />

            <div className="min-w-0">
              <h2
                id="new-merchant-title"
                className="text-lg font-bold sm:text-xl"
              >
                Nuevo comercio
              </h2>

              <p className="text-xs text-slate-400">
                Registro de comercio aliado
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar formulario"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-600 hover:bg-slate-800 disabled:opacity-50"
          >
            <X size={21} />
          </button>
        </div>

        {/* FORMULARIO */}

        <form
          id="new-merchant-form"
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">

            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-sm text-slate-300">
              Completa la información del comercio.
              Los campos marcados con * son obligatorios.
              El comercio se registrará inicialmente como activo.
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200"
              >
                <AlertCircle
                  size={19}
                  className="shrink-0"
                />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              <div className="sm:col-span-2">
                <FormField
                  label="Nombre del comercio"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ej. Restaurante Demo"
                  required
                  maxLength={150}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">
                    Descripción
                  </span>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Descripción del comercio y sus servicios"
                    className={
                      inputClass +
                      " min-h-[100px] resize-y"
                    }
                  />
                </label>
              </div>

              <div className="sm:col-span-2">
                <FormField
                  label="Dirección"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Dirección del establecimiento"
                />
              </div>

              <FormField
                label="Ciudad"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Ej. Orlando"
              />

              <FormField
                label="País"
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Ej. USA"
              />

              <FormField
                label="Correo electrónico"
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                placeholder="contacto@comercio.com"
              />

              <FormField
                label="Teléfono"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                type="tel"
                placeholder="+1 407 555 0100"
              />

              <div className="sm:col-span-2">
                <FormField
                  label="Sitio web"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  type="url"
                  placeholder="https://www.comercio.com"
                />
              </div>

              <div className="sm:col-span-2">
                <FormField
                  label="URL del logotipo"
                  name="logoUrl"
                  value={form.logoUrl}
                  onChange={handleChange}
                  type="url"
                  placeholder="https://www.comercio.com/logo.png"
                />
              </div>

            </div>
          </div>

          {/* BOTONES INFERIORES */}

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-700 bg-[#111827] px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="min-h-12 rounded-xl border border-slate-600 px-6 py-3 font-semibold hover:bg-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#007AFF] px-6 py-3 font-semibold text-white hover:bg-[#0066DD] disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw
                  size={19}
                  className="animate-spin"
                />
              ) : (
                <Save size={19} />
              )}

              {saving
                ? "Guardando..."
                : "Guardar comercio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// PAGINA ADMINISTRACION DE COMERCIOS
// ==========================================

export default function BeneficiosComerciosPage() {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showNewMerchant, setShowNewMerchant] = useState(false);
  const [success, setSuccess] = useState("");

  const loadMerchants = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "/beneficios/admin/merchants"
      );

      const data = response.data?.data ?? response.data;

      if (!Array.isArray(data)) {
        throw new Error(
          "Respuesta inesperada del servidor"
        );
      }

      setMerchants(data);
    } catch (err) {
      const serverMessage = err.response?.data?.message;

      setError(
        typeof serverMessage === "string"
          ? serverMessage
          : "No fue posible consultar los comercios."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMerchants();
  }, [loadMerchants]);

  const filteredMerchants = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return merchants;

    return merchants.filter((merchant) =>
      [
        merchant.name,
        merchant.description,
        merchant.city,
        merchant.country,
        merchant.email,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(term)
        )
    );
  }, [merchants, search]);

  const handleCreated = async () => {
    setShowNewMerchant(false);
    setSearch("");
    setSuccess("Comercio registrado correctamente.");

    await loadMerchants();
  };

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
                <Store
                  className="text-sky-400"
                  size={28}
                />

                <h1 className="text-2xl font-bold sm:text-3xl">
                  Comercios
                </h1>
              </div>

              <p className="mt-2 text-sm text-slate-400">
                Administración de comercios aliados de
                ProntoTicket Beneficios.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSuccess("");
                setShowNewMerchant(true);
              }}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#007AFF] px-5 py-3 font-semibold text-white hover:bg-[#0066DD]"
            >
              <Plus size={19} />
              Nuevo comercio
            </button>
          </div>
        </div>

        {/* CONFIRMACION */}

        {success && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
          >
            <CheckCircle2
              size={20}
              className="shrink-0"
            />

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
                Comercios registrados
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {loading
                  ? "Consultando comercios..."
                  : `${filteredMerchants.length} de ${merchants.length} comercios`}
              </p>
            </div>

            <button
              type="button"
              onClick={loadMerchants}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  loading ? "animate-spin" : ""
                }
              />
              Actualizar
            </button>
          </div>

          {/* BUSQUEDA */}

          <div className="relative mt-5">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar por nombre, ciudad o correo..."
              aria-label="Buscar comercios"
              className="min-h-12 w-full rounded-xl border border-slate-600 bg-slate-950 py-3 pl-12 pr-4 text-base text-white outline-none focus:border-sky-500"
            />
          </div>

          {/* ERROR DE CONSULTA */}

          {error && (
            <div
              role="alert"
              className="mt-5 flex gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200"
            >
              <AlertCircle
                size={19}
                className="shrink-0"
              />

              <span>{error}</span>
            </div>
          )}

          {/* ESTADOS DEL LISTADO */}

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              Cargando comercios...
            </div>
          ) : !error && filteredMerchants.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              {search
                ? "No se encontraron comercios con esa búsqueda."
                : "Todavía no hay comercios registrados."}
            </div>
          ) : (
            !error && (
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredMerchants.map((merchant) => (
                  <article
                    key={merchant.id}
                    className="min-w-0 rounded-xl border border-slate-700 bg-slate-800/60 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="min-w-0 flex-1 break-words text-lg font-semibold">
                        {merchant.name}
                      </h3>

                      <StatusBadge
                        status={merchant.status}
                      />
                    </div>

                    {merchant.description && (
                      <p className="mt-3 text-sm text-slate-300">
                        {merchant.description}
                      </p>
                    )}

                    <div className="mt-4 space-y-3 text-sm text-slate-300">

                      {(merchant.city ||
                        merchant.country) && (
                        <div className="flex items-start gap-3">
                          <MapPin
                            size={17}
                            className="shrink-0 text-sky-400"
                          />

                          <span>
                            {[
                              merchant.city,
                              merchant.country,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}

                      {merchant.email && (
                        <div className="flex min-w-0 items-start gap-3">
                          <Mail
                            size={17}
                            className="shrink-0 text-sky-400"
                          />

                          <a
                            href={`mailto:${merchant.email}`}
                            className="break-all hover:text-sky-300"
                          >
                            {merchant.email}
                          </a>
                        </div>
                      )}

                      {merchant.phone && (
                        <div className="flex items-start gap-3">
                          <Phone
                            size={17}
                            className="shrink-0 text-sky-400"
                          />

                          <span className="break-all">
                            {merchant.phone}
                          </span>
                        </div>
                      )}

                      {merchant.website && (
                        <div className="flex min-w-0 items-start gap-3">
                          <Globe
                            size={17}
                            className="shrink-0 text-sky-400"
                          />

                          <a
                            href={merchant.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-sky-300 hover:underline"
                          >
                            Sitio web
                          </a>
                        </div>
                      )}

                    </div>

                    {/* ACCESO A FICHA DEL COMERCIO */}

                    <div className="mt-5 border-t border-slate-700 pt-4">
                      <Link
                        to={`/admin/beneficios/comercios/${merchant.id}`}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                      >
                        <Store size={18} />
                        Detalles del comercio
                      </Link>
                    </div>
                  </article>
                ))}
              
             </div>
            )
          )}
        </section>
      </div>

      {/* MODAL DE REGISTRO */}

      {showNewMerchant && (
        <NewMerchantModal
          onClose={() =>
            setShowNewMerchant(false)
          }
          onCreated={handleCreated}
        />
      )}
    </AdminLayout>
  );
}
