import React, { useEffect, useState, useCallback } from "react";
import {
  Globe,
  Send,
  CheckCircle,
  Loader2,
  Copy,
} from "lucide-react";
import api from "../api/api";

import {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
} from "./ui/toast";

const PLATFORMS = [
  { key: "bandsintown", label: "Bandsintown" },
  { key: "songkick", label: "Songkick" },
  { key: "google", label: "Google Events" },
  { key: "facebook", label: "Facebook Events" },
  { key: "email", label: "Email Campaign" },
];

export default function DistributionPanel({ eventId }) {
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState([]);
  const [result, setResult] = useState(null);

  const [event, setEvent] = useState(null);
  const [fn, setFn] = useState(null);

  const [savedVenues, setSavedVenues] = useState([]);
  const [savedArtists, setSavedArtists] = useState([]);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastDesc, setToastDesc] = useState("");

  const showToast = (title, description = "") => {
    setToastTitle(title);
    setToastDesc(description);
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2500);
  };

  // 🔥 LOAD EVENT + FUNCTION
  useEffect(() => {
    if (!eventId) return;

    const loadData = async () => {
      try {
        const eventRes = await api.get(`/events/${eventId}`);
        const evt = eventRes.data?.data || eventRes.data;
        setEvent(evt);

        const fnRes = await api.get(`/event-functions/event/${eventId}`);
        const functions = fnRes.data?.data || [];

        if (functions.length > 0) {
          setFn(functions[0]);
        }
      } catch (err) {
        console.error("Error cargando datos", err);
      }
    };

    loadData();
  }, [eventId]);

  // 🔥 LOAD STATUS
  const loadStatus = useCallback(async () => {
    try {
      const res = await api.get(`/distribution/${eventId}`);
      const safeData = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
      setStatusData([...safeData]);
    } catch {
      setStatusData([]);
    }
  }, [eventId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // 🔥 DATA BASE
  const name = event?.title || "";
  const venue = fn?.venueName || "";
  const city = fn?.city || "";
  const date = fn?.date ? new Date(fn.date).toLocaleString() : "";

  // 🔥 URL
  const eventUrl = event?.slug
    ? `${window.location.origin}/evento/${event.slug}-${eventId}`
    : `${window.location.origin}/evento/${eventId}`;

  // 🔥 AUTOGUARDAR VENUE
  useEffect(() => {
    if (!venue) return;

    try {
      const saved = JSON.parse(localStorage.getItem("ptl_venues") || "[]");

      const exists = saved.find(
        (v) => v.venue === venue && v.city === city
      );

      if (!exists) {
        const updated = [...saved, { venue, city }];
        localStorage.setItem("ptl_venues", JSON.stringify(updated));
      }
    } catch {}
  }, [venue, city]);

  // 🔥 AUTOGUARDAR ARTISTA
  useEffect(() => {
    if (!name) return;

    try {
      const saved = JSON.parse(localStorage.getItem("ptl_artists") || "[]");

      const exists = saved.find((a) => a.name === name);

      if (!exists) {
        const updated = [...saved, { name }];
        localStorage.setItem("ptl_artists", JSON.stringify(updated));
      }
    } catch {}
  }, [name]);

  // 🔥 LOAD VENUES
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ptl_venues") || "[]");
      setSavedVenues(saved);
    } catch {
      setSavedVenues([]);
    }
  }, []);

  // 🔥 LOAD ARTISTS
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ptl_artists") || "[]");
      setSavedArtists(saved);
    } catch {
      setSavedArtists([]);
    }
  }, []);

  const togglePlatform = (key) => {
    setSelected((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text || "");
      showToast("Copiado", label);
    } catch {
      showToast("Error", "No se pudo copiar");
    }
  };

  const fullText = `
${name}

📍 ${venue} - ${city}
📅 ${date}

🎟 Tickets:
${eventUrl}
`;

  const handleDistribute = async () => {
    try {
      setLoading(true);
      setResult(null);

      const platforms = Object.keys(selected).filter((k) => selected[k]);

      if (platforms.length === 0) {
        showToast("Error", "Selecciona al menos una plataforma");
        return;
      }

      if (platforms.includes("facebook")) {
        await navigator.clipboard.writeText(fullText);
        window.open(
          "https://www.facebook.com/events/create/?ref_source=NEWSFEED",
          "_blank"
        );
        showToast("Facebook", "Pega los datos");
      }

      if (platforms.includes("bandsintown")) {
        window.open("https://artists.bandsintown.com", "_blank");
        showToast("Bandsintown", "Usa copiar campos");
      }

      if (platforms.includes("email")) {
        await api.post("/mail/send-event-campaign", {
          eventId,
          segment: "all",
        });
        showToast("Email", "Campaña enviada");
      }

      await api.post("/distribution", {
        eventId,
        platforms,
      });

      await loadStatus();
      setResult("success");
    } catch {
      setResult("error");
      showToast("Error", "Distribución fallida");
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (platform) => {
    return statusData.find((s) => s.platform === platform);
  };

  return (
    <ToastProvider>
      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

        <h2 className="text-white mb-4">🌍 Distribución del Evento</h2>

        {/* 🔥 ARTISTAS */}
        {savedArtists.length > 0 && (
          <div className="bg-zinc-800 p-4 rounded-xl mb-6">
            <h3 className="text-white mb-2">🎤 Artistas recientes</h3>

            <div className="flex flex-wrap gap-2">
              {savedArtists.map((a, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => copy(a.name, "Artista")}
                  className="bg-purple-700 hover:bg-purple-600 text-xs px-3 py-1 rounded-full text-white"
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 🔥 VENUES */}
        {savedVenues.length > 0 && (
          <div className="bg-zinc-800 p-4 rounded-xl mb-6">
            <h3 className="text-white mb-2">⚡ Lugares usados</h3>

            <div className="flex flex-wrap gap-2">
              {savedVenues.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    copy(`${v.venue} - ${v.city}`, "Venue")
                  }
                  className="bg-zinc-700 text-xs px-3 py-1 rounded-full text-white"
                >
                  {v.venue} ({v.city})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* COPY PANEL */}
        <div className="bg-zinc-800 p-4 rounded-xl mb-6">
          <CopyField label="Nombre" value={name} onCopy={copy} />
          <CopyField label="Venue" value={venue} onCopy={copy} />
          <CopyField label="Ciudad" value={city} onCopy={copy} />
          <CopyField label="Fecha" value={date} onCopy={copy} />
          <CopyField label="Link" value={eventUrl} onCopy={copy} />
        </div>

        {/* PLATAFORMAS */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {PLATFORMS.map((p) => {
            const status = getStatus(p.key);

            return (
              <div key={p.key} className="border p-3 rounded-xl">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={p.key === "google" ? true : !!selected[p.key]}
                    onChange={() =>
                      p.key !== "google" && togglePlatform(p.key)
                    }
                    disabled={p.key === "google"}
                  />

                  <span className="text-white">{p.label}</span>

                  {p.key === "google" && (
                    <span className="text-green-400 text-xs">
                      (Automático)
                    </span>
                  )}

                  {p.key === "facebook" && (
                    <span className="text-green-400 text-xs">
                      (Manual)
                    </span>
                  )}
                </label>

                <div className="mt-2">
                  {status?.status === "success" && (
                    <CheckCircle className="text-green-400" size={16} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleDistribute}
          className="w-full bg-blue-600 text-white py-3 rounded-xl"
        >
          {loading ? "Distribuyendo..." : "Distribuir evento"}
        </button>

        {result === "success" && (
          <div className="text-green-400 mt-4">
            Distribución completada
          </div>
        )}
      </div>

      <Toast open={toastOpen}>
        <ToastTitle>{toastTitle}</ToastTitle>
        <ToastDescription>{toastDesc}</ToastDescription>
      </Toast>
      <ToastViewport />
    </ToastProvider>
  );
}

function CopyField({ label, value, onCopy }) {
  return (
    <div className="flex justify-between bg-zinc-900 p-2 rounded-lg">
      <span className="text-xs text-gray-300">
        {label}: {value || "-"}
      </span>
      <button
        type="button"
        onClick={() => onCopy(value, label)}
      >
        <Copy size={14} className="text-blue-400" />
      </button>
    </div>
  );
}