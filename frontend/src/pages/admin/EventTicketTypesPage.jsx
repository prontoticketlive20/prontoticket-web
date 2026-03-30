import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";

export default function EventTicketTypesPage() {
  const { eventId } = useParams();

  const [ticketTypes, setTicketTypes] = useState([]);
  const [name, setName] = useState("");
  const [serviceFee, setServiceFee] = useState("");
  const [creating, setCreating] = useState(false);

  const [savingId, setSavingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadTicketTypes = useCallback(async () => {
  try {
    setErrorMsg("");
    const res = await api.get(`/ticket-types/event/${eventId}`);
    const raw = res.data?.data ?? res.data ?? [];
    const list = Array.isArray(raw) ? raw : [];

    setTicketTypes(
      list.map((item) => ({
        ...item,
        editName: item.name || "",
        editServiceFee:
          item.serviceFee !== null && item.serviceFee !== undefined
            ? String(item.serviceFee)
            : "0",
        editIsActive:
          item.isActive !== null && item.isActive !== undefined
            ? Boolean(item.isActive)
            : true,
      }))
    );
  } catch (err) {
    console.error("Error loading ticket types", err);
    setTicketTypes([]);
    setErrorMsg("No pude cargar los Ticket Types.");
  }
}, [eventId]);

  useEffect(() => {
  if (eventId) loadTicketTypes();
}, [eventId, loadTicketTypes]);

  const createTicketType = async () => {
    try {
      setCreating(true);
      setErrorMsg("");
      setSuccessMsg("");

      const trimmedName = name.trim();
      const fee = Number(serviceFee || 0);

      if (!trimmedName) {
        setErrorMsg("Debes indicar un nombre para el Ticket Type.");
        return;
      }

      if (Number.isNaN(fee) || fee < 0) {
        setErrorMsg("El Service Fee debe ser un número válido mayor o igual a 0.");
        return;
      }

      await api.post("/ticket-types", {
        eventId,
        name: trimmedName,
        serviceFee: fee,
        isActive: true,
      });

      setName("");
      setServiceFee("");
      setSuccessMsg("Ticket Type creado correctamente.");
      await loadTicketTypes();
    } catch (err) {
      console.error("Error creating ticket type", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "No pude crear el Ticket Type.";
      setErrorMsg(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setCreating(false);
    }
  };

  const updateTicketTypeField = (id, field, value) => {
    setTicketTypes((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const saveTicketType = async (ticketType) => {
    try {
      setSavingId(ticketType.id);
      setErrorMsg("");
      setSuccessMsg("");

      const trimmedName = String(ticketType.editName || "").trim();
      const fee = Number(ticketType.editServiceFee || 0);

      if (!trimmedName) {
        setErrorMsg("El nombre no puede estar vacío.");
        return;
      }

      if (Number.isNaN(fee) || fee < 0) {
        setErrorMsg("El Service Fee debe ser un número válido mayor o igual a 0.");
        return;
      }

      await api.patch(`/ticket-types/${ticketType.id}`, {
        name: trimmedName,
        serviceFee: fee,
        isActive: Boolean(ticketType.editIsActive),
      });

      setSuccessMsg("Ticket Type actualizado correctamente.");
      await loadTicketTypes();
    } catch (err) {
      console.error("Error updating ticket type", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "No pude actualizar el Ticket Type.";
      setErrorMsg(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSavingId(null);
    }
  };

  const deleteTicketType = async (id, hasSales) => {
    if (hasSales) {
      setErrorMsg(
        "Este Ticket Type ya tiene ventas. No se puede eliminar; debes desactivarlo."
      );
      return;
    }

    if (!window.confirm("¿Eliminar este Ticket Type?")) return;

    try {
      setErrorMsg("");
      setSuccessMsg("");

      await api.delete(`/ticket-types/${id}`);
      setSuccessMsg("Ticket Type eliminado correctamente.");
      await loadTicketTypes();
    } catch (err) {
      console.error("Error deleting ticket type", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "No pude eliminar el Ticket Type.";
      setErrorMsg(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

  return (
    <div className="p-6 text-white">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          Ticket Types ({ticketTypes.length})
        </h2>
      </div>

      {errorMsg ? (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMsg}
        </div>
      ) : null}

      {successMsg ? (
        <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          {successMsg}
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-[#121212] p-4 mb-6">
        <h3 className="text-base font-semibold mb-4">Crear Ticket Type</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            placeholder="Nombre (General, VIP...)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
          />

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Service Fee"
            value={serviceFee}
            onChange={(e) => setServiceFee(e.target.value)}
            className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
          />

          <button
            onClick={createTicketType}
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm font-semibold disabled:opacity-60"
          >
            {creating ? "Creando..." : "Crear Ticket Type"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121212] overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Service Fee</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-left p-3">Ventas</th>
              <th className="text-left p-3">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {ticketTypes.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-white/40 text-center">
                  Este evento aún no tiene Ticket Types
                </td>
              </tr>
            )}

            {ticketTypes.map((t) => {
              const hasSales = Boolean(t.hasSales);

              return (
                <tr key={t.id} className="border-t border-white/10 align-top">
                  <td className="p-3">
                    <input
                      value={t.editName}
                      onChange={(e) =>
                        updateTicketTypeField(t.id, "editName", e.target.value)
                      }
                      disabled={hasSales}
                      className="w-full bg-black/40 border border-white/10 px-3 py-2 rounded text-sm disabled:opacity-50"
                    />
                    {hasSales && (
                      <p className="text-[11px] text-amber-300 mt-1">
                        No se puede cambiar el nombre porque este Ticket Type ya tiene ventas.
                      </p>
                    )}
                  </td>

                  <td className="p-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={t.editServiceFee}
                      onChange={(e) =>
                        updateTicketTypeField(
                          t.id,
                          "editServiceFee",
                          e.target.value
                        )
                      }
                      className="w-full bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
                    />
                  </td>

                  <td className="p-3">
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(t.editIsActive)}
                        onChange={(e) =>
                          updateTicketTypeField(
                            t.id,
                            "editIsActive",
                            e.target.checked
                          )
                        }
                      />
                      <span
                        className={
                          t.editIsActive ? "text-green-400" : "text-white/50"
                        }
                      >
                        {t.editIsActive ? "Activo" : "Inactivo"}
                      </span>
                    </label>
                  </td>

                  <td className="p-3">
                    {hasSales ? (
                      <span className="inline-block px-2 py-1 rounded bg-amber-500/10 text-amber-300 text-xs">
                        Con ventas
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded bg-white/10 text-white/60 text-xs">
                        Sin ventas
                      </span>
                    )}
                  </td>

                  <td className="p-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => saveTicketType(t)}
                        disabled={savingId === t.id}
                        className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm disabled:opacity-60"
                      >
                        {savingId === t.id ? "Guardando..." : "Guardar"}
                      </button>

                      <button
                        onClick={() => deleteTicketType(t.id, hasSales)}
                        className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}