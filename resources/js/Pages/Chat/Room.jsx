import { Head, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Client as BeamsClient } from '@pusher/push-notifications-web';
import Picker from '@emoji-mart/react';
import emojiData from '@emoji-mart/data';
import { FiBell, FiMessageSquare } from 'react-icons/fi';
import PwaInstallBanner from '@/Components/PwaInstallBanner';
import PwaStatusPanel from '@/Components/PwaStatusPanel';

export default function Room({ chat, messages: initialMessages, isAdmin, viewer }) {
    const { auth } = usePage().props;
    const [messages, setMessages] = useState(initialMessages || []);
    const [attachment, setAttachment] = useState(null);
    const [attachmentPreview, setAttachmentPreview] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef(null);
    const bottomRef = useRef(null);
    const [chatStatus, setChatStatus] = useState(chat?.status ?? 'active');
    const [closingChat, setClosingChat] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const endsAt = chat?.ends_at ? new Date(chat.ends_at) : null;
    const { data, setData, processing, reset } = useForm({ body: '' });

    const canSend = useMemo(() => data.body.trim().length > 0 || !!attachment, [data.body, attachment]);

    const ensureNotifications = async () => {
        if (!('Notification' in window)) return;
        if (window.Notification.permission === 'default') {
            const result = await window.Notification.requestPermission();
            setNotificationsEnabled(result === 'granted');
            return;
        }
        setNotificationsEnabled(window.Notification.permission === 'granted');
    };

    useEffect(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        setNotificationsEnabled(window.Notification.permission === 'granted');
    }, []);

    useEffect(() => {
        const channelKey = chat?.public_token ?? chat?.id;
        if (!window.Echo || !channelKey) return;

        const channel = window.Echo.channel(`public-chat.${channelKey}`);

        channel.listen('.chat.message', (event) => {
            const mine = isAdmin ? event.sender_role === 'admin' : event.sender_role === 'user';
            setMessages((prev) => [
                ...prev,
                {
                    id: event.id,
                    user_id: event.user_id,
                    sender_name: event.sender_name,
                    sender_role: event.sender_role,
                    body: event.body,
                    attachment_path: event.attachment_path,
                    attachment_name: event.attachment_name,
                    attachment_mime: event.attachment_mime,
                    attachment_size: event.attachment_size,
                    attachment_type: event.attachment_type,
                    created_at: event.created_at,
                },
            ]);

        });

        channel.listen('.chat.closed', (event) => {
            if (isAdmin) {
                window.location.href = '/dashboard';
                return;
            }
            setChatStatus(event.status ?? 'closed');
        });

        return () => {
            channel.stopListening('.chat.message');
            channel.stopListening('.chat.closed');
            window.Echo.leave(`public-chat.${channelKey}`);
        };
    }, [chat?.public_token, chat?.id]);

    useEffect(() => {
        if (!attachment) {
            setAttachmentPreview(null);
            return;
        }

        if (attachment.type?.startsWith('image/')) {
            const url = URL.createObjectURL(attachment);
            setAttachmentPreview(url);
            return () => URL.revokeObjectURL(url);
        }

        setAttachmentPreview(null);
    }, [attachment]);

    useEffect(() => {
        if (!showEmojiPicker) return;

        const onClick = (event) => {
            if (!emojiPickerRef.current?.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };

        const onKey = (event) => {
            if (event.key === 'Escape') {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [showEmojiPicker]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages.length]);

    useEffect(() => {
        const instanceId = import.meta.env.VITE_BEAMS_INSTANCE_ID;
        if (!instanceId || !auth?.user?.id || isAdmin) return;
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        try {
            const beams = new BeamsClient({
                instanceId,
            });

            beams
                .start()
                .then(() => beams.addDeviceInterest(`user-${auth.user.id}`))
                .catch(() => {});
        } catch (error) {
            // Ignore unsupported browser errors.
        }
    }, [auth?.user?.id]);

    useEffect(() => {
        if (isAdmin) return;
        if (auth?.user?.id) return;
        const instanceId = import.meta.env.VITE_BEAMS_INSTANCE_ID;
        if (!instanceId || !chat?.public_token) return;
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        try {
            const beams = new BeamsClient({ instanceId });
            beams
                .start()
                .then(() => beams.addDeviceInterest(`public-${chat.public_token}`))
                .catch(() => {});
        } catch (error) {
            // Ignore unsupported browser errors.
        }
    }, [chat?.public_token, auth?.user?.id, isAdmin]);

    const sendMessage = async (event) => {
        event.preventDefault();
        if (!canSend) return;
        ensureNotifications();

        const body = data.body.trim();
        setData('body', '');

        try {
            const payload = new FormData();
            if (body.length > 0) {
                payload.append('body', body);
            }
            if (attachment) {
                payload.append('attachment', attachment);
            }

            const response = isAdmin
                ? await window.axios.post(`/chat/${chat.id}/messages`, payload, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                  })
                : await window.axios.post(`/chat/public/${chat.public_token ?? chat.id}/messages`, payload, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                  });
            setMessages((prev) => [
                ...prev,
                {
                    id: response.data.id,
                    user_id: response.data.user_id,
                    sender_name: response.data.sender_name,
                    sender_role: response.data.sender_role,
                    body,
                    attachment_path: response.data.attachment_path,
                    attachment_name: response.data.attachment_name,
                    attachment_mime: response.data.attachment_mime,
                    attachment_size: response.data.attachment_size,
                    attachment_type: response.data.attachment_type,
                    created_at: response.data.created_at,
                },
            ]);
            reset('body');
            setAttachment(null);
        } catch (error) {
            setData('body', body);
        }
    };

    const renderAttachment = (message) => {
        if (!message?.attachment_path) return null;

        const url = `/storage/${message.attachment_path}`;
        const label = message.attachment_name || 'Archivo adjunto';

        if (message.attachment_type === 'image') {
            return (
                <a href={url} target="_blank" rel="noreferrer">
                    <img
                        src={url}
                        alt={label}
                        className="mt-3 max-h-56 w-full rounded-xl object-cover"
                    />
                </a>
            );
        }

        return (
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/60"
            >
                {label}
            </a>
        );
    };

    const closeChat = async () => {
        if (!isAdmin) return;
        if (closingChat) return;
        setClosingChat(true);
        await window.axios.post(`/admin/chat/${chat.id}/close`);
        window.location.href = '/dashboard';
    };

    if (!isAdmin && chatStatus !== 'active') {
        return (
            <>
                <Head title="Chat no disponible" />
                <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100 sm:px-8">
                    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/70 p-10 text-center shadow-2xl shadow-slate-950/60">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/60 text-cyan-200">
                            <FiMessageSquare className="h-8 w-8" />
                        </div>
                        <h1 className="mt-6 text-2xl font-semibold text-white">Chat no disponible</h1>
                        <p className="mt-2 text-sm text-slate-300">
                            Este chat se cerro o expiro. Puedes solicitar uno nuevo.
                        </p>
                        <a
                            href="/chat/request"
                            className="mt-6 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                        >
                            Volver a chatear
                        </a>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Head title="Chat Activo" />
            <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100 sm:px-8">
                <div className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/60">
                    <PwaStatusPanel publicToken={chat?.public_token} userId={auth?.user?.id} isAdmin={isAdmin} />
                    <PwaInstallBanner onEnableNotifications={ensureNotifications} />
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={ensureNotifications}
                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                                notificationsEnabled
                                    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                                    : 'border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20'
                            }`}
                        >
                            <FiBell className="h-4 w-4" />
                            {notificationsEnabled ? 'Notificaciones activas' : 'Notificaciones inactivas'}
                        </button>
                    </div>
                    <header className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-semibold text-white">Chat Activo</h1>
                            <p className="mt-2 text-sm text-slate-300">
                                {isAdmin
                                    ? `Usuario: ${chat?.user_name ?? 'Usuario'}`
                                    : `Usuario: ${viewer?.name ?? 'Usuario'}`}
                            </p>
                            {isAdmin && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <a
                                        href="/dashboard"
                                        className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                                    >
                                        Volver al dashboard
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
                            Expira: {endsAt ? endsAt.toLocaleString() : 'Sin fecha'}
                        </div>
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={closeChat}
                                disabled={closingChat}
                                className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
                            >
                                {closingChat ? 'Cerrando...' : 'Cerrar chat'}
                            </button>
                        )}
                    </header>

                    <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60">
                        <div className="max-h-[420px] space-y-4 overflow-y-auto px-6 py-6">
                            {messages.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
                                    Aun no hay mensajes. Saluda para iniciar la conversacion.
                                </div>
                            ) : (
                                messages.map((message) => {
                                    const mine = isAdmin
                                        ? message.sender_role === 'admin'
                                        : message.sender_role === 'user';
                                    const bubbleClass = mine
                                        ? 'bg-cyan-500 text-slate-950'
                                        : 'bg-slate-800 text-slate-100';

                                    return (
                                    <div
                                        key={message.id}
                                        className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${bubbleClass}`}
                                        >
                                            {!mine && (
                                                <p className="mb-1 text-[10px] uppercase tracking-[0.18em] opacity-60">
                                                    {message.sender_role === 'admin' ? 'Admin' : message.sender_name ?? 'Usuario'}
                                                </p>
                                            )}
                                            <p>{message.body}</p>
                                            {renderAttachment(message)}
                                            <p className="mt-2 text-[10px] opacity-70">
                                                {message.created_at
                                                    ? new Date(message.created_at).toLocaleTimeString()
                                                    : ''}
                                            </p>
                                        </div>
                                    </div>
                                );
                                })
                            )}
                            <div ref={bottomRef} />
                        </div>
                        <form onSubmit={sendMessage} className="border-t border-slate-800 px-6 py-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="relative flex w-full items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2">
                                    <label className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-slate-700 bg-slate-950/60 text-slate-200 transition hover:border-cyan-400/60">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="h-5 w-5"
                                        >
                                            <path d="M21.44 11.05 12 20.5a6 6 0 0 1-8.49-8.49l8.49-8.49a4 4 0 0 1 5.66 5.66l-8.49 8.49a2 2 0 1 1-2.83-2.83L15.5 6.5" />
                                        </svg>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="hidden"
                                            onChange={(event) => {
                                                const file = event.target.files?.[0] ?? null;
                                                setAttachment(file);
                                            }}
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/60 text-base text-slate-200 transition hover:border-cyan-400/60"
                                        title="Emojis"
                                    >
                                        🙂
                                    </button>
                                    <input
                                        type="text"
                                        value={data.body}
                                        onChange={(event) => setData('body', event.target.value)}
                                        placeholder="Escribe un mensaje..."
                                        className="flex-1 bg-transparent px-1 py-2 text-sm text-slate-100 outline-none"
                                    />
                                    {showEmojiPicker && (
                                        <div
                                            ref={emojiPickerRef}
                                            className="absolute left-0 bottom-14 z-20"
                                        >
                                            <Picker
                                                data={emojiData}
                                                theme="dark"
                                                onEmojiSelect={(emoji) => {
                                                    const next = `${data.body}${emoji.native}`;
                                                    setData('body', next);
                                                    setShowEmojiPicker(false);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={processing || !canSend}
                                    className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Enviar
                                </button>
                            </div>
                            {attachment && (
                                <div className="mt-3 text-xs text-slate-300">
                                    Archivo seleccionado: {attachment.name}
                                </div>
                            )}
                            {attachmentPreview && (
                                <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                                    <img
                                        src={attachmentPreview}
                                        alt="Vista previa"
                                        className="max-h-56 w-full rounded-xl object-cover"
                                    />
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </main>
        </>
    );
}
