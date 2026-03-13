import api from "../api/api";

// Crear orden guest (checkout)
export async function createGuestOrder(payload) {
  const res = await api.post("/orders/guest", payload);
  return res.data; // { success, data: { orderId, order, tickets } }
}

// Buscar orden por ID (confirmación)
export async function fetchOrderById(orderId) {
  const res = await api.get(`/orders/${orderId}`);
  return res.data; // { success, data: order }
}
