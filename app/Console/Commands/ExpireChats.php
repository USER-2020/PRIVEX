<?php

namespace App\Console\Commands;

use App\Events\ChatClosed;
use App\Models\Chat;
use App\Models\ChatHistory;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ExpireChats extends Command
{
    protected $signature = 'chats:expire';
    protected $description = 'Close expired chats, delete request photos, and archive history.';

    public function handle(): int
    {
        $now = Carbon::now();

        Chat::query()
            ->whereNotNull('ends_at')
            ->where('ends_at', '<=', $now)
            ->whereIn('status', ['active', 'closed', 'expired'])
            ->with(['chatRequest', 'user'])
            ->chunkById(50, function ($chats) use ($now) {
                foreach ($chats as $chat) {
                    $chatRequest = $chat->chatRequest;
                    if (! $chatRequest) {
                        continue;
                    }

                    $existingHistory = ChatHistory::where('chat_id', $chat->id)->first();

                    DB::transaction(function () use ($chat, $chatRequest, $now) {
                        $originalPath = $chatRequest->photo_path;
                        $deletedAt = null;

                        if ($originalPath) {
                            if (Storage::disk('public')->exists($originalPath)) {
                                Storage::disk('public')->delete($originalPath);
                            }
                            $deletedAt = $now;
                            $chatRequest->update([
                                'photo_path' => null,
                                'photo_deleted_at' => $deletedAt,
                            ]);
                        }

                        if ($chat->status === 'active') {
                            $chat->update([
                                'status' => 'expired',
                                'ends_at' => $chat->ends_at ?? $now,
                            ]);

                            broadcast(new ChatClosed($chat))->toOthers();
                        }

                        $historyData = [
                            'chat_id' => $chat->id,
                            'chat_request_id' => $chatRequest->id,
                            'user_id' => $chat->user_id,
                            'display_name' => $chatRequest->display_name,
                            'status' => $chat->status,
                            'closed_reason' => $chat->status === 'closed' ? 'closed' : 'expired',
                            'ended_at' => $chat->ends_at ?? $now,
                            'photo_path' => $originalPath,
                            'photo_deleted_at' => $deletedAt,
                        ];

                        $existing = ChatHistory::where('chat_id', $chat->id)->first();
                        if ($existing) {
                            $existing->update($historyData);
                        } else {
                            ChatHistory::create($historyData);
                        }
                    });
                }
            });

        return self::SUCCESS;
    }
}
