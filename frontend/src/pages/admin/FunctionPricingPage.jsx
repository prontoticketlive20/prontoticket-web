import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

export default function FunctionPricingPage() {
  const { functionId } = useParams();
  const navigate = useNavigate();

  const [pricing, setPricing] = useState([]);
  const [functionData, setFunctionData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!functionId) return;

      try {
        const functionRes = await api.get(`/event-functions/${functionId}`);
        const func = functionRes.data?.data || functionRes.data || null;
        setFunctionData(func);

        const pricingRes = await api.get(`/function-ticket-types/function/${functionId}`);
        const pricingList = Array.isArray(pricingRes.data)
          ? pricingRes.data
          : (pricingRes.data?.data || []);

        setPricing(
          pricingList.map((item) => ({
            ...item,
            price: item.price ?? 0,
            available: item.available ?? 0
          }))
        );
      } catch (err) {
        console.error("Error loading pricing page", err);
      }
    };

    loadData();
  }, [functionId]);

  const handleFieldChange = (id, field, value) => {
    setPricing((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value
            }
          : item
      )
    );
  };

  const saveAllChanges = async () => {
    try {
      setSaving(true);

      for (const item of pricing) {
        await api.patch(`/function-ticket-types/${item.id}`, {
          price: Number(item.price),
          available: Number(item.available)
        });
      }

      const pricingRes = await api.get(`/function-ticket-types/function/${functionId}`);
      const pricingList = Array.isArray(pricingRes.data)
        ? pricingRes.data
        : (pricingRes.data?.data || []);

      setPricing(
        pricingList.map((item) => ({
          ...item,
          price: item.price ?? 0,
          available: item.available ?? 0
        }))
      );
    } catch (err) {
      console.error("Error saving pricing", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 text-white">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-blue-400 hover:text-blue-300"
      >
        ← Volver a funciones
      </button>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          Pricing de la Función
        </h2>

        {functionData && (
          <p className="text-white/60 text-sm mt-1">
            {new Date(functionData.date).toLocaleString()} • {functionData.venueName}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121212] overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left p-3">Tipo</th>
              <th className="text-left p-3">Precio</th>
              <th className="text-left p-3">Inventario</th>
            </tr>
          </thead>

          <tbody>
            {pricing.length === 0 && (
              <tr>
                <td colSpan="3" className="p-4 text-center text-white/40">
                  No hay pricing configurado para esta función
                </td>
              </tr>
            )}

            {pricing.map((item) => (
              <tr key={item.id} className="border-t border-white/10">
                <td className="p-3 font-medium">
                  {item.ticketType?.name || "Tipo"}
                </td>

                <td className="p-3">
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) =>
                      handleFieldChange(item.id, "price", e.target.value)
                    }
                    className="w-full bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
                  />
                </td>

                <td className="p-3">
                  <input
                    type="number"
                    value={item.available}
                    onChange={(e) =>
                      handleFieldChange(item.id, "available", e.target.value)
                    }
                    className="w-full bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pricing.length > 0 && (
        <div className="mt-6">
          <button
            onClick={saveAllChanges}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-500 px-5 py-2 rounded text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}
    </div>
  );
}