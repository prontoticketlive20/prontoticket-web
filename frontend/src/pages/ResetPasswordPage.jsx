import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Loader2 } from "lucide-react";
import api from "../api/api";
import icono2026 from "../assets/icono_2026.png";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();

    setMsg("");
    setErrorMsg("");

    if (!token) {
      setErrorMsg("El enlace no es válido o está incompleto.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/reset-password", {
        token,
        newPassword,
      });

      setMsg("Contraseña actualizada correctamente. Ya puedes iniciar sesión.");

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (error) {
      console.error("Error reset password:", error.response?.data || error);

      setErrorMsg(
        error.response?.data?.message ||
          "No se pudo restablecer la contraseña."
      );
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
              <img
                src={icono2026}
                alt="ProntoTicketLive"
                className="w-16 h-16 object-contain"
              />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Restablecer contraseña
            </h2>

            <p className="text-sm text-white/55 mt-2 leading-relaxed max-w-sm mx-auto">
              Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.
            </p>
          </div>

          {msg && (
            <div className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
              {msg}
            </div>
          )}

          {errorMsg && (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleReset} className="mt-6 space-y-4">
            <div>
              <label className="text-xs text-white/65">
                Nueva contraseña
              </label>

              <div className="mt-1.5 relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                />

                <input
                  type="password"
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-[#007AFF]/40"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/65">
                Confirmar contraseña
              </label>

              <div className="mt-1.5 relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                />

                <input
                  type="password"
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-[#007AFF]/40"
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
                  <span>Actualizando...</span>
                </>
              ) : (
                <span>Actualizar contraseña</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full rounded-2xl border border-white/15 text-white/80 py-3 hover:bg-white/5"
            >
              Volver al login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}