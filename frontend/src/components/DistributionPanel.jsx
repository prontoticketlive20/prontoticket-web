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
  { key: "whatsapp", label: "WhatsApp" },
  { key: "twitter", label: "Twitter / X" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "bandsintown", label: "Bandsintown" },
];

export default function DistributionPanel({ eventId }) {
  const [selected, setSelected] = useState({});
  const [autoMode, setAutoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [platformStats, setPlatformStats] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [result, setResult] = useState(null);

  const [event, setEvent] = useState(null);
  const [fn, setFn] = useState(null);

  const [readyPlatforms, setReadyPlatforms] = useState([]);

  // 🔥 NUEVOS ESTADOS
  const [copiedPlatforms, setCopiedPlatforms] = useState([]);
  const [publishedPlatforms, setPublishedPlatforms] = useState([]);

  // 🔥 TOAST
  const [toast, setToast] = useState("");

  // ===============================
  // GENERADOR TEXTO
  // ===============================
  const generateText = (platform) => {
  if (!event) return "";

  const baseUrl = `https://www.prontoticketlive.com/evento/${event.slug}-${event.id}`;
  const url = `${baseUrl}?source=${platform || "web"}`;

  return `🎟️ ${event.title}

📍 ${event.location || ""}
📅 ${fn?.date ? new Date(fn.date).toLocaleString() : ""}

✨ Vive una experiencia única

🎫 Compra tus tickets aquí:
${url}`;
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
  // COPY + ESTADO
  // ===============================
  const copyText = (platform) => {
    const text = generateText(platform);

    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);

    setToast("✔ Texto copiado");
    setTimeout(() => setToast(""), 2000);

    setCopiedPlatforms((prev) => [...new Set([...prev, platform])]);
  };

  // ===============================
  // HANDLERS
  // ===============================
  const handlePublish = (platform) => {
    const text = generateText(platform);

    if (platform === "facebook") {
      window.open("https://www.facebook.com/sharer/sharer.php", "_blank");
    }

    if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }

    if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
        "_blank"
      );
    }

    if (platform === "instagram") {
      window.open("https://www.instagram.com/", "_blank");
    }

    if (platform === "tiktok") {
      window.open("https://www.tiktok.com/upload", "_blank");
    }

    // 🔥 marcar como publicado
    setPublishedPlatforms((prev) => [...new Set([...prev, platform])]);
  };

  // ===============================
  // DISTRIBUTE
  // ===============================
  const handleDistribute = async () => {
    try {
      setLoading(true);

      const platforms = autoMode
        ? PLATFORMS.map((p) => p.key)
        : Object.keys(selected).filter((k) => selected[k]);

      await api.post("/distribution", {
        eventId,
        platforms,
      });

      setReadyPlatforms(platforms);

      await loadStatus();
      setResult("success");
    } catch {
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
      <h2 className="text-white text-lg font-semibold mb-4">
        🌍 Distribución Inteligente
      </h2>

      {/* TOAST */}
      {toast && (
        <div className="mb-4 text-center">
          <div className="inline-block bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
            {toast}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        {PLATFORMS.map((p) => {
          const active = selected[p.key];
          const status = getStatus(p.key);
          const isReady = readyPlatforms.includes(p.key);

          return (
            <div
              key={p.key}
              className={`p-3 rounded-xl border ${
                active
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-white/10 bg-white/5"
              }`}
              onClick={() => togglePlatform(p.key)}
            >
              <div className="flex justify-between">
                <span className="text-white text-sm">{p.label}</span>

                {status?.status === "success" && (
                  <CheckCircle size={14} className="text-green-400" />
                )}
              </div>

              {/* 🔥 ESTADO VISUAL */}
              <div className="text-xs mt-1 text-white/40">
                {isReady && "✔ Listo para publicar"}
                {copiedPlatforms.includes(p.key) && " • Texto copiado"}
                {publishedPlatforms.includes(p.key) && " • Publicado"}
              </div>

              {isReady && (
                <div
                  className="mt-3 flex flex-col gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => copyText(p.key)}
                    className="bg-gray-700 hover:bg-gray-800 text-white py-2 rounded-lg text-sm"
                  >
                    Copiar texto
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePublish(p.key)}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm"
                  >
                    Publicar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleDistribute}
        className="w-full bg-blue-600 py-3 rounded-xl text-white"
      >
        {loading ? "Distribuyendo..." : "Distribuir Evento"}
      </button>

      {result === "success" && (
        <div className="text-green-400 mt-3 text-center">
          ✔ Distribución completada
        </div>
      )}
    </div>
  );
}