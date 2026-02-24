<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\ChatRequest;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $isAdmin = method_exists($user, 'hasRole') && $user->hasRole('admin');

        if ($isAdmin) {
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
                'user_name' => $chat->user?->name ?? $chat->chatRequest?->display_name ?? 'Usuario',
                    'ends_at' => $chat->ends_at?->toIso8601String(),
                    'started_at' => $chat->started_at?->toIso8601String(),
                ]),
            ]);
        }

        return redirect()->route('chat.request');
    }
}
