<?php

namespace App\Http\Controllers;

use App\Services\BeamsClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BeamsAuthController extends Controller
{
    public function auth(Request $request, BeamsClient $beams): JsonResponse
    {
        $user = $request->user();

        $token = $beams->generateToken((string) $user->id);

        if (! $token) {
            return response()->json([
                'message' => 'Beams no configurado.',
            ], 503);
        }

        return response()->json($token);
    }
}
