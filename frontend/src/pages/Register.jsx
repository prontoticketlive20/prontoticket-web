import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { User, Mail, Lock, ArrowLeft, Loader2, BadgeCheck } from "lucide-react";
import api from "../api/api";
import icono2026 from "../assets/icono_2026.png";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/account";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setErrorMsg("Debes ingresar tu nombre.");
      return;
    }

    if (!normalizedEmail) {
      setErrorMsg("Debes ingresar tu email.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        name: trimmedName,
        email: normalizedEmail,
        password,
      });

      const token =
        response.data?.access_token ||
        response.data?.token ||
        response.data?.data?.access_token ||
        response.data?.data?.token;

      const userData =
        response.data?.data ||
        response.data?.user ||
        response.data ||
        null;

      if (!token) {
        console.error("Respuesta backend completa:", response.data);
        throw new Error("El backend no devolvió token.");
      }

      localStorage.setItem("ptl_token", token);

      if (userData?.name) {
        localStorage.setItem("ptl_user_name", userData.name);
      } else {
        localStorage.setItem("ptl_user_name", trimmedName);
      }

      if (userData?.role) {
        localStorage.setItem("ptl_user_role", userData.role);
      } else {
        localStorage.setItem("ptl_user_role", "CUSTOMER");
      }

      navigate(from, { replace: true });
    } catch (error) {
      console.error("Error register:", error.response?.data || error);

      const backendMessage =
        error?.response?.data?.message ||
        error?.message ||
        "No se pudo completar el registro.";

      if (Array.isArray(backendMessage)) {
        setErrorMsg(backendMessage.join(", "));
      } else if (
        String(backendMessage).toLowerCase().includes("exists")
      ) {
        setErrorMsg("Ese email ya está registrado.");
      } else {
        setErrorMsg(String(backendMessage));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-[#111111] to-[#0c0c0c] p-6 sm:p-8 shadow-2xl shadow-black/40">
          <div className="text-center">
            <div className="mx-auto mb-5 w-20 h-20 rounded-[26px] bg-white/5 border border-white/10 flex items-center justify-center shadow-xl shadow-black/30">
              <img src={icono2026} alt="ProntoTicketLive" className="w-16 h-16 object-contain" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#007AFF]/10 border border-[#007AFF]/15 text-[#8ec5ff] text-xs font-semibold mb-4">
              <BadgeCheck size={14} />
              Registro seguro
            </div>

            <h2
              className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Crear cuenta
            </h2>

            <p className="text-sm text-white/55 mt-2 leading-relaxed max-w-sm mx-auto">
              Regístrate para comprar, administrar y acceder fácilmente a tus entradas desde cualquier dispositivo.
            </p>
          </div>

          {errorMsg ? (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMsg}
            </div>
          ) : null}

          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
              <label className="text-xs text-white/65">Nombre</label>
              <div className="mt-1.5 relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-[#007AFF]/40 focus:bg-white/[0.06] transition-all"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/65">Email</label>
              <div className="mt-1.5 relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-[#007AFF]/40 focus:bg-white/[0.06] transition-all"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/65">Password</label>
              <div className="mt-1.5 relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-[#007AFF]/40 focus:bg-white/[0.06] transition-all"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/65">Confirmar password</label>
              <div className="mt-1.5 relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-[#007AFF]/40 focus:bg-white/[0.06] transition-all"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-semibold py-3.5 hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[#007AFF]/20"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <span>Crear cuenta</span>
              )}
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full rounded-2xl border border-white/15 text-white/80 py-3 hover:bg-white/5 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                <span>Volver</span>
              </button>

              <Link
                to="/login"
                state={{ from: location.state?.from || { pathname: "/" } }}
                className="w-full rounded-2xl bg-white/5 border border-white/10 text-white/90 py-3 hover:bg-white/10 text-center"
              >
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}