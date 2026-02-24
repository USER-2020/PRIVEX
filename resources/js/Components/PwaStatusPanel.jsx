import { useEffect, useMemo, useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

const isStandalone = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
};

const isIos = () => {
    if (typeof window === 'undefined') return false;
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
};

export default function PwaStatusPanel({ userId, publicToken, isAdmin, onEnableNotifications, notifState, iosSubscriptionSent }) {
    const [open, setOpen] = useState(false);
    const [swReady, setSwReady] = useState(false);
    const [swScope, setSwScope] = useState('');
    const [echoState, setEchoState] = useState('unknown');
    const [notifPermission, setNotifPermission] = useState('unsupported');
    const [testStatus, setTestStatus] = useState('idle');

    const ios = useMemo(() => isIos(), []);
    const standalone = useMemo(() => isStandalone(), []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if ('Notification' in window) {
            setNotifPermission(window.Notification.permission);
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready
                .then((reg) => {
                    setSwReady(true);
                    setSwScope(reg.scope || '');
                })
                .catch(() => {
                    setSwReady(false);
                });
        }

        try {
            const pusher = window.Echo?.connector?.pusher;
            const state = pusher?.connection?.state;
            if (state) setEchoState(state);
        } catch (error) {
            setEchoState('unknown');
        }
    }, [open]);

    const channels = [
        isAdmin ? 'admin.chat-requests' : null,
        userId ? `user.${userId}` : null,
        publicToken ? `public-${publicToken}` : null,
        publicToken ? `public-chat.${publicToken}` : null,
    ].filter(Boolean);

    const Badge = ({ label, value, tone = 'slate' }) => {
        const tones = {
            slate: 'border-slate-700 bg-slate-900/70 text-slate-200',
            emerald: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
            rose: 'border-rose-400/40 bg-rose-500/10 text-rose-200',
            amber: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
            cyan: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200',
        };

        return (
            <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold ${tones[tone]}`}
            >
                <span className="opacity-70">{label}:</span>
                <span>{value}</span>
            </span>
        );
    };

    const notifValue = notifState ?? notifPermission;
    const notifTone =
        notifValue === 'granted' ? 'emerald' : notifValue === 'denied' ? 'rose' : 'amber';
    const iosSubValue =
        iosSubscriptionSent === true ? 'enviada' : iosSubscriptionSent === false ? 'no' : 'n/a';
    const iosSubTone =
        iosSubscriptionSent === true ? 'emerald' : iosSubscriptionSent === false ? 'rose' : 'slate';

    return (
        <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-200">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="flex w-full items-center justify-between text-left text-xs font-semibold text-slate-100"
            >
                <span>Estado de PWA y canales</span>
                {open ? <FiChevronUp /> : <FiChevronDown />}
            </button>

            {open && (
                <div className="mt-4 space-y-3 text-[11px] text-slate-300">
                    <div className="flex flex-wrap gap-2">
                        <Badge label="Plataforma" value={ios ? 'iOS' : 'Otro'} tone="cyan" />
                        <Badge label="Standalone" value={standalone ? 'si' : 'no'} tone={standalone ? 'emerald' : 'amber'} />
                        <Badge label="Notificaciones" value={notifValue} tone={notifTone} />
                        <Badge label="Service Worker" value={swReady ? 'listo' : 'no'} tone={swReady ? 'emerald' : 'rose'} />
                        <Badge label="Suscripcion iOS" value={iosSubValue} tone={iosSubTone} />
                        <Badge label="Echo/Pusher" value={echoState} tone={echoState === 'connected' ? 'emerald' : 'amber'} />
                    </div>
                    {onEnableNotifications && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={onEnableNotifications}
                                className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-[11px] font-semibold transition ${
                                    notifValue === 'granted'
                                        ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                                        : 'border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20'
                                }`}
                            >
                                Notificaciones {notifValue === 'granted' ? 'activas' : 'inactivas'}
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    const targetChannel = channels[0];
                                    if (!targetChannel) return;
                                    setTestStatus('sending');
                                    try {
                                        const csrf =
                                            document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
                                        await fetch('/push/test', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-Requested-With': 'XMLHttpRequest',
                                                'X-CSRF-TOKEN': csrf,
                                            },
                                            body: JSON.stringify({
                                                channel: targetChannel,
                                                title: 'Test iOS',
                                                body: 'Notificacion de prueba',
                                                url: '/chat',
                                            }),
                                        });
                                        setTestStatus('sent');
                                    } catch (error) {
                                        setTestStatus('error');
                                    }
                                }}
                                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-1 text-[11px] font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                            >
                                Test push {testStatus === 'sending' ? '…' : testStatus === 'sent' ? 'ok' : testStatus === 'error' ? 'error' : ''}
                            </button>
                        </div>
                    )}
                    {swScope && (
                        <div className="flex flex-wrap gap-2">
                            <Badge label="SW scope" value={swScope} tone="slate" />
                        </div>
                    )}
                    <div className="text-xs font-semibold text-slate-100">Canales esperados</div>
                    <div className="flex flex-wrap gap-2">
                        {channels.length === 0 ? (
                            <Badge label="Canal" value="ninguno" tone="rose" />
                        ) : (
                            channels.map((channel) => (
                                <Badge key={channel} label="Canal" value={channel} tone="slate" />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
