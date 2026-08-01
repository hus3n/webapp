"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type UserRole = "guru" | "admin" | "superadmin";
type UserStatus = "active" | "inactive";

type User = {
  id: string;
  email: string;
  nama: string;
  role: UserRole;
  whatsappNumber: string | null;
  status: UserStatus;
  createdAt: string | null;
};

type FormMode =
  | { type: "create"; role: UserRole }
  | { type: "edit"; user: User };

const ROLE_LABELS: Record<UserRole, string> = {
  guru: "Guru",
  admin: "Admin",
  superadmin: "Super Admin",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Aktif",
  inactive: "Nonaktif",
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function UserManagement({
  currentRole,
  currentUserId,
}: {
  currentRole: UserRole;
  currentUserId: string;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isSuper = currentRole === "superadmin";
  const isManager = currentRole === "admin" || isSuper;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat data");
        setUsers([]);
      } else {
        setUsers(data.users ?? []);
      }
    } catch {
      setError("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function toggleStatus(user: User) {
    const next: UserStatus = user.status === "active" ? "inactive" : "active";
    setBusyId(user.id);
    setError(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengubah status");
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: next } : u))
      );
    } catch {
      setError("Terjadi kesalahan saat mengubah status");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(user: User) {
    if (!window.confirm(`Nonaktifkan akun ${user.nama}?`)) return;
    setBusyId(user.id);
    setError(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal menonaktifkan");
        return;
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, status: "inactive" } : u
        )
      );
    } catch {
      setError("Terjadi kesalahan saat menonaktifkan");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen User</h1>
          <p className="text-sm text-neutral-500">
            Kelola akun guru, admin, dan super admin.
          </p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <button
              onClick={() => setFormMode({ type: "create", role: "guru" })}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
            >
              + Tambah Guru
            </button>
            {isSuper && (
              <button
                onClick={() => setFormMode({ type: "create", role: "admin" })}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100"
              >
                + Tambah Admin
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-md border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2">Nama</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">WhatsApp</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Dibuat</th>
              <th className="px-4 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-neutral-500"
                >
                  Memuat...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-neutral-500"
                >
                  Belum ada user.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const canEdit =
                  user.role === "superadmin" ? isSuper : isManager;
                const canDelete = isSuper && user.id !== currentUserId;
                return (
                  <tr key={user.id} className="border-t border-neutral-200">
                    <td className="px-4 py-2 font-medium">
                      {user.nama}
                      {user.id === currentUserId && (
                        <span className="ml-2 text-xs text-neutral-400">
                          (Anda)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-2">{user.whatsappNumber ?? "-"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          user.status === "active"
                            ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                            : "rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700"
                        }
                      >
                        {STATUS_LABELS[user.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-3">
                        {canEdit && (
                          <button
                            onClick={() => setFormMode({ type: "edit", user })}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                        )}
                        {canEdit && user.id !== currentUserId && (
                          <button
                            onClick={() => toggleStatus(user)}
                            disabled={busyId === user.id}
                            className="text-amber-600 hover:underline disabled:opacity-50"
                          >
                            {user.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={busyId === user.id}
                            className="text-red-600 hover:underline disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {formMode && (
        <UserForm
          mode={formMode}
          isSuper={isSuper}
          onClose={() => setFormMode(null)}
          onSaved={loadUsers}
        />
      )}
    </div>
  );
}

function UserForm({
  mode,
  isSuper,
  onClose,
  onSaved,
}: {
  mode: FormMode;
  isSuper: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = mode.type === "edit" ? mode.user : null;
  const createRole = mode.type === "create" ? mode.role : null;

  const [nama, setNama] = useState(editing?.nama ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [password, setPassword] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState(
    editing?.whatsappNumber ?? ""
  );
  const [status, setStatus] = useState<UserStatus>(
    editing?.status ?? "active"
  );
  const [role, setRole] = useState<UserRole>(
    editing?.role ?? createRole ?? "guru"
  );
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (!email.includes("@")) {
      setLocalError("Email tidak valid");
      return;
    }
    if (mode.type === "create" && password.length < 8) {
      setLocalError("Password minimal 8 karakter");
      return;
    }

    setSubmitting(true);
    try {
      if (mode.type === "create") {
        const url = role === "admin" ? "/api/users" : "/api/auth/register";
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama,
            email,
            password,
            whatsappNumber: whatsappNumber || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setLocalError(data.error ?? "Gagal menyimpan");
          return;
        }
      } else {
        const res = await fetch(`/api/users/${editing!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama,
            email,
            whatsappNumber: whatsappNumber || null,
            status,
            ...(isSuper ? { role } : {}),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setLocalError(data.error ?? "Gagal menyimpan");
          return;
        }
      }
      onSaved();
      onClose();
    } catch {
      setLocalError("Terjadi kesalahan, coba lagi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-md flex-col gap-4 rounded-md bg-white p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {mode.type === "create" ? "Tambah User" : "Edit User"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-neutral-400 hover:text-neutral-600"
          >
            &times;
          </button>
        </div>

        {mode.type === "edit" && (
          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <input
              value={ROLE_LABELS[editing!.role]}
              readOnly
              disabled
              className="w-full rounded-md border border-neutral-300 bg-neutral-100 px-3 py-2"
            />
            {isSuper && editing!.role !== "superadmin" && (
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2"
              >
                <option value="guru">Guru</option>
                <option value="admin">Admin</option>
              </select>
            )}
          </div>
        )}

        <div>
          <label htmlFor="nama" className="mb-1 block text-sm font-medium">
            Nama
          </label>
          <input
            id="nama"
            required
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        {mode.type === "create" && (
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
            />
            <p className="mt-1 text-xs text-neutral-500">Minimal 8 karakter</p>
          </div>
        )}
        <div>
          <label htmlFor="whatsapp" className="mb-1 block text-sm font-medium">
            WhatsApp (opsional)
          </label>
          <input
            id="whatsapp"
            placeholder="6281234567890"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        {mode.type === "edit" && (
          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        )}

        {localError && <p className="text-sm text-red-600">{localError}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            {submitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
