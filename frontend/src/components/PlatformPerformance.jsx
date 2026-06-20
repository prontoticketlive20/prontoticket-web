import React from "react";
import { BarChart3 } from "lucide-react";

const PLATFORM_META = {
  facebook: { label: "Facebook", color: "bg-blue-500" },
  google: { label: "Google", color: "bg-green-500" },
  bandsintown: { label: "Bandsintown", color: "bg-purple-500" },
  songkick: { label: "Songkick", color: "bg-pink-500" },
  email: { label: "Email", color: "bg-yellow-500" },
  web: { label: "Directo", color: "bg-zinc-500" },
};

export default function PlatformPerformance({ data = [] }) {
  if (!data.length) return null;

  // 🔥 Transformar data
  const total = data.reduce((acc, item) => acc + item.sales, 0);

  const normalized = data.map((item) => {
    const key = item.platform || "web";
    const meta = PLATFORM_META[key] || {
      label: key,
      color: "bg-zinc-500",
    };

    const value = item.sales;
    const revenue = item.revenue || 0;
    const percent = total > 0 ? Math.round((value / total) * 100) : 0;

    return {
      key,
      label: meta.label,
      color: meta.color,
      value,
      percent,
      revenue, // 🔥 IMPORTANTE
      };
    });

  // 🔥 Ordenar de mayor a menor
  normalized.sort((a, b) => b.value - a.value);

  return (
    <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 mt-6">
      
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="text-blue-400" size={18} />
        <h3 className="text-white text-lg font-semibold">
          Performance por Plataforma
        </h3>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {normalized.map((item) => (
          <div key={item.key}>
            
            {/* LABEL + VALUE */}
            <div className="flex justify-between text-sm mb-1">
              <span className="text-zinc-300">{item.label}</span>
              <span className="text-white font-medium">
                {item.value} ventas • ${item.revenue.toLocaleString()} ({item.percent}%)
              </span>
            </div>

            {/* BAR */}
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className={`${item.color} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* INSIGHT AUTOMÁTICO */}
      {normalized.length > 0 && (
        <div className="mt-6 bg-zinc-800 p-4 rounded-xl text-sm">
          <p className="text-green-400">
            🔥 {normalized[0].label} es tu canal más efectivo
          </p>
          {normalized[1] && (
            <p className="text-yellow-400 mt-1">
              ⚠️ {normalized[1].label} tiene oportunidad de crecimiento
            </p>
          )}
        </div>
      )}
    </div>
  );
}