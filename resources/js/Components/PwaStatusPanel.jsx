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

export default function PwaStatusPanel({ userId, publicToken, isAdmin }) {
    const [open, setOpen] = useState(false);
    const [swReady, setSwReady] = useState(false);
    const [swScope, setSwScope] = useState('');
    const [echoState, setEchoState] = useState('unknown');
    const [notifPermission, setNotifPermission] = useState('unsupported');

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
    }, []);

    const channels = [
        isAdmin ? 'admin.chat-requests' : null,
        userId ? `user.${userId}` : null,
        publicToken ? `public-${publicToken}` : null,
        publicToken ? `public-chat.${publicToken}` : null,
    ].filter(Boolean);

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
                <div className="mt-3 grid gap-2 text-[11px] text-slate-300">
                    <div>Plataforma: {ios ? 'iOS' : 'Otro'}</div>
                    <div>Standalone: {standalone ? 'si' : 'no'}</div>
                    <div>Notificaciones: {notifPermission}</div>
                    <div>Service Worker: {swReady ? 'listo' : 'no'}</div>
                    {swScope && <div>SW scope: {swScope}</div>}
                    <div>Echo/Pusher: {echoState}</div>
                    <div>Canales esperados:</div>
                    {channels.length === 0 ? (
                        <div>- ninguno</div>
                    ) : (
                        channels.map((channel) => <div key={channel}>- {channel}</div>)
                    )}
                </div>
            )}
        </div>
    );
}
