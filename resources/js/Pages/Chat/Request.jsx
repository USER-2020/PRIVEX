import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FiClock } from 'react-icons/fi';
import { Client as BeamsClient } from '@pusher/push-notifications-web';
import PwaInstallBanner from '@/Components/PwaInstallBanner';

export default function Request() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const { flash, token } = usePage().props;
    const { auth } = usePage().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        display_name: '',
        photo: null,
    });

    const startCamera = async () => {
        if (stream) return;
        await enableNotifications();
        const media = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
        });
        setStream(media);
        if (videoRef.current) {
            videoRef.current.srcObject = media;
        }
    };

    const stopCamera = () => {
        if (!stream) return;
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
    };

    const capture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
            setData('photo', file);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
        }, 'image/jpeg', 0.92);
    };

    const submit = (event) => {
        event.preventDefault();
        enableNotifications();
        post('/chat/request', {
            forceFormData: true,
            onSuccess: () => {
                reset('photo');
                stopCamera();
            },
        });
    };

    const hasPhoto = useMemo(() => Boolean(data.photo), [data.photo]);

    const enableNotifications = async () => {
        if (!('Notification' in window)) return;
        if (window.Notification.permission === 'default') {
            await window.Notification.requestPermission();
        }
    };

    useEffect(() => {
        if (!token) return;
        const instanceId = import.meta.env.VITE_BEAMS_INSTANCE_ID;
        if (!instanceId) return;
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        try {
            const beams = new BeamsClient({ instanceId });
            beams
                .start()
                .then(() => beams.addDeviceInterest(`public-${token}`))
                .catch(() => {});
        } catch (error) {
            // Ignore unsupported browser errors.
        }
    }, [token]);

    useEffect(() => {
        if (!window.Echo) return;

        if (token) {
            const channel = window.Echo.channel(`public-approval.${token}`);
            channel.listen('.chat.approved', () => {
                console.log('[public-approval] chat.approved', token);
                window.location.href = `/chat/public/${token}`;
            });

            return () => {
                channel.stopListening('.chat.approved');
                window.Echo.leave(`public-approval.${token}`);
            };
        }

        if (!auth?.user?.id) return;

        const channel = window.Echo.private(`user.${auth.user.id}`);
        channel.listen('.chat.approved', () => {
            console.log('[user] chat.approved', auth.user.id);
            window.location.href = '/chat';
        });

        return () => {
            channel.stopListening('.chat.approved');
            window.Echo.leave(`private-user.${auth.user.id}`);
        };
    }, [auth?.user?.id, token]);

    if (token && flash?.status) {
        return (
            <>
                <Head title="Solicitud enviada" />
                <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100 sm:px-8">
                    <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center">
                        <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center shadow-2xl shadow-slate-950/70">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/60 text-cyan-200">
                                <FiClock className="h-8 w-8" />
                            </div>
                            <h1 className="mt-6 text-2xl font-semibold text-white">Solicitud enviada</h1>
                            <p className="mt-2 text-sm text-slate-300">
                                Estamos esperando la aprobacion del admin. Te avisaremos cuando el chat este listo.
                            </p>
                            <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                                {flash.status}
                            </div>
                        </div>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Head title="Solicitud de Chat" />

            <main className="min-h-screen bg-slate-950 text-slate-100">
                <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-8">
                    <section className="grid w-full gap-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/70 backdrop-blur sm:grid-cols-[1.2fr_1fr] sm:p-10">
                        <div>
                            <p className="text-sm uppercase tracking-[0.22em] text-cyan-300/80">
                                Verificacion privada
                            </p>
                            <div className="mt-4">
                                <PwaInstallBanner onEnableNotifications={enableNotifications} />
                            </div>
                            <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                                Captura tu foto frontal y confirma tu nombre
                            </h1>
                            <p className="mt-3 max-w-lg text-sm text-slate-300">
                                Tu foto sera revisada por un administrador. El chat se habilita solo
                                despues de la aprobacion y toda tu información se borra en 24 horas.
                            </p>

                            {flash?.status && (
                                <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                                    {flash.status}
                                </div>
                            )}

                            <form onSubmit={submit} className="mt-8 space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-200">
                                        Nombre o apodo
                                    </label>
                                    <input
                                        type="text"
                                        value={data.display_name}
                                        onChange={(event) => setData('display_name', event.target.value)}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
                                        placeholder="Tu nombre en el chat"
                                    />
                                    {errors.display_name && (
                                        <p className="mt-1 text-xs text-rose-400">{errors.display_name}</p>
                                    )}
                                </div>

                                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={startCamera}
                                            className="rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                                        >
                                            Activar camara
                                        </button>
                                        <button
                                            type="button"
                                            onClick={capture}
                                            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
                                        >
                                            Tomar foto
                                        </button>
                                        <button
                                            type="button"
                                            onClick={stopCamera}
                                            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                                        >
                                            Apagar camara
                                        </button>
                                    </div>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                className="aspect-video w-full rounded-xl bg-slate-900"
                                            />
                                        </div>
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                                            {previewUrl ? (
                                                <img
                                                    src={previewUrl}
                                                    alt="Vista previa"
                                                    className="aspect-video w-full rounded-xl object-cover"
                                                />
                                            ) : (
                                                <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-slate-700 text-xs text-slate-500">
                                                    Sin captura
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {errors.photo && <p className="mt-1 text-xs text-rose-400">{errors.photo}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || !hasPhoto}
                                    className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing ? 'Enviando...' : 'Enviar solicitud'}
                                </button>
                            </form>
                        </div>

                        <aside className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 text-sm text-slate-300 sm:p-8">
                            <h2 className="text-lg font-semibold text-white">Flujo de validacion</h2>
                            <ol className="mt-4 space-y-3 text-sm text-slate-300">
                                <li>1. Envias tu foto frontal y nombre.</li>
                                <li>2. Un admin valida manualmente tu identidad.</li>
                                <li>3. Se habilita el chat por 24 horas.</li>
                            </ol>
                            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
                                Tu foto solo se usa para la aprobacion inicial. Si hay rechazo, puedes reenviar.
                            </div>
                        </aside>
                    </section>
                </div>
            </main>

            <canvas ref={canvasRef} className="hidden" />
        </>
    );
}
