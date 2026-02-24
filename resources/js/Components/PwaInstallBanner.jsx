import { useEffect, useMemo, useState } from 'react';

const isIos = () => {
    if (typeof window === 'undefined') return false;
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
};

const isStandalone = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
};

export default function PwaInstallBanner({ onEnableNotifications }) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [standalone, setStandalone] = useState(isStandalone());
    const isIOS = useMemo(() => isIos(), []);
    const canNotify =
        typeof window !== 'undefined' &&
        'Notification' in window &&
        window.Notification.permission === 'default';

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const onPrompt = (event) => {
            event.preventDefault();
            setDeferredPrompt(event);
        };
        window.addEventListener('beforeinstallprompt', onPrompt);
        return () => window.removeEventListener('beforeinstallprompt', onPrompt);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const onVisibility = () => setStandalone(isStandalone());
        window.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('appinstalled', onVisibility);
        return () => {
            window.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('appinstalled', onVisibility);
        };
    }, []);

    const install = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        try {
            await deferredPrompt.userChoice;
        } finally {
            setDeferredPrompt(null);
        }
    };

    if (isIOS && !standalone) {
        return (
            <div className="mb-6 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-100">
                Para activar notificaciones en iOS, instala la app:
                <div className="mt-2">1. Pulsa “Compartir” en Safari.</div>
                <div>2. “Agregar a pantalla de inicio”.</div>
                <div>3. Abre la app instalada y acepta permisos.</div>
            </div>
        );
    }

    return (
        <div className="mb-6 flex flex-wrap items-center gap-3">
            {deferredPrompt && (
                <button
                    type="button"
                    onClick={install}
                    className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                >
                    Instalar app
                </button>
            )}
            {standalone && canNotify && onEnableNotifications && (
                <button
                    type="button"
                    onClick={onEnableNotifications}
                    className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                >
                    Activar notificaciones
                </button>
            )}
        </div>
    );
}
