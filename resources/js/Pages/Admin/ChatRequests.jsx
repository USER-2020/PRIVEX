import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Client as BeamsClient } from '@pusher/push-notifications-web';
import { FiLogOut } from 'react-icons/fi';
import PwaInstallBanner from '@/Components/PwaInstallBanner';

export default function ChatRequests({ requests, activeChats }) {
    const { auth } = usePage().props;
    const [items, setItems] = useState(requests || []);
    const [chats, setChats] = useState(activeChats || []);
    const [busy, setBusy] = useState({});
    const { post, processing } = useForm({});

    const approve = (id) => {
        if (busy[`approve-${id}`]) return;
        setBusy((prev) => ({ ...prev, [`approve-${id}`]: true }));
        post(`/admin/chat-requests/${id}/approve`, {
            onFinish: () => {
                setBusy((prev) => {
                    const next = { ...prev };
                    delete next[`approve-${id}`];
                    return next; 
                });
            },
        });
    };

    const reject = (id) => {
        if (busy[`reject-${id}`]) return;
        setBusy((prev) => ({ ...prev, [`reject-${id}`]: true }));
        post(`/admin/chat-requests/${id}/reject`, {
            onSuccess: () => {
                setItems((prev) => prev.filter((item) => item.id !== id));
            },
            onFinish: () => {
                setBusy((prev) => {
                    const next = { ...prev };
                    delete next[`reject-${id}`];
                    return next;
                });
            },
        });
    };

    const closeChat = (id) => {
        if (busy[`close-${id}`]) return;
        setBusy((prev) => ({ ...prev, [`close-${id}`]: true }));
        post(`/admin/chat/${id}/close`, {
            onSuccess: () => {
                setChats((prev) => prev.filter((chat) => chat.id !== id));
            },
            onFinish: () => {
                setBusy((prev) => {
                    const next = { ...prev };
                    delete next[`close-${id}`];
                    return next;
                });
            },
        });
    };

    const notificationsEnabled =
        typeof window !== 'undefined' &&
        'Notification' in window &&
        window.Notification.permission === 'granted';

    const enableNotifications = async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        if (window.Notification.permission === 'default') {
            await window.Notification.requestPermission();
        }
    };

    const logout = (event) => {
        event.preventDefault();
        post('/logout');
    };

    useEffect(() => {
        if (!window.Echo) return;

        const channel = window.Echo.private('admin.chat-requests');

        channel.listen('.chat.request', (event) => {
            console.log('[admin.chat-requests] chat.request', event);
            setItems((prev) => {
                const exists = prev.some((item) => item.id === event.id);
                if (exists) return prev;
                return [
                    {
                        id: event.id,
                        display_name: event.display_name,
                        photo_path: event.photo_path,
                        created_at: event.created_at,
                    },
                    ...prev,
                ];
            });

        });

        channel.listen('.chat.approved', (event) => {
            console.log('[admin.chat-requests] chat.approved', event);
            setItems((prev) => prev.filter((item) => item.id !== event.request_id));
            setChats((prev) => {
                const exists = prev.some((chat) => chat.id === event.chat_id);
                if (exists) return prev;
                return [
                    {
                        id: event.chat_id,
                        user_name: event.user_name,
                        ends_at: event.ends_at,
                        started_at: event.started_at,
                    },
                    ...prev,
                ];
            });
        });

        return () => {
            channel.stopListening('.chat.request');
            channel.stopListening('.chat.approved');
            window.Echo.leave('private-admin.chat-requests');
        };
    }, []);

    useEffect(() => {
        const instanceId = import.meta.env.VITE_BEAMS_INSTANCE_ID;
        if (!instanceId || !auth?.user?.id) return;
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        try {
            const beams = new BeamsClient({ instanceId });
            beams
                .start()
                .then(() => beams.addDeviceInterest('admin'))
                .catch(() => {});
        } catch (error) {
            // Ignore unsupported browser errors.
        }
    }, [auth?.user?.id]);

    return (
        <>
            <Head title="Validacion de Fotos" />
            <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100 sm:px-8">
                <div className="mx-auto w-full max-w-6xl">
                    <header className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-4 shadow-2xl shadow-slate-950/60">
                        <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Panel admin</p>
                            <h1 className="mt-2 text-2xl font-semibold text-white">Solicitudes de Chat</h1>
                            <p className="mt-2 text-xs text-slate-400">
                                Sesion activa: {auth?.user?.name ?? 'Admin'}
                            </p>
                        </div>
                        <nav className="flex flex-wrap items-center gap-3">
                            <a
                                href="/profile"
                                className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/60"
                            >
                                Perfil
                            </a>
                            <form onSubmit={logout}>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/40 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
                                    title="Cerrar sesion"
                                >
                                    <FiLogOut className="h-4 w-4" />
                                </button>
                            </form>
                        </nav>
                    </header>

                    <section className="mb-8">
                        <p className="text-sm text-slate-300">
                            Revisa las fotos frontales y aprueba antes de habilitar el chat por 24 horas.
                        </p>
                        <div className="mt-4">
                            <PwaInstallBanner onEnableNotifications={enableNotifications} />
                        </div>
                        <button
                            type="button"
                            onClick={enableNotifications}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                        >
                            {notificationsEnabled ? 'Notificaciones activas' : 'Activar notificaciones'}
                        </button>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-lg font-semibold text-white">Chats activos</h2>
                        {chats.length === 0 ? (
                            <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
                                No hay chats activos.
                            </div>
                        ) : (
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                {chats.map((chat) => (
                                    <div
                                        key={chat.id}
                                        className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{chat.user_name}</p>
                                                <p className="text-xs text-slate-400">
                                                    Expira: {chat.ends_at ? new Date(chat.ends_at).toLocaleString() : '—'}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <a
                                                    href={`/admin/chat/${chat.id}`}
                                                    className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                                                >
                                                    Abrir
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => closeChat(chat.id)}
                                                    disabled={!!busy[`close-${chat.id}`]}
                                                    className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
                                                >
                                                    {busy[`close-${chat.id}`] ? 'Cerrando...' : 'Cerrar'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {items.length === 0 ? (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
                            No hay solicitudes pendientes.
                        </div>
                    ) : (
                        <div className="grid gap-6 lg:grid-cols-2">
                            {items.map((request) => (
                                <article
                                    key={request.id}
                                    className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/50"
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row">
                                        <img
                                            src={`/storage/${request.photo_path}`}
                                            alt={request.display_name}
                                            className="h-48 w-full rounded-2xl object-cover sm:h-40 sm:w-48"
                                        />
                                        <div className="flex-1">
                                            <h2 className="text-xl font-semibold text-white">{request.display_name}</h2>
                                            <p className="mt-1 text-xs text-slate-400">
                                                Enviada: {new Date(request.created_at).toLocaleString()}
                                            </p>
                                            <div className="mt-4 flex flex-wrap gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => approve(request.id)}
                                                    disabled={processing || !!busy[`approve-${request.id}`]}
                                                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
                                                >
                                                    {busy[`approve-${request.id}`] ? 'Aprobando...' : 'Aprobar'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => reject(request.id)}
                                                    disabled={processing || !!busy[`reject-${request.id}`]}
                                                    className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
                                                >
                                                    {busy[`reject-${request.id}`] ? 'Rechazando...' : 'Rechazar'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
