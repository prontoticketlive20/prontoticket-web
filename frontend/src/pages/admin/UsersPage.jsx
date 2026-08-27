import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Pencil,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  UserRound,
  Mail,
  Phone,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/api";

const ROLES = [
  { value: "CUSTOMER", label: "Customer" },
  { value: "PRODUCER", label: "Producer" },
  { value: "SCANNER", label: "Scanner" },
  { value: "ADMIN", label: "Admin" },
];

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "CUSTOMER",
  isAffiliate: false,
  affiliatePhone: "",
};

function roleBadge(role) {
  const styles = {
    ADMIN:
      "bg-purple-500/10 text-purple-300 border-purple-500/20",
    PRODUCER:
      "bg-blue-500/10 text-blue-300 border-blue-500/20",
    SCANNER:
      "bg-orange-500/10 text-orange-300 border-orange-500/20",
    CUSTOMER:
      "bg-white/5 text-white/60 border-white/10",
  };

  return styles[role] || styles.CUSTOMER;
}

function formatDate(value) {
  if (!value) return "â€”";

  try {
    return new Date(value).toLocaleDateString("es-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "â€”";
  }
}

function extractUsers(response) {
  const payload =
    response?.data?.data?.data ??
    response?.data?.data ??
    response?.data ??
    [];

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [message, setMessage] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const response = await api.get("/users", {
        params: {
          page: 1,
          limit: 200,
        },
      });

      const extractedUsers = extractUsers(response);

      setUsers(extractedUsers);


    } catch (error) {
      console.error("[UsersPage] Error cargando usuarios:", error);

      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "No fue posible cargar los usuarios.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return users;

    return users.filter((user) => {
      return (
        String(user?.name || "")
          .toLowerCase()
          .includes(q) ||
        String(user?.email || "")
          .toLowerCase()
          .includes(q) ||
        String(user?.role || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [users, search]);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setMessage(null);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);

    setForm({
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      role: user?.role || "CUSTOMER",
      isAffiliate: Boolean(user?.affiliateProfile),
      affiliatePhone:
        user?.affiliateProfile?.phone || "",
    });

    setMessage(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingUser(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "El nombre es requerido.";
    }

    if (!form.email.trim()) {
      return "El email es requerido.";
    }

    if (!editingUser && form.password.length < 6) {
      return "La contraseÃ±a debe tener al menos 6 caracteres.";
    }

    if (
      editingUser &&
      form.password &&
      form.password.length < 6
    ) {
      return "La nueva contraseÃ±a debe tener al menos 6 caracteres.";
    }

    if (!ROLES.some((role) => role.value === form.role)) {
      return "Selecciona un rol vÃ¡lido.";
    }

    return null;
  };

  const createAffiliateProfile = async (userId) => {
    await api.post("/affiliates", {
      userId,
      phone: form.affiliatePhone.trim() || undefined,
    });
  };

  const saveUser = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setMessage({
        type: "error",
        text: validationError,
      });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      if (!editingUser) {
        const response = await api.post("/users", {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: form.role,
        });

        const createdUser =
          response?.data?.data?.data ??
          response?.data?.data ??
          response?.data;

        const userId = createdUser?.id;

        if (!userId) {
          throw new Error(
            "El backend creÃ³ el usuario pero no devolviÃ³ su ID.",
          );
        }

        if (form.isAffiliate) {
          await createAffiliateProfile(userId);
        }

        await loadUsers();

        setShowModal(false);
        setEditingUser(null);
        setForm(EMPTY_FORM);

        setMessage({
          type: "success",
          text: form.isAffiliate
            ? "Usuario y perfil de afiliado creados correctamente."
            : "Usuario creado correctamente.",
        });

        return;
      }

      const updatePayload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
      };

      if (form.password) {
        updatePayload.password = form.password;
      }

      await api.patch(
        `/users/${editingUser.id}`,
        updatePayload,
      );

      /*
       * Si el usuario todavÃ­a no tiene Affiliate y el ADMIN
       * lo marca como afiliado, creamos el perfil.
       *
       * La activaciÃ³n/desactivaciÃ³n de perfiles existentes
       * la implementaremos como siguiente mejora del backend.
       */
      if (
        form.isAffiliate &&
        !editingUser?.affiliateProfile
      ) {
        await createAffiliateProfile(editingUser.id);
      }

      await loadUsers();

      setShowModal(false);
      setEditingUser(null);
      setForm(EMPTY_FORM);

      setMessage({
        type: "success",
        text: "Usuario actualizado correctamente.",
      });
    } catch (error) {
      console.error("[UsersPage] Error guardando usuario:", error);

      let backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "No fue posible guardar el usuario.";

      if (Array.isArray(backendMessage)) {
        backendMessage = backendMessage.join(", ");
      }

      setMessage({
        type: "error",
        text: String(backendMessage),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-7">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#007AFF]/15 border border-[#007AFF]/20 flex items-center justify-center">
                <Users
                  size={23}
                  className="text-[#5ca9ff]"
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white">
                  GestiÃ³n de Usuarios
                </h1>

                <p className="text-white/50 text-sm mt-1">
                  Administra usuarios, roles y perfiles de
                  afiliados.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-semibold shadow-lg shadow-[#007AFF]/20 hover:brightness-110"
          >
            <UserPlus size={18} />
            Crear usuario
          </button>
        </div>

        {/* MESSAGE */}
        {message && (
          <div
            className={`mb-5 rounded-2xl border px-4 py-3 flex items-start gap-3 ${
              message.type === "success"
                ? "border-green-500/20 bg-green-500/10 text-green-300"
                : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
              />
            ) : (
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />
            )}

            <span className="text-sm">
              {message.text}
            </span>
          </div>
        )}

        {/* SEARCH */}
        <div className="rounded-3xl border border-white/10 bg-[#121212] p-4 mb-5">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o rol..."
              className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-white/30 outline-none focus:border-[#007AFF]/50"
            />
          </div>
        </div>

        {/* USERS TABLE */}
        <div className="rounded-3xl border border-white/10 bg-[#121212] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold">
                Usuarios
              </h2>

              <p className="text-white/40 text-xs mt-1">
                {filteredUsers.length} registro
                {filteredUsers.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-white/50">
              <Loader2
                size={28}
                className="animate-spin mb-3"
              />
              <span className="text-sm">
                Cargando usuarios...
              </span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center">
              <UserRound
                size={34}
                className="mx-auto text-white/20 mb-3"
              />

              <p className="text-white/50">
                No encontramos usuarios.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-white/40 uppercase">
                      Usuario
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-white/40 uppercase">
                      Rol
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-white/40 uppercase">
                      Afiliado
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-white/40 uppercase">
                      Creado
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-white/40 uppercase text-right">
                      AcciÃ³n
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => {
                    const affiliate =
                      user?.affiliateProfile;

                    return (
                      <tr
                        key={user.id}
                        className="border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.025]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              <UserRound
                                size={18}
                                className="text-white/50"
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="text-white font-medium truncate">
                                {user.name ||
                                  "Sin nombre"}
                              </div>

                              <div className="text-white/40 text-xs mt-0.5 truncate flex items-center gap-1.5">
                                <Mail size={12} />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${roleBadge(
                              user.role,
                            )}`}
                          >
                            <Shield size={12} />
                            {user.role}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {affiliate ? (
                            <div>
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${
                                  affiliate.isActive
                                    ? "bg-green-500/10 border-green-500/20 text-green-300"
                                    : "bg-red-500/10 border-red-500/20 text-red-300"
                                }`}
                              >
                                {affiliate.isActive
                                  ? "Activo"
                                  : "Inactivo"}
                              </span>

                              {affiliate.phone && (
                                <div className="text-white/35 text-xs mt-1.5 flex items-center gap-1">
                                  <Phone size={11} />
                                  {affiliate.phone}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-white/30 text-sm">
                              No
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-white/45 text-sm">
                          {formatDate(user.createdAt)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(user)
                            }
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                          >
                            <Pencil size={14} />
                            Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#151515] shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingUser
                    ? "Editar usuario"
                    : "Crear usuario"}
                </h2>

                <p className="text-white/40 text-sm mt-1">
                  {editingUser
                    ? "Actualiza los datos y permisos del usuario."
                    : "Crea una cuenta administrativa o de cliente."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={saveUser}
              className="p-6 space-y-5"
            >
              <div>
                <label className="text-xs text-white/60">
                  Nombre *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1.5 w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white outline-none focus:border-[#007AFF]/50"
                  placeholder="Nombre completo"
                />
              </div>

              <div>
                <label className="text-xs text-white/60">
                  Email *
                </label>

                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1.5 w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white outline-none focus:border-[#007AFF]/50"
                  placeholder="usuario@email.com"
                />
              </div>

              <div>
                <label className="text-xs text-white/60">
                  {editingUser
                    ? "Nueva contraseÃ±a"
                    : "ContraseÃ±a *"}
                </label>

                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="mt-1.5 w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white outline-none focus:border-[#007AFF]/50"
                  placeholder={
                    editingUser
                      ? "Dejar vacÃ­o para conservar la actual"
                      : "MÃ­nimo 6 caracteres"
                  }
                />
              </div>

              <div>
                <label className="text-xs text-white/60">
                  Rol *
                </label>

                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="mt-1.5 w-full px-4 py-3 rounded-xl bg-[#202020] border border-white/10 text-white outline-none focus:border-[#007AFF]/50"
                >
                  {ROLES.map((role) => (
                    <option
                      key={role.value}
                      value={role.value}
                    >
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isAffiliate"
                    checked={form.isAffiliate}
                    onChange={handleChange}
                    disabled={Boolean(
                      editingUser?.affiliateProfile,
                    )}
                    className="mt-1 w-4 h-4"
                  />

                  <div>
                    <div className="text-white font-medium">
                      Este usuario es afiliado
                    </div>

                    <div className="text-white/40 text-xs mt-1">
                      PodrÃ¡ ser asignado a eventos y
                      recibir comisiones por ventas
                      atribuidas.
                    </div>
                  </div>
                </label>

                {form.isAffiliate && (
                  <div className="mt-4">
                    <label className="text-xs text-white/60">
                      TelÃ©fono
                    </label>

                    <input
                      name="affiliatePhone"
                      value={form.affiliatePhone}
                      onChange={handleChange}
                      disabled={Boolean(
                        editingUser?.affiliateProfile,
                      )}
                      className="mt-1.5 w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white outline-none focus:border-[#007AFF]/50 disabled:opacity-50"
                      placeholder="Opcional"
                    />

                    {editingUser?.affiliateProfile && (
                      <p className="text-white/35 text-xs mt-2">
                        El perfil de afiliado ya existe.
                        Su activaciÃ³n, estado y datos
                        comerciales se administrarÃ¡n sin
                        eliminar su historial.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="min-w-[145px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-semibold hover:brightness-110 disabled:opacity-60"
                >
                  {saving && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {editingUser
                    ? "Guardar cambios"
                    : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
