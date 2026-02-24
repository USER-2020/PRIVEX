import { Head, useForm, usePage } from '@inertiajs/react';
import AuthNavbar from '../Components/AuthNavbar';

export default function Profile({ user }) {
    const { flash } = usePage().props;
    const profileForm = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const deleteForm = useForm({
        password: '',
    });

    const updateProfile = (event) => {
        event.preventDefault();
        profileForm.put('/user/profile-information');
    };

    const updatePassword = (event) => {
        event.preventDefault();
        passwordForm.put('/user/password', {
            onSuccess: () => passwordForm.reset(),
        });
    };

    const deleteAccount = (event) => {
        event.preventDefault();
        deleteForm.post('/user/delete');
    };

    return (
        <>
            <Head title="Perfil" />
            <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100 sm:px-8">
                <AuthNavbar primaryHref="/dashboard" primaryLabel="Dashboard" />
                <div className="mx-auto w-full max-w-3xl space-y-6">
                    <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/60">
                        <h1 className="text-2xl font-semibold text-white">Perfil</h1>
                        <p className="mt-2 text-sm text-slate-300">
                            Actualiza tu cuenta, cambia la contraseña o elimina tu usuario.
                        </p>
                        {flash?.status && (
                            <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                                {flash.status}
                            </div>
                        )}
                    </header>

                    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/60">
                        <h2 className="text-lg font-semibold text-white">Modificar cuenta</h2>
                        <form onSubmit={updateProfile} className="mt-6 space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-200">Nombre</label>
                                <input
                                    type="text"
                                    value={profileForm.data.name}
                                    onChange={(event) => profileForm.setData('name', event.target.value)}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
                                />
                                {profileForm.errors.name && (
                                    <p className="mt-1 text-xs text-rose-400">{profileForm.errors.name}</p>
                                )}
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-200">Correo</label>
                                <input
                                    type="email"
                                    value={profileForm.data.email}
                                    onChange={(event) => profileForm.setData('email', event.target.value)}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
                                />
                                {profileForm.errors.email && (
                                    <p className="mt-1 text-xs text-rose-400">{profileForm.errors.email}</p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={profileForm.processing}
                                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
                            >
                                {profileForm.processing ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </form>
                    </section>

                    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/60">
                        <h2 className="text-lg font-semibold text-white">Cambiar contraseña</h2>
                        <form onSubmit={updatePassword} className="mt-6 space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-200">Contraseña actual</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    onChange={(event) => passwordForm.setData('current_password', event.target.value)}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
                                />
                                {passwordForm.errors.current_password && (
                                    <p className="mt-1 text-xs text-rose-400">{passwordForm.errors.current_password}</p>
                                )}
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-200">Nueva contraseña</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={(event) => passwordForm.setData('password', event.target.value)}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
                                />
                                {passwordForm.errors.password && (
                                    <p className="mt-1 text-xs text-rose-400">{passwordForm.errors.password}</p>
                                )}
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-200">Confirmar contraseña</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(event) =>
                                        passwordForm.setData('password_confirmation', event.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={passwordForm.processing}
                                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
                            >
                                {passwordForm.processing ? 'Actualizando...' : 'Actualizar contraseña'}
                            </button>
                        </form>
                    </section>

                    <section className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-6 shadow-2xl shadow-slate-950/60">
                        <h2 className="text-lg font-semibold text-rose-100">Eliminar cuenta</h2>
                        <p className="mt-2 text-sm text-rose-200/80">
                            Esta acción es permanente. Se eliminará tu usuario y sus datos.
                        </p>
                        <form onSubmit={deleteAccount} className="mt-6 space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-rose-100">Confirma tu contraseña</label>
                                <input
                                    type="password"
                                    value={deleteForm.data.password}
                                    onChange={(event) => deleteForm.setData('password', event.target.value)}
                                    className="w-full rounded-xl border border-rose-400/40 bg-rose-900/20 px-4 py-3 text-sm text-rose-100 outline-none ring-rose-400/60 transition focus:ring-2"
                                />
                                {deleteForm.errors.password && (
                                    <p className="mt-1 text-xs text-rose-200">{deleteForm.errors.password}</p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={deleteForm.processing}
                                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-60"
                            >
                                {deleteForm.processing ? 'Eliminando...' : 'Eliminar cuenta'}
                            </button>
                        </form>
                    </section>
                </div>
            </main>
        </>
    );
}
