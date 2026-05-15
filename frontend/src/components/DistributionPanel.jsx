import React, { useEffect, useState } from "react";
import {
  Globe,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import api from "../api/api";

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadStatus = async () => {
  try {
    const res = await api.get(`/distribution/${eventId}`);
    console.log("🔥 DATA BACKEND:", res.data);

    const safeData = Array.isArray(res.data)
      ? res.data
      : res.data?.data || [];

    console.log("✅ DATA PROCESADA:", safeData);

    setStatusData(safeData);
    setStatusData([...safeData]);

  } catch (err) {
    console.error("❌ Error cargando distribución", err);
    setStatusData([]); // 🔥 evita crash
  }
};

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (eventId) {
      loadStatus();
    }
  }, [eventId]);

  const togglePlatform = (key) => {
    setSelected((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDistribute = async () => {
    try {
      setLoading(true);
      setResult(null);

      const platforms = Object.keys(selected).filter((k) => selected[k]);

      if (platforms.length === 0) {
        alert("Selecciona al menos una plataforma");
        return;
      }

      await api.post("/distribution", {
         eventId,
         platforms,
      });

      await loadStatus();

      setResult("success");
    } catch (error) {
      console.error(error);
      setResult("error");
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (platform) => {
  if (!Array.isArray(statusData)) return null;
  return statusData.find((s) => s.platform === platform);
};

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="text-blue-400" />
        <h2 className="text-white font-semibold">
          Distribución del Evento 🌎
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {PLATFORMS.map((p) => {
          const status = getStatus(p.key);

          return (
            <div
              key={p.key}
              className="flex flex-col border border-zinc-700 rounded-xl p-3"
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!selected[p.key]}
                  onChange={() => togglePlatform(p.key)}
                />
                <span className="text-white text-sm">{p.label}</span>
              </label>

              <div className="mt-2 text-xs flex items-center gap-2">
                {status?.status === "success" && (
                  <>
                    <CheckCircle size={14} className="text-green-400" />
                    <span className="text-green-400">Publicado</span>
                  </>
                )}

                {status?.status === "error" && (
                  <>
                    <XCircle size={14} className="text-red-400" />
                    <span className="text-red-400">Error</span>
                  </>
                )}

                {status?.status === "pending" && (
                  <>
                    <Loader2
                      size={14}
                      className="animate-spin text-yellow-400"
                    />
                    <span className="text-yellow-400">Procesando</span>
                  </>
                )}

                {status?.externalUrl && (
                  <a
                    href={status.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:underline"
                  >
                    Ver <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleDistribute}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Distribuyendo...
          </>
        ) : (
          <>
            <Send size={18} />
            Distribuir evento
          </>
        )}
      </button>

      {/* 🔥 MENSAJES */}
      {result === "success" && (
        <div className="mt-4 text-green-400">
          Evento distribuido correctamente
        </div>
      )}

      {result === "error" && (
        <div className="mt-4 text-red-400">
          Error al distribuir el evento
        </div>
      )}
    </div>
  );
}