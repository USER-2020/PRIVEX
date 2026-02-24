import { Head, useForm, usePage } from '@inertiajs/react';
import { FiEdit } from 'react-icons/fi';
import AuthNavbar from '../../Components/AuthNavbar';

export default function Dashboard({ users = [] }) {
    const { auth } = usePage().props;
    const { post, processing } = useForm({});

    const logout = (event) => {
        event.preventDefault();
        post('/logout');
    };

    return (
        <>
            <Head title="Dashboard Manager" />
            <main className="min-h-screen bg-slate-950 text-slate-100">
                <AuthNavbar
                    primaryHref="/dashboard"
                    primaryLabel="Dashboard"
                    showLogout
                    logoutIcon
                    onLogout={logout}
                />
                <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-8">
                    <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/60">
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Manager</p>
                        <h1 className="mt-2 text-2xl font-semibold text-white">Dashboard</h1>
                        <p className="mt-2 text-sm text-slate-300">
                            Sesion activa: {auth?.user?.name ?? 'Manager'}
                        </p>
                    </header>

                    <section className="mt-6 grid gap-4 md:grid-cols-2">
                        <a
                            href="/manager/users/create"
                            className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
                        >
                            Crear usuarios y asignar roles
                        </a>
                        <a
                            href="/profile"
                            className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/60"
                        >
                            Ver perfil
                        </a>
                    </section>

                    <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/60">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold text-white">Usuarios</h2>
                            <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs text-slate-300">
                                {users.length} total
                            </span>
                        </div>

                        {users.length === 0 ? (
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                                No hay usuarios registrados.
                            </div>
                        ) : (
                            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
                                <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_auto] items-center gap-2 border-b border-slate-800 bg-slate-950/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                    <span>Nombre</span>
                                    <span>Correo</span>
                                    <span>Creado</span>
                                    <span className="text-right">Editar</span>
                                </div>
                                <div className="divide-y divide-slate-800">
                                    {users.map((user) => (
                                        <div
                                            key={user.id}
                                            className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 text-sm text-slate-200"
                                        >
                                            <span className="truncate font-medium text-white">{user.name}</span>
                                            <span className="truncate text-slate-300">{user.email}</span>
                                            <span className="text-xs text-slate-400">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                                            </span>
                                            <a
                                                href={`/manager/users/${user.id}/edit`}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/70 text-slate-200 transition hover:border-cyan-400/60 hover:text-cyan-100"
                                                title="Editar usuario"
                                            >
                                                <FiEdit className="h-4 w-4" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}
