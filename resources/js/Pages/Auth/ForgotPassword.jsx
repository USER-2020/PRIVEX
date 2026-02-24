import { Head, useForm } from '@inertiajs/react';
import AuthNavbar from '../../Components/AuthNavbar';

export default function ForgotPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post('/forgot-password', {
            onSuccess: () => reset('email'),
        });
    };

    return (
        <>
            <Head title="Recuperar contraseña" />
            <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100 sm:px-8">
                <AuthNavbar primaryHref="/" primaryLabel="Login" />
                <div className="mx-auto w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/60">
                    <h1 className="text-2xl font-semibold text-white">Recuperar contraseña</h1>
                    <p className="mt-2 text-sm text-slate-300">
                        Te enviaremos un enlace para restablecer la contraseña.
                    </p>
                    <form onSubmit={submit} className="mt-6 space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-200">Correo</label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
                                placeholder="tu@empresa.com"
                            />
                            {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
                        >
                            {processing ? 'Enviando...' : 'Enviar enlace'}
                        </button>
                    </form>
                </div>
            </main>
        </>
    );
}
