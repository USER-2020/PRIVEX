import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import AuthNavbar from '../Components/AuthNavbar';

export default function Welcome() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (event) => {
        event.preventDefault();

        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Login" />

            <main className="min-h-screen bg-slate-950 text-slate-100">
                <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-8">
                    <section className="grid w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-slate-950/60 backdrop-blur sm:grid-cols-2">
                        <div className="hidden flex-col justify-between bg-gradient-to-br from-cyan-600 via-sky-700 to-slate-900 p-10 sm:flex">
                            <div>
                                <p className="text-sm uppercase tracking-[0.22em] text-cyan-100/80">Privex Access</p>
                                <h1 className="mt-4 max-w-xs text-4xl font-semibold leading-tight text-white">
                                    Seguridad y permisos listos para escalar
                                </h1>
                                <p className="mt-4 max-w-sm text-sm text-cyan-100/90">
                                    Frontend con Inertia + React. Backend preparado para Fortify, Spatie Permissions y JWT.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-cyan-200/20 bg-black/25 p-5 text-xs leading-relaxed text-cyan-100/85">
                                El login web usa sesion segura de Laravel. El endpoint API queda disponible para autenticar por token JWT.
                            </div>
                        </div>

                        <div className="p-6 sm:p-10">
                            <h2 className="text-2xl font-semibold text-white">Iniciar sesion</h2>
                            <p className="mt-2 text-sm text-slate-300">Ingresa con tu correo y contrasena.</p>

                            <form onSubmit={submit} className="mt-8 space-y-5">
                                <div>
                                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
                                        Correo electronico
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
                                        placeholder="tu@empresa.com"
                                    />
                                    {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email}</p>}
                                </div>

                                <div>
                                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                                        Contrasena
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            required
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 pr-12 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
                                            placeholder="********"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-200"
                                            aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                                        >
                                            {showPassword ? (
                                                <FiEyeOff className="h-4 w-4" />
                                            ) : (
                                                <FiEye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password}</p>}
                                </div>

                                <label className="flex items-center gap-3 text-sm text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                                    />
                                    Recordarme
                                </label>

                                <a
                                    href="/forgot-password"
                                    className="text-xs font-semibold text-cyan-200 transition hover:text-cyan-100"
                                >
                                    ¿Olvidaste tu contraseña?
                                </a>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing ? 'Ingresando...' : 'Entrar'}
                                </button>
                            </form>

                            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-center text-xs text-slate-300">
                                <p className="text-sm text-slate-200">Eres nuevo inicia un chat</p>
                                <a
                                    href="/chat/request"
                                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                                >
                                    Solicitar chat
                                </a>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
