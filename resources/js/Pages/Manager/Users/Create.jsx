import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import AuthNavbar from '../../../Components/AuthNavbar';

export default function Create({ roles = [] }) {
    const { flash, auth } = usePage().props;
    const { post, processing: logoutProcessing } = useForm({});
    const [showPassword, setShowPassword] = useState(false);
    const form = useForm({
        name: '',
        email: '',
        password: '',
        role: '',
    });

    const logout = (event) => {
        event.preventDefault();
        if (logoutProcessing) return;
        post('/logout');
    };

    const submit = (event) => {
        event.preventDefault();
        form.post('/manager/users', {
            onSuccess: () => form.reset(),
        });
    };

    return (
        <>
            <Head title="Crear usuarios" />
            <main className="min-h-screen bg-slate-950 text-slate-100">
                <AuthNavbar
                    primaryHref="/dashboard"
                    primaryLabel="Dashboard"
                    showLogout
                    logoutIcon
                    onLogout={logout}
                />
                <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-8">
                    <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/60">
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Manager</p>
                        <h1 className="mt-2 text-2xl font-semibold text-white">Crear usuarios</h1>
                        <p className="mt-2 text-sm text-slate-300">
                            Sesion activa: {auth?.user?.name ?? 'Manager'}
                        </p>
                        {flash?.status && (
                            <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                                {flash.status}
                            </div>
                        )}
                    </header>

                    <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/60">
                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-200">Nombre</label>
                                <input
                                    type="text"
                                    value={form.data.name}
                                    onChange={(event) => form.setData('name', event.target.value)}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
                                />
                                {form.errors.name && (
                                    <p className="mt-1 text-xs text-rose-400">{form.errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-200">Correo</label>
                                <input
                                    type="email"
                                    value={form.data.email}
                                    onChange={(event) => form.setData('email', event.target.value)}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
                                />
                                {form.errors.email && (
                                    <p className="mt-1 text-xs text-rose-400">{form.errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-200">Contrasena</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.data.password}
                                        onChange={(event) => form.setData('password', event.target.value)}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 pr-12 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 transition hover:text-cyan-200"
                                        title={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                                    >
                                        {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {form.errors.password && (
                                    <p className="mt-1 text-xs text-rose-400">{form.errors.password}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-200">Rol</label>
                                <select
                                    value={form.data.role}
                                    onChange={(event) => form.setData('role', event.target.value)}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
                                >
                                    <option value="">Sin rol</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.name}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.role && (
                                    <p className="mt-1 text-xs text-rose-400">{form.errors.role}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={form.processing}
                                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
                            >
                                {form.processing ? 'Creando...' : 'Crear usuario'}
                            </button>
                        </form>
                    </section>
                </div>
            </main>
        </>
    );
}
