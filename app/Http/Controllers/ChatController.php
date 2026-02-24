<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\ChatHistory;
use App\Events\ChatClosed;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $chat = Chat::query()
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->latest('started_at')
            ->first();

        if (! $chat) {
            return redirect()->route('chat.request')->with('status', 'No tienes un chat activo.');
        }

        if ($chat->ends_at && Carbon::now()->greaterThan($chat->ends_at)) {
            $chat->update(['status' => 'expired']);

            return redirect()->route('chat.request')->with('status', 'Tu chat expiro. Solicita uno nuevo.');
        }

        $messages = $chat->messages()
            ->latest()
            ->take(50)
            ->get()
            ->reverse()
            ->values()
            ->map(fn ($message) => [
                'id' => $message->id,
                'user_id' => $message->user_id,
                'sender_name' => $message->sender_name,
                'sender_role' => $message->sender_role,
                'body' => $message->body,
                'attachment_path' => $message->attachment_path,
                'attachment_name' => $message->attachment_name,
                'attachment_mime' => $message->attachment_mime,
                'attachment_size' => $message->attachment_size,
                'attachment_type' => $message->attachment_type,
                'created_at' => $message->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Chat/Room', [
            'chat' => [
                'id' => $chat->id,
                'public_token' => $chat->public_token,
                'status' => $chat->status,
                'ends_at' => $chat->ends_at?->toIso8601String(),
                'user_name' => $chat->user?->name,
            ],
            'messages' => $messages,
            'isAdmin' => false,
            'viewer' => [
                'role' => 'user',
                'name' => $request->user()->name,
            ],
        ]);
    }

    public function showAdmin(Request $request, Chat $chat): Response|RedirectResponse
    {
        $user = $request->user();
        $isAdmin = method_exists($user, 'hasRole') && $user->hasRole('admin');

        if (! $isAdmin) {
            return redirect()->route('dashboard')->with('status', 'No autorizado.');
        }

        if ($chat->status !== 'active') {
            return redirect()->route('dashboard')->with('status', 'El chat no esta activo.');
        }

        if ($chat->ends_at && Carbon::now()->greaterThan($chat->ends_at)) {
            $chat->update(['status' => 'expired']);
            return redirect()->route('dashboard')->with('status', 'El chat expiro.');
        }

        $messages = $chat->messages()
            ->latest()
            ->take(50)
            ->get()
            ->reverse()
            ->values()
            ->map(fn ($message) => [
                'id' => $message->id,
                'user_id' => $message->user_id,
                'sender_name' => $message->sender_name,
                'sender_role' => $message->sender_role,
                'body' => $message->body,
                'attachment_path' => $message->attachment_path,
                'attachment_name' => $message->attachment_name,
                'attachment_mime' => $message->attachment_mime,
                'attachment_size' => $message->attachment_size,
                'attachment_type' => $message->attachment_type,
                'created_at' => $message->created_at?->toIso8601String(),
            ]);

        $displayName = $chat->chatRequest?->display_name ?? $chat->user?->name ?? 'Usuario';

        return Inertia::render('Chat/Room', [
            'chat' => [
                'id' => $chat->id,
                'public_token' => $chat->public_token,
                'status' => $chat->status,
                'ends_at' => $chat->ends_at?->toIso8601String(),
                'user_name' => $displayName,
            ],
            'messages' => $messages,
            'isAdmin' => true,
            'viewer' => [
                'role' => 'admin',
                'name' => $user->name,
            ],
        ]);
    }

    public function close(Request $request, Chat $chat): RedirectResponse
    {
        $user = $request->user();
        $isAdmin = method_exists($user, 'hasRole') && $user->hasRole('admin');

        if (! $isAdmin) {
            return redirect()->route('dashboard')->with('status', 'No autorizado.');
        }

        $chat->update([
            'status' => 'closed',
            'ends_at' => Carbon::now(),
        ]);

        if ($chat->chatRequest) {
            $historyData = [
                'chat_id' => $chat->id,
                'chat_request_id' => $chat->chat_request_id,
                'user_id' => $chat->user_id,
                'display_name' => $chat->chatRequest->display_name,
                'status' => 'closed',
                'closed_reason' => 'closed',
                'ended_at' => $chat->ends_at,
                'photo_path' => $chat->chatRequest->photo_path,
                'photo_deleted_at' => $chat->chatRequest->photo_deleted_at,
            ];

            $existing = ChatHistory::where('chat_id', $chat->id)->first();
            if ($existing) {
                $existing->update($historyData);
            } else {
                ChatHistory::create($historyData);
            }
        }

        broadcast(new ChatClosed($chat))->toOthers();

        return redirect()->route('dashboard')->with('status', 'Chat cerrado.');
    }

    public function showPublic(Request $request, string $token): Response|RedirectResponse
    {
        $chat = Chat::query()
            ->where('public_token', $token)
            ->where('status', 'active')
            ->first();

        if (! $chat) {
            return redirect()->route('chat.request', ['token' => $token])->with('status', 'Chat no disponible.');
        }

        if ($chat->ends_at && Carbon::now()->greaterThan($chat->ends_at)) {
            $chat->update(['status' => 'expired']);
            return redirect()->route('chat.request', ['token' => $token])->with('status', 'Tu chat expiro.');
        }

        $messages = $chat->messages()
            ->latest()
            ->take(50)
            ->get()
            ->reverse()
            ->values()
            ->map(fn ($message) => [
                'id' => $message->id,
                'user_id' => $message->user_id,
                'sender_name' => $message->sender_name,
                'sender_role' => $message->sender_role,
                'body' => $message->body,
                'attachment_path' => $message->attachment_path,
                'attachment_name' => $message->attachment_name,
                'attachment_mime' => $message->attachment_mime,
                'attachment_size' => $message->attachment_size,
                'attachment_type' => $message->attachment_type,
                'created_at' => $message->created_at?->toIso8601String(),
            ]);

        $displayName = $chat->chatRequest?->display_name ?? 'Usuario';

        return Inertia::render('Chat/Room', [
            'chat' => [
                'id' => $chat->id,
                'public_token' => $chat->public_token,
                'status' => $chat->status,
                'ends_at' => $chat->ends_at?->toIso8601String(),
                'user_name' => $displayName,
            ],
            'messages' => $messages,
            'isAdmin' => false,
            'viewer' => [
                'role' => 'user',
                'name' => $displayName,
            ],
        ]);
    }
}
