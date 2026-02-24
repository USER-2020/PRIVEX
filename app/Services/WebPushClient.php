<?php

namespace App\Services;

use App\Models\PushSubscription;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class WebPushClient
{
    public function client(): ?WebPush
    {
        $publicKey = config('services.webpush.public_key');
        $privateKey = config('services.webpush.private_key');
        $subject = config('services.webpush.subject');

        if (! $publicKey || ! $privateKey || ! $subject) {
            return null;
        }

        return new WebPush([
            'VAPID' => [
                'subject' => $subject,
                'publicKey' => $publicKey,
                'privateKey' => $privateKey,
            ],
        ]);
    }

    public function notifyChannel(string $channel, string $title, string $body, array $data = []): void
    {
        $client = $this->client();

        if (! $client) {
            return;
        }

        $subscriptions = PushSubscription::query()
            ->where('channel', $channel)
            ->where('platform', 'ios_webpush')
            ->get();

        if ($subscriptions->isEmpty()) {
            return;
        }

        $payload = json_encode([
            'webpush' => true,
            'title' => $title,
            'body' => $body,
            'url' => $data['url'] ?? null,
            'data' => $data,
        ]);

        foreach ($subscriptions as $record) {
            $client->queueNotification(Subscription::create($record->subscription), $payload);
        }

        foreach ($client->flush() as $report) {
            if ($report->isSubscriptionExpired()) {
                $endpoint = $report->getEndpoint();
                PushSubscription::where('endpoint', $endpoint)->delete();
            }
        }
    }
}
