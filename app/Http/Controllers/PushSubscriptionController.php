<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'channel' => ['required', 'string', 'max:200'],
            'platform' => ['nullable', 'string', 'max:32'],
            'public_token' => ['nullable', 'string', 'max:80'],
            'subscription' => ['required', 'array'],
            'subscription.endpoint' => ['required', 'string', 'max:500'],
            'subscription.keys' => ['required', 'array'],
            'subscription.keys.p256dh' => ['required', 'string'],
            'subscription.keys.auth' => ['required', 'string'],
        ]);

        $subscription = $data['subscription'];
        $platform = $data['platform'] ?? 'ios_webpush';

        PushSubscription::updateOrCreate(
            [
                'endpoint' => $subscription['endpoint'],
                'channel' => $data['channel'],
            ],
            [
                'user_id' => $request->user()?->id,
                'public_token' => $data['public_token'] ?? null,
                'platform' => $platform,
                'subscription' => $subscription,
            ]
        );

        return response()->json(['ok' => true]);
    }
}
