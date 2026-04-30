import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

export default function FunctionPricingPage() {
  const { functionId } = useParams();
  const navigate = useNavigate();

  const [pricing, setPricing] = useState([]);
  const [functionData, setFunctionData] = useState(null);
  const [saving, setSaving] = useState(false);

  const [discounts, setDiscounts] = useState([]);
  const [discountCode, setDiscountCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [savingDiscount, setSavingDiscount] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!functionId) return;

      try {
        const functionRes = await api.get(`/event-functions/${functionId}`);
        const func = functionRes.data?.data || functionRes.data || null;
        setFunctionData(func);

        const pricingRes = await api.get(
          `/function-ticket-types/function/${functionId}`
        );

        const pricingList = Array.isArray(pricingRes.data)
          ? pricingRes.data
          : pricingRes.data?.data || [];

        setPricing(
          pricingList.map((item) => ({
            ...item,
            price: item.price ?? "",
            available: item.available ?? ""
          }))
        );

       const discountsRes = await api.get(`/discounts?functionId=${functionId}`);

       setDiscounts(
          Array.isArray(discountsRes.data)
          ? discountsRes.data
          : discountsRes.data?.data || []
       );

      } catch (err) {
        console.error("Error loading pricing page", err);
      }
    };

    loadData();
  }, [functionId]);

  const handleFieldChange = (ticketTypeId, field, value) => {
    setPricing((prev) =>
      prev.map((item) =>
        item.ticketTypeId === ticketTypeId
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
        const price = Number(item.price || 0);
        const available = Number(item.available || 0);

        if (!item.isConfigured) {
          // 🔥 CREAR NUEVO
          if (price > 0) {
            await api.post(`/function-ticket-types`, {
              functionId,
              ticketTypeId: item.ticketTypeId,
              price,
              available
            });
          }
        } else {
          // 🔥 ACTUALIZAR EXISTENTE
          await api.patch(`/function-ticket-types/${item.id}`, {
            price,
            available
          });
        }
      }

      // Reload
      const pricingRes = await api.get(
        `/function-ticket-types/function/${functionId}`
      );

      const pricingList = Array.isArray(pricingRes.data)
        ? pricingRes.data
        : pricingRes.data?.data || [];

      setPricing(
        pricingList.map((item) => ({
          ...item,
          price: item.price ?? "",
          available: item.available ?? ""
        }))
      );
    } catch (err) {
      console.error("Error saving pricing", err);
    } finally {
      setSaving(false);
    }

  };


const createDiscountCode = async () => {
  if (!discountCode.trim()) {
    alert("Debes ingresar un código.");
    return;
  }

  if (!discountPercent || Number(discountPercent) <= 0) {
    alert("Debes ingresar un porcentaje mayor a 0.");
    return;
  }

  try {
    setSavingDiscount(true);

    await api.post("/discounts", {
      functionId,
      code: discountCode.trim().toUpperCase(),
      discount: Number(discountPercent),
    });

    setDiscountCode("");
    setDiscountPercent("");

    const discountsRes = await api.get(`/discounts?functionId=${functionId}`);

    setDiscounts(
      Array.isArray(discountsRes.data)
        ? discountsRes.data
        : discountsRes.data?.data || []
    );
  } catch (err) {
    console.error("Error creating discount", err);
    alert(err.response?.data?.message || "Error creando código de descuento");
  } finally {
    setSavingDiscount(false);
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
              <th className="text-left p-3">Estado</th>
            </tr>
          </thead>

          <tbody>
            {pricing.length === 0 && (
              <tr>
                <td colSpan="4" className="p-4 text-center text-white/40">
                  No hay ticket types disponibles
                </td>
              </tr>
            )}

            {pricing.map((item) => (
              <tr key={item.ticketTypeId} className="border-t border-white/10">
                <td className="p-3 font-medium">
                  {item.ticketType?.name || "Tipo"}
                </td>

                <td className="p-3">
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) =>
                      handleFieldChange(item.ticketTypeId, "price", e.target.value)
                    }
                    className="w-full bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
                  />
                </td>

                <td className="p-3">
                  <input
                    type="number"
                    value={item.available}
                    onChange={(e) =>
                      handleFieldChange(item.ticketTypeId, "available", e.target.value)
                    }
                    className="w-full bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
                  />
                </td>

                <td className="p-3">
                  {item.isConfigured ? (
                    <span className="text-green-400 text-sm">Activo</span>
                  ) : (
                    <span className="text-yellow-400 text-sm">Nuevo</span>
                  )}
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

         <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-4">
  <h3 className="text-base font-semibold mb-4">
    Códigos de Descuento
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
    <input
      placeholder="Código (Ej: VIP20)"
      value={discountCode}
      onChange={(e) => setDiscountCode(e.target.value)}
      className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
    />

    <input
      type="number"
      placeholder="% Descuento"
      value={discountPercent}
      onChange={(e) => setDiscountPercent(e.target.value)}
      className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
    />

    <button
      onClick={createDiscountCode}
      disabled={savingDiscount}
      className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm font-semibold disabled:opacity-60"
    >
      {savingDiscount ? "Guardando..." : "Crear Código"}
    </button>
  </div>

  <div className="space-y-2">
    {discounts.length === 0 && (
      <div className="text-white/40 text-sm">
        No hay códigos creados para esta función.
      </div>
    )}

    {discounts.map((item) => (
      <div
        key={item.id}
        className="flex items-center justify-between bg-black/30 border border-white/10 rounded-xl px-4 py-3"
      >
        <div>
          <div className="font-semibold text-white">
            {item.code}
          </div>

          <div className="text-sm text-white/60">
            {item.discount}% descuento
          </div>
        </div>

        <button
  onClick={async () => {
    try {
      await api.patch(`/discounts/${item.id}`, {
        isActive: !item.isActive,
      });

      const discountsRes = await api.get(
        `/discounts?functionId=${functionId}`
      );

      setDiscounts(
        Array.isArray(discountsRes.data)
          ? discountsRes.data
          : discountsRes.data?.data || []
      );
    } catch (err) {
      console.error(err);
    }
  }}
  className={`text-xs font-semibold px-3 py-1 rounded-full ${
    item.isActive
      ? "bg-green-600 hover:bg-green-500"
      : "bg-red-600 hover:bg-red-500"
  }`}
>
  {item.isActive ? "Activo" : "Inactivo"}
</button>

      </div>
    ))}
  </div>

</div>
</div>

 );
}