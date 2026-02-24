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

    public function notifyChannel(string $channel, string $title, string $body, array $data = []): array
    {
        $client = $this->client();

        if (! $client) {
            return [
                'sent' => 0,
                'failed' => 0,
                'expired' => 0,
                'reports' => [],
                'error' => 'webpush_not_configured',
            ];
        }

        $subscriptions = PushSubscription::query()
            ->where('channel', $channel)
            ->where('platform', 'ios_webpush')
            ->get();

        if ($subscriptions->isEmpty()) {
            return [
                'sent' => 0,
                'failed' => 0,
                'expired' => 0,
                'reports' => [],
                'error' => 'no_subscriptions',
            ];
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

        $summary = [
            'sent' => 0,
            'failed' => 0,
            'expired' => 0,
            'reports' => [],
        ];

        foreach ($client->flush() as $report) {
            $statusCode = $report->getResponse()?->getStatusCode();
            $summary['reports'][] = [
                'endpoint' => $report->getEndpoint(),
                'success' => $report->isSuccess(),
                'expired' => $report->isSubscriptionExpired(),
                'reason' => $report->getReason(),
                'status' => $statusCode,
            ];

            if ($report->isSubscriptionExpired()) {
                $endpoint = $report->getEndpoint();
                PushSubscription::where('endpoint', $endpoint)->delete();
                $summary['expired']++;
            } elseif ($report->isSuccess()) {
                $summary['sent']++;
            } else {
                $summary['failed']++;
            }
        }

        return $summary;
    }
}
