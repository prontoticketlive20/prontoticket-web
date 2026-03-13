import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });

      const token =
        response.data?.access_token ||
        response.data?.token ||
        response.data?.data?.access_token ||
        response.data?.data?.token;

      if (!token) {
        console.error("Respuesta backend completa:", response.data);
        throw new Error("El backend no devolvió token.");
      }

      // ✅ guardar token
      localStorage.setItem("ptl_token", token);

      // ✅ opcional pero recomendado: pedir /auth/me para cachear nombre/rol
      try {
        const meRes = await api.get("/auth/me");
        const me = meRes.data?.data ?? meRes.data;

        const label = me?.name || me?.email || email;
        const role = me?.role || null;

        if (label) localStorage.setItem("ptl_user_name", label);
        if (role) localStorage.setItem("ptl_user_role", role);
      } catch (err) {
        // Si falla /auth/me no bloqueamos el login.
        // El Header lo intentará luego.
      }

      // 🚀 regresar al punto donde estaba el usuario
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Error login:", error.response?.data || error);
      setErrorMsg("Credenciales incorrectas o error de servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-white">Iniciar sesión</h2>
        <p className="text-sm text-white/60 mt-1">
          Accede para administrar tu compra y tus entradas.
        </p>

        {errorMsg ? (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {errorMsg}
          </div>
        ) : null}

        <form onSubmit={handleLogin} className="mt-5 space-y-3">
          <div>
            <label className="text-xs text-white/70">Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-white/30 outline-none focus:border-white/25"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="text-xs text-white/70">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-white/30 outline-none focus:border-white/25"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white text-black font-medium py-2 hover:bg-white/90 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full rounded-lg border border-white/15 text-white/80 py-2 hover:bg-white/5"
            >
              Volver al inicio
            </button>

            <Link
              to="/register"
              state={{ from: location.state?.from || { pathname: "/" } }}
              className="w-full rounded-lg bg-white/5 border border-white/10 text-white/90 py-2 hover:bg-white/10 text-center"
            >
              Registro
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}