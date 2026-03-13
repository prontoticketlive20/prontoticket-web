import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";

export default function EventTicketTypesPage() {

  const { eventId } = useParams();

  const [ticketTypes, setTicketTypes] = useState([]);
  const [name, setName] = useState("");
  const [serviceFee, setServiceFee] = useState("");

  const loadTicketTypes = async () => {

    try {

      const res = await api.get(`/ticket-types/event/${eventId}`);
      setTicketTypes(res.data?.data || []);

    } catch (err) {

      console.error("Error loading ticket types", err);
      setTicketTypes([]);

    }

  };

  useEffect(() => {

    if (eventId) loadTicketTypes();

  }, [eventId]);

  const createTicketType = async () => {

    try {

      await api.post("/ticket-types", {
        eventId,
        name,
        serviceFee: Number(serviceFee)
      });

      setName("");
      setServiceFee("");

      loadTicketTypes();

    } catch (err) {

      console.error("Error creating ticket type", err);

    }

  };

  const deleteTicketType = async (id) => {

    if (!window.confirm("¿Eliminar este tipo de ticket?")) return;

    try {

      await api.delete(`/ticket-types/${id}`);
      loadTicketTypes();

    } catch (err) {

      console.error("Error deleting ticket type", err);

    }

  };

  return (

    <div className="p-6 text-white">

      <div className="mb-6">

        <h2 className="text-xl font-semibold">
          Ticket Types ({ticketTypes.length})
        </h2>

      </div>

      {/* FORM */}

      <div className="flex gap-3 mb-6">

        <input
          placeholder="Nombre (General, VIP...)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
        />

        <input
          type="number"
          placeholder="Service Fee"
          value={serviceFee}
          onChange={(e) => setServiceFee(e.target.value)}
          className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
        />

        <button
          onClick={createTicketType}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm"
        >
          Crear Ticket Type
        </button>

      </div>

      {/* TABLE */}

      <table className="w-full border border-white/10 rounded overflow-hidden">

        <thead className="bg-white/5">

          <tr>
            <th className="text-left p-3">Nombre</th>
            <th className="text-left p-3">Service Fee</th>
            <th className="text-left p-3">Acciones</th>
          </tr>

        </thead>

        <tbody>

          {ticketTypes.length === 0 && (

            <tr>
              <td colSpan="3" className="p-4 text-white/40 text-center">
                Este evento aún no tiene Ticket Types
              </td>
            </tr>

          )}

          {ticketTypes.map((t) => (

            <tr key={t.id} className="border-t border-white/10">

              <td className="p-3">
                {t.name}
              </td>

              <td className="p-3">
                ${t.serviceFee}
              </td>

              <td className="p-3">

                <button
                  onClick={() => deleteTicketType(t.id)}
                  className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm"
                >
                  Eliminar
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}