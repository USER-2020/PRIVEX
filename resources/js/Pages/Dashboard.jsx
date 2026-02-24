import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

export default function Dashboard() {
    const { notifications, auth } = usePage().props;
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState(notifications?.items ?? []);
    const [unread, setUnread] = useState(notifications?.unread_count ?? 0);
    const { post, processing } = useForm({});

    const logout = (event) => {
        event.preventDefault();
        post('/logout');
    };

    const markAllRead = async () => {
        await window.axios.post('/notifications/read');
        setUnread(0);
        setItems((prev) =>
            prev.map((item) => ({
                ...item,
                read_at: item.read_at ?? new Date().toISOString(),
            }))
        );
    };

    useEffect(() => {
        if (!window.Echo || !auth?.user?.id) return;

        const channel = window.Echo.private(`user.${auth.user.id}`);
        channel.listen('.chat.approved', (event) => {
            setItems((prev) => [
                {
                    id: `realtime-${event.chat_id}-${Date.now()}`,
                    type: 'chat.approved',
                    data: {
                        title: 'Chat aprobado',
                        body: 'Tu solicitud fue aprobada. Ya puedes chatear.',
                    },
                    read_at: null,
                    created_at: new Date().toISOString(),
                },
                ...prev,
            ]);
            setUnread((count) => count + 1);

        });

        return () => {
            channel.stopListening('.chat.approved');
            window.Echo.leave(`private-user.${auth.user.id}`);
        };
    }, [auth?.user?.id]);

    const unreadBadge = useMemo(() => {
        if (unread <= 0) return null;
        return (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                {unread}
            </span>
        );
    }, [unread]);

    return (
        <>
            <Head title="Dashboard" />
            <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100 sm:px-8">
                <div className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/60">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-semibold">Dashboard</h1>
                            <p className="mt-2 text-sm text-slate-300">
                                Login con Fortify activo. API JWT y permisos de Spatie listos para consumir.
                            </p>
                        </div>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setOpen((prev) => !prev)}
                                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-950/60 text-slate-200 transition hover:bg-slate-800"
                            >
                                <span className="text-lg">🔔</span>
                                {unreadBadge}
                            </button>
                            {open && (
                                <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/70">
                                    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                                        Notificaciones
                                        <button
                                            type="button"
                                            onClick={markAllRead}
                                            className="text-[10px] font-semibold text-cyan-300"
                                        >
                                            Marcar todo
                                        </button>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto">
                                        {items.length === 0 ? (
                                            <div className="px-4 py-6 text-sm text-slate-400">
                                                Sin notificaciones.
                                            </div>
                                        ) : (
                                            items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className={`border-b border-slate-800 px-4 py-3 text-sm ${
                                                        item.read_at ? 'text-slate-400' : 'text-white'
                                                    }`}
                                                >
                                                    <p className="font-semibold">
                                                        {item.data?.title ?? 'Notificacion'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {item.data?.body ?? 'Actualizacion'}
                                                    </p>
                                                    <p className="mt-2 text-[10px] text-slate-500">
                                                        {item.created_at
                                                            ? new Date(item.created_at).toLocaleString()
                                                            : ''}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <form onSubmit={logout} className="mt-8">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
                        >
                            {processing ? 'Saliendo...' : 'Cerrar sesion'}
                        </button>
                    </form>
                </div>
            </main>
        </>
    );
}
