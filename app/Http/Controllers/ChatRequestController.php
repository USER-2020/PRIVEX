<?php

namespace App\Http\Controllers;

use App\Events\ChatApprovedBroadcast;
use App\Events\ChatApprovedAdmin;
use App\Events\ChatApprovedPublic;
use App\Events\ChatQueueUpdated;
use App\Events\ChatRequestSubmitted;
use App\Models\Chat;
use App\Models\ChatRequest;
use App\Models\User;
use App\Notifications\ChatApproved;
use App\Notifications\ChatEventNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ChatRequestController extends Controller
{
    public function create(Request $request): Response
    {
        $token = $request->query('token');
        $queuePosition = $this->queuePositionForToken($token);

        return Inertia::render('Chat/Request', [
            'token' => $token,
            'queue' => $queuePosition ? ['position' => $queuePosition] : null,
        ]);
    }

    public function queue(Request $request): JsonResponse
    {
        $position = $this->queuePositionForToken($request->query('token'));

        return response()->json([
            'position' => $position,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'display_name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:120'],
            'photo' => ['required', 'image', 'max:4096'],
        ]);

        $path = $request->file('photo')->store('chat-requests', 'public');

        $chatRequest = ChatRequest::create([
            'user_id' => $request->user()?->id,
            'display_name' => $data['display_name'],
            'email' => $data['email'],
            'photo_path' => $path,
            'public_token' => Str::uuid()->toString(),
            'status' => 'pending',
        ]);

        broadcast(new ChatRequestSubmitted($chatRequest))->toOthers();
        $this->broadcastQueuePositions();

        User::role('admin')->get()->each->notify(new ChatEventNotification(
            'Nueva solicitud de chat',
            'Hay una nueva solicitud de chat.',
            'Ver solicitudes',
            url('/admin/chat-requests')
        ));

        return redirect()
            ->route('chat.request', ['token' => $chatRequest->public_token])
            ->with('status', 'Solicitud enviada. Espera validacion del admin.');
    }

    public function adminIndex(): Response
    {
        $requests = ChatRequest::query()
            ->where('status', 'pending')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get(['id', 'display_name', 'photo_path', 'created_at']);

        $activeChats = Chat::query()
            ->where('status', 'active')
            ->latest('started_at')
            ->with(['user:id,name', 'chatRequest:id,display_name'])
            ->get(['id', 'user_id', 'chat_request_id', 'ends_at', 'started_at']);

        return Inertia::render('Admin/ChatRequests', [
            'requests' => $requests,
            'activeChats' => $activeChats->map(fn ($chat) => [
                'id' => $chat->id,
                'user_name' => $chat->chatRequest?->display_name ?? $chat->user?->name ?? 'Usuario',
                'ends_at' => $chat->ends_at?->toIso8601String(),
                'started_at' => $chat->started_at?->toIso8601String(),
            ]),
        ]);
    }

    public function approve(ChatRequest $chatRequest): RedirectResponse
    {
        $now = Carbon::now();

        $chat = DB::transaction(function () use ($chatRequest, $now) {
            $chatRequest->update([
                'status' => 'approved',
                'approved_at' => $now,
                'expires_at' => $now->copy()->addHours(24),
                'rejected_at' => null,
            ]);

            $chat = Chat::create([
                'user_id' => $chatRequest->user_id,
                'chat_request_id' => $chatRequest->id,
                'public_token' => $chatRequest->public_token,
                'status' => 'active',
                'started_at' => $now,
                'ends_at' => $now->copy()->addHours(24),
            ]);

            if ($chatRequest->user_id) {
                $chatRequest->user?->notify(new ChatApproved($chat));
            } elseif ($chatRequest->email) {
                Notification::route('mail', $chatRequest->email)->notify(new ChatEventNotification(
                    'Chat aprobado',
                    'Tu solicitud fue aprobada. Ya puedes chatear.',
                    'Entrar al chat',
                    url("/chat/public/{$chatRequest->public_token}")
                ));
            }

            return $chat;
        });

        broadcast(new ChatApprovedPublic(
            $chatRequest->public_token,
            $chat->ends_at?->toIso8601String() ?? $now->copy()->addHours(24)->toIso8601String()
        ));

        broadcast(new ChatApprovedAdmin($chat));

        if ($chatRequest->user_id) {
            broadcast(new ChatApprovedBroadcast($chat))->toOthers();
        }

        $this->broadcastQueuePositions();

        return back()->with('status', 'Solicitud aprobada.');
    }

    public function reject(ChatRequest $chatRequest): RedirectResponse
    {
        $chatRequest->update([
            'status' => 'rejected',
            'rejected_at' => Carbon::now(),
            'approved_at' => null,
            'expires_at' => null,
        ]);

        $this->broadcastQueuePositions();

        return back()->with('status', 'Solicitud rechazada.');
    }

    private function queuePositionForToken(?string $token): ?int
    {
        if (! $token) {
            return null;
        }

        $chatRequest = ChatRequest::query()
            ->where('public_token', $token)
            ->where('status', 'pending')
            ->first(['id', 'created_at']);

        if (! $chatRequest) {
            return null;
        }

        $beforeCount = ChatRequest::query()
            ->where('status', 'pending')
            ->where(function ($query) use ($chatRequest) {
                $query->where('created_at', '<', $chatRequest->created_at)
                    ->orWhere(function ($subQuery) use ($chatRequest) {
                        $subQuery->where('created_at', $chatRequest->created_at)
                            ->where('id', '<', $chatRequest->id);
                    });
            })
            ->count();

        return $beforeCount + 1;
    }

    private function broadcastQueuePositions(): void
    {
        $pending = ChatRequest::query()
            ->where('status', 'pending')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get(['public_token']);

        $position = 1;
        foreach ($pending as $request) {
            if (! $request->public_token) {
                continue;
            }

            broadcast(new ChatQueueUpdated($request->public_token, $position));
            $position++;
        }
    }
}
