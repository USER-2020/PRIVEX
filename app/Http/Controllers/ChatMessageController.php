<?php

namespace App\Http\Controllers;

use App\Events\ChatMessageSent;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Services\BeamsClient;
use App\Services\WebPushClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ChatMessageController extends Controller
{
    public function store(Request $request, Chat $chat, BeamsClient $beams, WebPushClient $webPush): JsonResponse
    {
        $user = $request->user();
        $isAdmin = method_exists($user, 'hasRole') && $user->hasRole('admin');

        if (! $isAdmin && $chat->user_id !== $user->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ($chat->status !== 'active') {
            return response()->json(['message' => 'El chat no esta activo.'], 422);
        }

        if ($chat->ends_at && Carbon::now()->greaterThan($chat->ends_at)) {
            $chat->update(['status' => 'expired']);
            return response()->json(['message' => 'El chat expiro.'], 422);
        }

        $data = $request->validate([
            'body' => ['nullable', 'string', 'max:2000', 'required_without:attachment'],
            'attachment' => ['nullable', 'file', 'max:8192', 'mimes:jpg,jpeg,png,webp,pdf'],
        ]);

        $attachment = $request->file('attachment');
        $attachmentPath = null;
        $attachmentName = null;
        $attachmentMime = null;
        $attachmentSize = null;
        $attachmentType = null;

        if ($attachment) {
            $attachmentPath = $attachment->store('chat-attachments', 'public');
            $attachmentName = $attachment->getClientOriginalName();
            $attachmentMime = $attachment->getClientMimeType();
            $attachmentSize = $attachment->getSize();
            $attachmentType = str_starts_with($attachmentMime ?? '', 'image/') ? 'image' : 'file';
        }

        $message = ChatMessage::create([
            'chat_id' => $chat->id,
            'user_id' => $request->user()->id,
            'body' => $data['body'] ?? '',
            'sender_name' => $user->name,
            'sender_role' => $isAdmin ? 'admin' : 'user',
            'attachment_path' => $attachmentPath,
            'attachment_name' => $attachmentName,
            'attachment_mime' => $attachmentMime,
            'attachment_size' => $attachmentSize,
            'attachment_type' => $attachmentType,
        ]);

        broadcast(new ChatMessageSent($message))->toOthers();

        if (! $isAdmin) {
            return response()->json([
                'id' => $message->id,
                'user_id' => $message->user_id,
                'body' => $message->body,
                'sender_name' => $message->sender_name,
                'sender_role' => $message->sender_role,
                'attachment_path' => $message->attachment_path,
                'attachment_name' => $message->attachment_name,
                'attachment_mime' => $message->attachment_mime,
                'attachment_size' => $message->attachment_size,
                'attachment_type' => $message->attachment_type,
                'created_at' => $message->created_at?->toIso8601String(),
            ]);
        }

        if ($chat->public_token) {
            $beams->notifyInterest(
                "public-{$chat->public_token}",
                'Nuevo mensaje de PRIVEXX',
                $message->body !== '' ? $message->body : 'Tienes un nuevo archivo.',
                ['url' => url("/chat/public/{$chat->public_token}")]
            );
            $webPush->notifyChannel(
                "public-{$chat->public_token}",
                'Nuevo mensaje de PRIVEXX',
                $message->body !== '' ? $message->body : 'Tienes un nuevo archivo.',
                ['url' => url("/chat/public/{$chat->public_token}")]
            );
        }

        return response()->json([
            'id' => $message->id,
            'user_id' => $message->user_id,
            'body' => $message->body,
            'sender_name' => $message->sender_name,
            'sender_role' => $message->sender_role,
            'attachment_path' => $message->attachment_path,
            'attachment_name' => $message->attachment_name,
            'attachment_mime' => $message->attachment_mime,
            'attachment_size' => $message->attachment_size,
            'attachment_type' => $message->attachment_type,
            'created_at' => $message->created_at?->toIso8601String(),
        ]);
    }

    public function storePublic(Request $request, string $token, BeamsClient $beams, WebPushClient $webPush): JsonResponse
    {
        $chat = Chat::query()
            ->where('public_token', $token)
            ->where('status', 'active')
            ->first();

        if (! $chat) {
            return response()->json(['message' => 'Chat no disponible.'], 404);
        }

        if ($chat->ends_at && Carbon::now()->greaterThan($chat->ends_at)) {
            $chat->update(['status' => 'expired']);
            return response()->json(['message' => 'El chat expiro.'], 422);
        }

        $data = $request->validate([
            'body' => ['nullable', 'string', 'max:2000', 'required_without:attachment'],
            'attachment' => ['nullable', 'file', 'max:8192', 'mimes:jpg,jpeg,png,webp,pdf'],
        ]);

        $attachment = $request->file('attachment');
        $attachmentPath = null;
        $attachmentName = null;
        $attachmentMime = null;
        $attachmentSize = null;
        $attachmentType = null;

        if ($attachment) {
            $attachmentPath = $attachment->store('chat-attachments', 'public');
            $attachmentName = $attachment->getClientOriginalName();
            $attachmentMime = $attachment->getClientMimeType();
            $attachmentSize = $attachment->getSize();
            $attachmentType = str_starts_with($attachmentMime ?? '', 'image/') ? 'image' : 'file';
        }

        $senderName = $chat->chatRequest?->display_name ?? 'Usuario';

        $message = ChatMessage::create([
            'chat_id' => $chat->id,
            'user_id' => null,
            'body' => $data['body'] ?? '',
            'sender_name' => $senderName,
            'sender_role' => 'user',
            'attachment_path' => $attachmentPath,
            'attachment_name' => $attachmentName,
            'attachment_mime' => $attachmentMime,
            'attachment_size' => $attachmentSize,
            'attachment_type' => $attachmentType,
        ]);

        broadcast(new ChatMessageSent($message))->toOthers();

        if ($chat->user_id) {
            $beams->notifyUser(
                $chat->user_id,
                'Nuevo mensaje',
                $message->body !== '' ? $message->body : 'Tienes un nuevo archivo.',
                ['url' => url('/chat')]
            );
            $webPush->notifyChannel(
                "user-{$chat->user_id}",
                'Nuevo mensaje',
                $message->body !== '' ? $message->body : 'Tienes un nuevo archivo.',
                ['url' => url('/chat')]
            );
        }

        $beams->notifyInterest(
            'admin',
            "Nuevo mensaje de {$senderName}",
            $message->body !== '' ? $message->body : 'Tienes un nuevo archivo.',
            ['url' => url("/admin/chat/{$chat->id}")]
        );
        $webPush->notifyChannel(
            'admin',
            "Nuevo mensaje de {$senderName}",
            $message->body !== '' ? $message->body : 'Tienes un nuevo archivo.',
            ['url' => url("/admin/chat/{$chat->id}")]
        );

        return response()->json([
            'id' => $message->id,
            'user_id' => $message->user_id,
            'body' => $message->body,
            'sender_name' => $message->sender_name,
            'sender_role' => $message->sender_role,
            'attachment_path' => $message->attachment_path,
            'attachment_name' => $message->attachment_name,
            'attachment_mime' => $message->attachment_mime,
            'attachment_size' => $message->attachment_size,
            'attachment_type' => $message->attachment_type,
            'created_at' => $message->created_at?->toIso8601String(),
        ]);
    }
}
