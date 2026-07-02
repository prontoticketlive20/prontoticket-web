import React, { useEffect, useState, useCallback } from "react";
import {
  CheckCircle,
  Loader2,
  Zap,
  BarChart3,
  Globe,
} from "lucide-react";
import api from "../api/api";

const PLATFORMS = [
  { key: "google", label: "Google" },
  { key: "facebook", label: "Facebook" },
  { key: "bandsintown", label: "Bandsintown" },
  { key: "email", label: "Email" },
];

export default function DistributionPanel({ eventId }) {
  const [selected, setSelected] = useState({});
  const [autoMode, setAutoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [platformStats, setPlatformStats] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [result, setResult] = useState(null);
  const [fbUrl, setFbUrl] = useState(null);
  const [fbText, setFbText] = useState(""); // 🔥 NUEVO

  const [event, setEvent] = useState(null);
  const [fn, setFn] = useState(null);

  const [fbPublished, setFbPublished] = useState(false);
  const [copied, setCopied] = useState(false);

  // ===============================
  // 🔥 GENERADOR DE TEXTO FACEBOOK
  // ===============================
  const generateFacebookText = () => {
  if (!event) return "";

  const eventUrl = `https://www.prontoticketlive.com/evento/${event.slug}-${event.id}`;

  return `🎟️ ${event.title}

📍 ${event.location || ""}
📅 ${
  fn?.date
    ? new Date(fn.date).toLocaleString()
    : ""
}

✨ Vive una experiencia única

🎫 Compra tus tickets aquí:
${eventUrl}
`;
};

  // ===============================
  // LOAD EVENT
  // ===============================
  useEffect(() => {
    if (!eventId) return;

    const loadData = async () => {
      const eventRes = await api.get(`/events/${eventId}`);
      const evt = eventRes.data?.data || eventRes.data;
      setEvent(evt);

      const fnRes = await api.get(`/event-functions/event/${eventId}`);
      const functions = fnRes.data?.data || [];

      if (functions.length > 0) {
        setFn(functions[0]);
      }
    };

    loadData();
  }, [eventId]);

  // ===============================
  // 🔥 RESTAURAR FB URL
  // ===============================
  useEffect(() => {
    if (!eventId) return;

    const savedFb = localStorage.getItem(`ptl_fb_share_${eventId}`);

    if (savedFb) {
      console.log("🔁 FB URL RESTAURADA:", savedFb);
      setFbUrl(savedFb);
    }
  }, [eventId]);

  // ===============================
  // STATUS
  // ===============================
  const loadStatus = useCallback(async () => {
    try {
      const res = await api.get(`/distribution/${eventId}`);
      setStatusData(res.data?.data || res.data || []);
    } catch {
      setStatusData([]);
    }
  }, [eventId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // ===============================
  // ANALYTICS
  // ===============================
  useEffect(() => {
    const loadStats = async () => {
      const res = await api.get(`/orders/analytics/platform/${eventId}`);
      setPlatformStats(res.data.data || []);
    };
    if (eventId) loadStats();
  }, [eventId]);

  // ===============================
  // AUTO MODE
  // ===============================
  useEffect(() => {
    if (autoMode) {
      const all = {};
      PLATFORMS.forEach((p) => (all[p.key] = true));
      setSelected(all);
    }
  }, [autoMode]);

  const togglePlatform = (key) => {
    setSelected((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getStatus = (platform) => {
    return statusData.find((s) => s.platform === platform);
  };

  // ===============================
  // 🔥 DISTRIBUTE (FIX REAL)
  // ===============================
  const handleDistribute = async () => {
    try {
      setLoading(true);

      setFbPublished(false);
      setCopied(false);
      setFbUrl(null);
      setFbText(""); // 🔥 limpiar texto
      localStorage.removeItem(`ptl_fb_share_${eventId}`);

      const platforms = autoMode
        ? PLATFORMS.map((p) => p.key)
        : Object.keys(selected).filter((k) => selected[k]);

      console.log("PLATFORMS A ENVIAR:", platforms);

      const res = await api.post("/distribution", {
        eventId,
        platforms,
      });

      const results = res.data?.results || [];

      console.log("RESULTS DISTRIBUTION:", results);

      const fb = results.find((r) => r.platform === "facebook");

      if (fb?.externalUrl) {
        setFbUrl(fb.externalUrl);

        localStorage.setItem(
          `ptl_fb_share_${eventId}`,
          fb.externalUrl
        );

        // 🔥 SOLO GUARDAMOS TEXTO (NO COPIAMOS)
        const text = generateFacebookText();
        setFbText(text);

        console.log("📋 TEXTO LISTO:", text);
      } else if (platforms.includes("facebook")) {
        const fallbackUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          window.location.href
        )}`;

        setFbUrl(fallbackUrl);

        localStorage.setItem(
          `ptl_fb_share_${eventId}`,
          fallbackUrl
        );

        const text = generateFacebookText();
        setFbText(text);
      }

      await loadStatus();
      setResult("success");
    } catch (error) {
      console.error("ERROR DISTRIBUTION:", error);
      setResult("error");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div className="bg-[#0f0f0f] p-5 rounded-2xl border border-white/10">
      <div className="mb-6">
        <h2 className="text-white text-lg font-semibold flex items-center gap-2">
          🌍 Distribución Inteligente
        </h2>
        <p className="text-sm text-white/50">
          Controla dónde se publica tu evento y mide resultados.
        </p>
      </div>

      <div className="mb-6 bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
        <div>
          <div className="text-white flex gap-2 text-sm items-center">
            <Zap size={16} /> Modo automático
          </div>
          <div className="text-xs text-white/50">
            Activa todas las plataformas con un solo clic
          </div>
        </div>

        <input
          type="checkbox"
          checked={autoMode}
          onChange={() => setAutoMode(!autoMode)}
          className="w-5 h-5"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {PLATFORMS.map((p) => {
          const active = selected[p.key];
          const status = getStatus(p.key);

          return (
  <div
    key={p.key}
    className={`p-3 rounded-xl border transition ${
      active
        ? "border-blue-500 bg-blue-500/10"
        : "border-white/10 bg-white/5"
    }`}
    onClick={() => !autoMode && togglePlatform(p.key)}
  >
    <div className="flex justify-between items-center">
      <span className="text-white text-sm">{p.label}</span>

      {status?.status === "success" && (
        <CheckCircle size={16} className="text-green-400" />
      )}
    </div>

    <div className="text-xs mt-1 text-white/40">
      {autoMode
        ? "Automático"
        : active
        ? "Seleccionado"
        : "No activo"}
    </div>

    {/* 🔥 ACCIONES SOLO FACEBOOK */}
    {p.key === "facebook" && fbUrl && (
      <div
        className="mt-3 flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
  window.open(fbUrl, "_blank");
  setFbPublished(true);
}}
          className={`w-full py-2 rounded-lg text-sm font-semibold transition ${
  fbPublished
    ? "bg-green-600"
    : "bg-blue-600 hover:bg-blue-700"
}`}
        >
          {fbPublished ? "Publicado ✅" : "Publicar"}
        </button>

        <button
          type="button"
          onClick={() => {
            try {
              const textarea = document.createElement("textarea");
              textarea.value = fbText;
              textarea.style.position = "fixed";
              textarea.style.opacity = "0";

              document.body.appendChild(textarea);
              textarea.focus();
              textarea.select();

              document.execCommand("copy");

              document.body.removeChild(textarea);

              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch (err) {
              console.error("❌ Error copiando:", err);
            }
          }}
          className="w-full bg-gray-700 hover:bg-gray-800 text-white py-2 rounded-lg text-sm font-semibold transition"
        >
          {copied ? "Copiado ✔" : "Copiar texto"}
        </button>
      </div>
    )}
  </div>
);
        })}
      </div>

      {platformStats.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-[#111] to-[#1a1a1a] border border-white/10 rounded-xl p-4">
          <h3 className="text-white text-sm flex items-center gap-2 mb-3">
            <BarChart3 size={16} /> Impacto por plataforma
          </h3>

          {platformStats.map((p, i) => {
            const sales = p?._count?._all || p?.sales || 0;

            return (
              <div key={i} className="flex justify-between text-sm text-white/70 py-1">
                <span className="capitalize">{p.platform}</span>
                <span className="font-bold text-white">
                  {sales} ventas
                </span>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={handleDistribute}
        className="w-full bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Distribuyendo...
          </>
        ) : (
          <>
            <Globe size={18} />
            Distribuir Evento
          </>
        )}
      </button>

      {result === "success" && (
        <div className="text-green-400 text-sm mt-4 text-center">
          ✔ Distribución completada
        </div>
      )}
    </div>
  );
}