import { FiLogOut } from 'react-icons/fi';

export default function AuthNavbar({
    primaryHref = '/dashboard',
    primaryLabel = 'Dashboard',
    showLogout = false,
    logoutIcon = false,
    onLogout,
}) {
    return (
        <header className="border-b border-slate-900/80 bg-slate-950/80 px-4 py-4 text-slate-100 backdrop-blur sm:px-8">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Privex</p>
                    <p className="text-sm font-semibold text-white">Acceso seguro</p>
                </div>
                <nav className="flex items-center gap-3">
                    <a
                        href={primaryHref}
                        className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/60"
                    >
                        {primaryLabel}
                    </a>
                    {showLogout && (
                        <form onSubmit={onLogout}>
                            {logoutIcon ? (
                                <button
                                    type="submit"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/40 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/20"
                                    title="Cerrar sesion"
                                >
                                    <FiLogOut className="h-4 w-4" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20"
                                >
                                    Cerrar sesion
                                </button>
                            )}
                        </form>
                    )}
                </nav>
            </div>
        </header>
    );
}
