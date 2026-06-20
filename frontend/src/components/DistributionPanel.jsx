import React, { useEffect, useState, useCallback } from "react";
import {
  CheckCircle,
  Loader2,
  Copy,
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

  const [event, setEvent] = useState(null);
  const [fn, setFn] = useState(null);

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
  // AUTO MODE → ACTIVA TODO
  // ===============================
  useEffect(() => {
    if (autoMode) {
      const all = {};
      PLATFORMS.forEach((p) => (all[p.key] = true));
      setSelected(all);
    }
  }, [autoMode]);

  // ===============================
  // HELPERS
  // ===============================
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

      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-white text-lg font-semibold flex items-center gap-2">
          🌍 Distribución Inteligente
        </h2>
        <p className="text-sm text-white/50">
          Controla dónde se publica tu evento y mide resultados.
        </p>
      </div>

      {/* AUTO MODE */}
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

      {/* PLATAFORMAS */}
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
            </div>
          );
        })}
      </div>

      {/* ANALYTICS */}
      {platformStats.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-[#111] to-[#1a1a1a] border border-white/10 rounded-xl p-4">
          <h3 className="text-white text-sm flex items-center gap-2 mb-3">
            <BarChart3 size={16} /> Impacto por plataforma
          </h3>

          {platformStats.map((p, i) => (
            <div key={i} className="flex justify-between text-sm text-white/70 py-1">
              <span className="capitalize">{p.platform}</span>
              <span className="font-bold text-white">
                {p._count._all} ventas
              </span>
            </div>
          ))}
        </div>
      )}

      {/* BOTÓN */}
      <button
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