import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import api from "../api/api";
import icono2026 from "../assets/icono_2026.png";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [passwordExpired, setPasswordExpired] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotError, setForgotError] = useState("");

  const extractErrorData = (error) => {
    const data = error?.response?.data;

    return {
      status: error?.response?.status,
      code:
        data?.code ||
        data?.message?.code ||
        data?.error?.code ||
        null,
      message:
        data?.message?.message ||
        data?.message ||
        data?.error?.message ||
        data?.error ||
        null,
    };
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setPasswordExpired(false);
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const token =
        response.data?.access_token ||
        response.data?.token ||
        response.data?.data?.access_token ||
        response.data?.data?.token;

      if (!token) {
        console.error("Respuesta backend completa:", response.data);
        throw new Error("El backend no devolvió token.");
      }

      localStorage.setItem("ptl_token", token);

      try {
        const meRes = await api.get("/auth/me");
        const me = meRes.data?.data ?? meRes.data;

        const label = me?.name || me?.email || email;
        const role = me?.role || null;

        if (label) {
          localStorage.setItem("ptl_user_name", label);
        }

        if (role) {
          localStorage.setItem("ptl_user_role", role);
        }
      } catch (err) {
        console.error("No se pudo cargar /auth/me:", err);
      }

      navigate(from, {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Error login:",
        error?.response?.data || error
      );

      const { status, code, message } =
        extractErrorData(error);

      // ========================================================
      // PASSWORD EXPIRED
      // ========================================================

      if (code === "PASSWORD_EXPIRED") {
        setPasswordExpired(true);

        setErrorMsg(
          "Tu contraseña venció por seguridad. Debes actualizarla antes de continuar."
        );

        setForgotEmail(email.trim().toLowerCase());
        setForgotMsg("");
        setForgotError("");

        return;
      }

      // ========================================================
      // INVALID CREDENTIALS
      // ========================================================

      if (status === 401) {
        setErrorMsg(
          "El email o la contraseña ingresados no son correctos."
        );

        return;
      }

      // ========================================================
      // GENERIC ERROR
      // ========================================================

      if (typeof message === "string" && message.trim()) {
        setErrorMsg(message);
      } else {
        setErrorMsg(
          "No pudimos iniciar sesión en este momento. Intenta nuevamente."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setForgotMsg("");
    setForgotError("");

    const normalizedEmail = forgotEmail
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      setForgotError("Ingresa tu email.");
      return;
    }

    try {
      setForgotLoading(true);

      await api.post("/auth/forgot-password", {
        email: normalizedEmail,
      });

      setForgotMsg(
        "Si el email existe, enviaremos instrucciones para restablecer tu contraseña."
      );
    } catch (error) {
      console.error(
        "Error forgot password:",
        error?.response?.data || error
      );

      setForgotError(
        "No se pudo procesar la solicitud. Intenta nuevamente."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const openForgotPassword = () => {
    setShowForgot(true);

    setForgotEmail(
      email.trim().toLowerCase()
    );

    setForgotMsg("");
    setForgotError("");
  };

  const openExpiredPasswordReset = () => {
    setShowForgot(true);

    setForgotEmail(
      email.trim().toLowerCase()
    );

    setForgotMsg("");
    setForgotError("");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">

        <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-[#111111] to-[#0c0c0c] p-6 sm:p-8 shadow-2xl shadow-black/40">

          <div className="text-center">

            <div className="mx-auto mb-5 w-20 h-20 rounded-[26px] bg-white/5 border border-white/10 flex items-center justify-center shadow-xl shadow-black/30">

              <img
                src={icono2026}
                alt="ProntoTicketLive"
                className="w-16 h-16 object-contain"
              />

            </div>

            <h2
              className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
              style={{
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Iniciar sesión
            </h2>

            <p className="text-sm text-white/55 mt-2 leading-relaxed max-w-sm mx-auto">
              Accede para administrar tus compras,
              revisar tus entradas y continuar tu
              experiencia.
            </p>

          </div>

          {/* =====================================================
              PASSWORD EXPIRED
          ====================================================== */}

          {passwordExpired ? (
            <div className="mt-5 rounded-2xl border border-amber-400/25 bg-gradient-to-r from-amber-500/10 to-yellow-500/[0.04] px-4 py-4">

              <div className="flex gap-3">

                <div className="shrink-0 mt-0.5 w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">

                  <ShieldAlert
                    size={18}
                    className="text-amber-300"
                  />

                </div>

                <div className="flex-1">

                  <p className="text-sm font-semibold text-amber-100">
                    Actualización de seguridad requerida
                  </p>

                  <p className="text-sm text-amber-100/70 mt-1 leading-relaxed">
                    {errorMsg}
                  </p>

                  <button
                    type="button"
                    onClick={openExpiredPasswordReset}
                    className="mt-3 inline-flex items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/20 px-3.5 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/15 transition"
                  >
                    Actualizar contraseña
                  </button>

                </div>

              </div>

            </div>
          ) : errorMsg ? (

            <div className="mt-5 rounded-2xl border border-red-500/25 bg-gradient-to-r from-red-500/10 to-red-500/[0.04] px-4 py-4">

              <div className="flex gap-3">

                <div className="shrink-0 mt-0.5 w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">

                  <AlertTriangle
                    size={17}
                    className="text-red-300"
                  />

                </div>

                <div>

                  <p className="text-sm font-semibold text-red-100">
                    No pudimos iniciar sesión
                  </p>

                  <p className="text-sm text-red-200/80 mt-1 leading-relaxed">
                    {errorMsg}
                  </p>

                </div>

              </div>

            </div>

          ) : null}

          <form
            onSubmit={handleLogin}
            className="mt-6 space-y-4"
          >

            {/* EMAIL */}

            <div>

              <label className="text-xs text-white/65">
                Email
              </label>

              <div className="mt-1.5 relative">

                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                />

                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);

                    if (errorMsg) {
                      setErrorMsg("");
                    }

                    if (passwordExpired) {
                      setPasswordExpired(false);
                    }
                  }}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-[#007AFF]/40 focus:bg-white/[0.06] transition-all"
                  autoComplete="email"
                  required
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div>

              <label className="text-xs text-white/65">
                Password
              </label>

              <div className="mt-1.5 relative">

                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                />

                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);

                    if (errorMsg) {
                      setErrorMsg("");
                    }

                    if (passwordExpired) {
                      setPasswordExpired(false);
                    }
                  }}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-[#007AFF]/40 focus:bg-white/[0.06] transition-all"
                  autoComplete="current-password"
                  required
                />

              </div>

            </div>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-semibold py-3.5 hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[#007AFF]/20 transition-all"
            >

              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  <span>
                    Entrando...
                  </span>
                </>
              ) : (
                <span>
                  Entrar
                </span>
              )}

            </button>

            {/* FORGOT PASSWORD */}

            <div className="text-right">

              <button
                type="button"
                onClick={openForgotPassword}
                className="text-sm text-[#4da3ff] hover:text-white transition"
              >
                ¿Olvidaste tu contraseña?
              </button>

            </div>

            {/* NAVIGATION */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">

              <button
                type="button"
                onClick={() =>
                  navigate("/")
                }
                className="w-full rounded-2xl border border-white/15 text-white/80 py-3 hover:bg-white/5 flex items-center justify-center gap-2"
              >

                <ArrowLeft size={16} />

                <span>
                  Volver
                </span>

              </button>

              <Link
                to="/register"
                state={{
                  from:
                    location.state
                      ?.from || {
                      pathname: "/",
                    },
                }}
                className="w-full rounded-2xl bg-white/5 border border-white/10 text-white/90 py-3 hover:bg-white/10 text-center"
              >
                Registro
              </Link>

            </div>

          </form>

        </div>

      </div>

      {/* ========================================================
          PASSWORD RESET MODAL
      ========================================================= */}

      {showForgot && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">

          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#111111] p-6 shadow-2xl">

            <div className="absolute top-5 right-5 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">

              <img
                src={icono2026}
                alt="ProntoTicketLive"
                className="w-8 h-8 object-contain"
              />

            </div>

            <h3 className="text-xl font-bold text-white">
              {passwordExpired
                ? "Actualizar contraseña"
                : "Recuperar contraseña"}
            </h3>

            <p className="text-sm text-white/55 mt-2 leading-relaxed pr-12">

              {passwordExpired
                ? "Por seguridad, tu contraseña debe actualizarse. Te enviaremos un enlace para crear una nueva."
                : "Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña."}

            </p>

            {forgotMsg && (
              <div className="mt-4 rounded-2xl bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm text-green-200">
                {forgotMsg}
              </div>
            )}

            {forgotError && (
              <div className="mt-4 rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-200">
                {forgotError}
              </div>
            )}

            <form
              onSubmit={handleForgotPassword}
              className="mt-5 space-y-4"
            >

              <input
                type="email"
                value={forgotEmail}
                onChange={(e) =>
                  setForgotEmail(
                    e.target.value
                  )
                }
                placeholder="tu@email.com"
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-[#007AFF]/40"
                required
              />

              <div className="grid grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowForgot(false)
                  }
                  className="rounded-2xl border border-white/15 text-white/80 py-3 hover:bg-white/5"
                >
                  Cerrar
                </button>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="rounded-2xl bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-semibold py-3 hover:brightness-110 disabled:opacity-60"
                >

                  {forgotLoading
                    ? "Enviando..."
                    : passwordExpired
                    ? "Actualizar"
                    : "Enviar link"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}