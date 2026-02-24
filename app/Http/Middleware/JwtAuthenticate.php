<?php

namespace App\Http\Middleware;

use App\Http\Controllers\AuthController;
use App\Models\User;
use Closure;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use UnexpectedValueException;

class JwtAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return $this->unauthorized('Token JWT no proporcionado.');
        }

        try {
            $payload = AuthController::decodeToken($token);
        } catch (ExpiredException) {
            return $this->unauthorized('Token JWT expirado.');
        } catch (SignatureInvalidException|UnexpectedValueException) {
            return $this->unauthorized('Token JWT invalido.');
        }

        $user = User::query()->find($payload->sub ?? null);

        if (! $user) {
            return $this->unauthorized('Usuario no encontrado para este token.');
        }

        auth()->setUser($user);
        $request->setUserResolver(static fn () => $user);

        return $next($request);
    }

    private function unauthorized(string $message): JsonResponse
    {
        return response()->json([
            'message' => $message,
        ], 401);
    }
}
