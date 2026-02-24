<?php

namespace App\Http\Controllers;

use App\Events\ChatApprovedBroadcast;
use App\Events\ChatApprovedAdmin;
use App\Events\ChatApprovedPublic;
use App\Events\ChatRequestSubmitted;
use App\Models\Chat;
use App\Models\ChatRequest;
use App\Notifications\ChatApproved;
use App\Services\BeamsClient;
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
        return Inertia::render('Chat/Request', [
            'token' => $request->query('token'),
        ]);
    }

    public function store(Request $request, BeamsClient $beams): RedirectResponse
    {
        $data = $request->validate([
            'display_name' => ['required', 'string', 'max:80'],
            'photo' => ['required', 'image', 'max:4096'],
        ]);

        $path = $request->file('photo')->store('chat-requests', 'public');

        $chatRequest = ChatRequest::create([
            'user_id' => $request->user()?->id,
            'display_name' => $data['display_name'],
            'photo_path' => $path,
            'public_token' => Str::uuid()->toString(),
            'status' => 'pending',
        ]);

        broadcast(new ChatRequestSubmitted($chatRequest))->toOthers();

        $beams->notifyInterest(
            'admin',
            'Nueva solicitud de chat',
            "Solicitud de {$chatRequest->display_name}",
            ['url' => url('/admin/chat-requests')]
        );

        return redirect()
            ->route('chat.request', ['token' => $chatRequest->public_token])
            ->with('status', 'Solicitud enviada. Espera validacion del admin.');
    }

    public function adminIndex(): Response
    {
        $requests = ChatRequest::query()
            ->where('status', 'pending')
            ->latest()
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

    public function approve(ChatRequest $chatRequest, BeamsClient $beams): RedirectResponse
    {
        $now = Carbon::now();

        $chat = DB::transaction(function () use ($chatRequest, $now, $beams) {
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

                $beams->notifyUser(
                    $chatRequest->user_id,
                    'Chat aprobado',
                    'Tu solicitud fue aprobada. Ya puedes chatear.',
                    ['url' => url('/chat')]
                );
            }

            if ($chatRequest->public_token) {
                $beams->notifyInterest(
                    "public-{$chatRequest->public_token}",
                    'Chat aprobado',
                    'Tu solicitud fue aprobada. Ya puedes chatear.',
                    ['url' => url("/chat/public/{$chatRequest->public_token}")]
                );
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

        return back()->with('status', 'Solicitud rechazada.');
    }
}
