import axios from "axios";

// ✅ Unificamos a ptl_token (el que usa tu Login/Header)
const TOKEN_KEY = "ptl_token";

export const setAuthToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// ✅ ESTA era la función que te están pidiendo AdminRoute/ProtectedRoute
export const clearAuth = () => {
  localStorage.removeItem("ptl_token");
  localStorage.removeItem("pt_token");
  localStorage.removeItem("token");
  localStorage.removeItem("access_token");

  // opcional (pero recomendado): limpia cache del usuario
  localStorage.removeItem("ptl_user_name");
  localStorage.removeItem("user_name");
  localStorage.removeItem("ptl_user_role");
};

// ✅ CRA/CRACO usa process.env.REACT_APP_...
// Si no existe, usamos localhost
const baseURL =
  process.env.REACT_APP_API_URL?.trim() || "http://localhost:3000/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
   
   console.log("TOKEN EN REQUEST:", token);   

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;