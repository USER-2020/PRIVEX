<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\ChatRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $isAdmin = $user && method_exists($user, 'hasRole') && $user->hasRole('admin');
        $isManager = $user && method_exists($user, 'hasRole') && $user->hasRole('manager');

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
                    'user_name' => $chat->chatRequest?->display_name ?? $chat->user?->name ?? 'Usuario',
                    'ends_at' => $chat->ends_at?->toIso8601String(),
                    'started_at' => $chat->started_at?->toIso8601String(),
                ]),
            ]);
        }

        if ($isManager) {
            $users = User::query()
                ->latest()
                ->get(['id', 'name', 'email', 'created_at']);

            return Inertia::render('Manager/Dashboard', [
                'users' => $users->map(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'created_at' => $user->created_at?->toIso8601String(),
                ]),
            ]);
        }

        return redirect()->route('chat.request');
    }
}
