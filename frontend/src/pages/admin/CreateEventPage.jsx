import React, { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Save, Image as ImageIcon, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import api, { getAuthToken, setAuthToken } from "../../api/api";
import AdminLayout from "../../components/admin/AdminLayout";

const CATEGORY_OPTIONS = [
  { value: "CONCERT", label: "Concert" },
  { value: "THEATER", label: "Theater" },
  { value: "SPORTS", label: "Sports" },
  { value: "FESTIVAL", label: "Festival" },
  { value: "OTHER", label: "Other" },
];

const SALE_TYPE_OPTIONS = [
  { value: "GENERAL", label: "General" },
  { value: "SEATED", label: "Seated" },
];

const FEATURED_ORDER_OPTIONS = [
  { value: "1", label: "Posición 1" },
  { value: "2", label: "Posición 2" },
  { value: "3", label: "Posición 3" },
];

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "FESTIVAL",
    saleType: "GENERAL",
    imageUrl: "",
    youtubeUrl: "",
    location: "",
    useExternalTicket: false,
    externalTicketUrl: "",
    startingPrice: "",
    ageLimit: "",
    doors: "",
    duration: "",
    producerEmail: "",
    producerPhone: "",
    isFeatured: false,
    featuredOrder: "",
    isSeason: false,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

        setForm((prev) => ({
          ...prev,
          producerEmail: prev.producerEmail || data?.email || "",
        }));
      } catch (e) {
        // no bloqueamos la pantalla por esto
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const handleChange = (field, value) => {
    setForm((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      if (field === "isFeatured" && !value) {
        next.featuredOrder = "";
      }

      return next;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (!form.title.trim()) {
        throw new Error("El título es obligatorio.");
      }

      if (!form.category) {
        throw new Error("Debes seleccionar una categoría.");
      }

      if (form.useExternalTicket && !form.externalTicketUrl.trim()) {
        throw new Error("Debes colocar la URL externa de venta.");
      }

      if (form.isFeatured && !form.featuredOrder) {
        throw new Error("Debes seleccionar la posición del evento destacado.");
      }

      const payload = new FormData();

      payload.append("title", form.title.trim());
      payload.append("description", form.description.trim());
      payload.append("category", form.category);
      payload.append("saleType", form.saleType);
      payload.append("youtubeUrl", form.youtubeUrl.trim());
      payload.append("location", form.location.trim());
      payload.append("useExternalTicket", String(Boolean(form.useExternalTicket)));
      payload.append("externalTicketUrl", form.externalTicketUrl.trim());
      payload.append(
        "startingPrice",
        form.startingPrice === "" ? "0" : String(Number(form.startingPrice))
      );
      payload.append("ageLimit", form.ageLimit.trim());
      payload.append("doors", form.doors.trim());
      payload.append("duration", form.duration.trim());
      payload.append("producerEmail", form.producerEmail.trim());
      payload.append("producerPhone", form.producerPhone.trim());
      payload.append("isFeatured", String(Boolean(form.isFeatured)));
      payload.append("featuredOrder", form.featuredOrder);
      payload.append("isSeason", String(Boolean(form.isSeason)));

      if (imageFile) {
        payload.append("image", imageFile);
      }

      const res = await api.post("/events", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const created = res.data?.data ?? res.data;

      setSuccessMsg("Evento creado correctamente.");

      setTimeout(() => {
        navigate("/admin");
      }, 900);

      return created;
    } catch (err) {
      const apiMessage =
        err?.response?.data?.message ||
        err?.message ||
        "No pude crear el evento.";
      setErrorMsg(Array.isArray(apiMessage) ? apiMessage.join(", ") : apiMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout user={user}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 text-[#007AFF] hover:underline text-sm mb-2"
            >
              <ArrowLeft size={16} />
              Volver al Dashboard
            </Link>

            <h1 className="text-2xl font-bold text-white">Crear Evento</h1>
            <p className="text-white/50 text-sm mt-1">
              Crea la ficha principal del evento. Luego pasamos a funciones, ticket types y Seats.io.
            </p>
          </div>
        </div>

        {errorMsg ? (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-red-200 text-sm">{errorMsg}</p>
          </div>
        ) : null}

        {successMsg ? (
          <div className="mb-4 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3">
            <p className="text-green-200 text-sm">{successMsg}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays size={18} className="text-white/70" />
              <div className="text-white font-semibold">Datos principales</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs text-white/60">Título *</label>
                <input
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Ej: Festival Musical Verano 2026"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-white/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-white/60">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={4}
                  placeholder="Describe el evento..."
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-white/20 resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-white/60">Categoría *</label>
                <select
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-white/20"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/60">Tipo de venta</label>
                <select
                  value={form.saleType}
                  onChange={(e) => handleChange("saleType", e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-white/20"
                >
                  {SALE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/60">Ubicación</label>
                <input
                  value={form.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="Ej: Orlando"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label className="text-xs text-white/60">Precio inicial</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.startingPrice}
                  onChange={(e) => handleChange("startingPrice", e.target.value)}
                  placeholder="Ej: 50"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label className="text-xs text-white/60">Edad mínima</label>
                <input
                  value={form.ageLimit}
                  onChange={(e) => handleChange("ageLimit", e.target.value)}
                  placeholder="Ej: 18+"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label className="text-xs text-white/60">Doors</label>
                <input
                  value={form.doors}
                  onChange={(e) => handleChange("doors", e.target.value)}
                  placeholder="Ej: 7:00 PM"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label className="text-xs text-white/60">Duración</label>
                <input
                  value={form.duration}
                  onChange={(e) => handleChange("duration", e.target.value)}
                  placeholder="Ej: 3 horas"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-white/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-white/60">YouTube URL</label>
                <input
                  value={form.youtubeUrl}
                  onChange={(e) => handleChange("youtubeUrl", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-white/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="inline-flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.useExternalTicket}
                    onChange={(e) => handleChange("useExternalTicket", e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-black/40"
                  />
                  <span className="text-sm text-white/80">
                    Usar link externo para la venta de entradas
                  </span>
                </label>
              </div>

              {form.useExternalTicket ? (
                <div className="md:col-span-2">
                  <label className="text-xs text-white/60">External Ticket URL</label>
                  <input
                    value={form.externalTicketUrl}
                    onChange={(e) => handleChange("externalTicketUrl", e.target.value)}
                    placeholder="https://ticketmaster.com/..."
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-white/20"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star size={18} className="text-[#FF9500]" />
              <div className="text-white font-semibold">Evento destacado</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="inline-flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => handleChange("isFeatured", e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-black/40"
                  />
                  <span className="text-sm text-white/80">
                    Mostrar este evento en la sección de destacados del Home
                  </span>
                </label>
              </div>

              {form.isFeatured ? (
                <div>
                  <label className="text-xs text-white/60">Posición destacada</label>
                  <select
                    value={form.featuredOrder}
                    onChange={(e) => handleChange("featuredOrder", e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-white/20"
                  >
                    <option value="">Selecciona una posición</option>
                    {FEATURED_ORDER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-white/40 mt-2">
                    Solo puede haber 3 destacados y cada posición debe ser única.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon size={18} className="text-white/70" />
              <div className="text-white font-semibold">Imagen y productor</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs text-white/60">Imagen del evento</label>

                <div className="mt-1 flex flex-col gap-3">
                  <label className="inline-flex w-fit items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 cursor-pointer">
                    <ImageIcon size={16} />
                    Seleccionar imagen
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  <p className="text-xs text-white/40">
                    Recomendado: 1200 x 630 px o mayor.
                  </p>

                  {imageFile ? (
                    <div className="text-sm text-white/70">
                      Archivo seleccionado: {imageFile.name}
                    </div>
                  ) : null}

                  {imagePreview ? (
                    <div className="w-full max-w-md rounded-xl overflow-hidden border border-white/10 bg-black/30">
                      <img
                        src={imagePreview}
                        alt="Vista previa"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60">Producer Email</label>
                <input
                  type="email"
                  value={form.producerEmail}
                  onChange={(e) => handleChange("producerEmail", e.target.value)}
                  placeholder="producer@email.com"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label className="text-xs text-white/60">Producer Phone</label>
                <input
                  value={form.producerPhone}
                  onChange={(e) => handleChange("producerPhone", e.target.value)}
                  placeholder="+1 555 123 4567"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-white/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="inline-flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isSeason}
                    onChange={(e) => handleChange("isSeason", e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-black/40"
                  />
                  <span className="text-sm text-white/80">
                    Este evento pertenece a una temporada
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link
              to="/admin"
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-semibold shadow-lg shadow-[#007AFF]/20 hover:brightness-110 disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? "Guardando..." : "Guardar evento"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}