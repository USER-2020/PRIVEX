<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PushAckController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        Log::info('webpush.ack', [
            'ip' => $request->ip(),
            'payload' => $request->all(),
        ]);

        return response()->json(['ok' => true]);
    }
}
