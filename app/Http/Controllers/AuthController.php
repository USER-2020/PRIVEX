<?php

namespace App\Http\Controllers;

use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function apiLogin(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'Credenciales invalidas.',
            ], 401);
        }

        $token = $this->generateToken($user);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => (int) env('JWT_TTL', 3600),
            'user' => $user,
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'roles' => $user->getRoleNames(),
        ]);
    }

    public function apiLogout(): JsonResponse
    {
        return response()->json([
            'message' => 'Logout OK. El token se invalida del lado cliente (o con blacklist si lo implementas).',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => $user,
            'permissions' => $user?->getAllPermissions()->pluck('name') ?? [],
            'roles' => $user?->getRoleNames() ?? [],
        ]);
    }

    private function generateToken(User $user): string
    {
        $ttl = (int) env('JWT_TTL', 3600);
        $now = Carbon::now()->timestamp;

        $payload = [
            'iss' => config('app.url'),
            'sub' => $user->getKey(),
            'iat' => $now,
            'exp' => $now + $ttl,
            'email' => $user->email,
        ];

        return JWT::encode($payload, $this->jwtSecret(), 'HS256');
    }

    private function jwtSecret(): string
    {
        $secret = (string) env('JWT_SECRET', '');

        if ($secret !== '') {
            return $secret;
        }

        return (string) config('app.key');
    }

    public static function decodeToken(string $token): object
    {
        $secret = (string) env('JWT_SECRET', (string) config('app.key'));

        return JWT::decode($token, new Key($secret, 'HS256'));
    }
}
