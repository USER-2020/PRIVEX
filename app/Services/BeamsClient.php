<?php

namespace App\Services;

use Pusher\PushNotifications\PushNotifications;

class BeamsClient
{
    public function client(): ?PushNotifications
    {
        $instanceId = config('services.beams.instance_id');
        $secretKey = config('services.beams.secret_key');

        if (! $instanceId || ! $secretKey) {
            return null;
        }

        return new PushNotifications([
            'instanceId' => $instanceId,
            'secretKey' => $secretKey,
        ]);
    }

    public function notifyUser(int $userId, string $title, string $body, array $data = []): void
    {
        $client = $this->client();

        if (! $client) {
            return;
        }

        $url = $data['url'] ?? null;
        $client->publish(
            ["user-{$userId}"],
            [
                'web' => [
                    'notification' => [
                        'title' => $title,
                        'body' => $body,
                        'deep_link' => $url,
                        'data' => $data,
                    ],
                    'data' => $data,
                ],
            ]
        );
    }

    public function notifyInterest(string $interest, string $title, string $body, array $data = []): void
    {
        $client = $this->client();

        if (! $client) {
            return;
        }

        $url = $data['url'] ?? null;
        $client->publish(
            [$interest],
            [
                'web' => [
                    'notification' => [
                        'title' => $title,
                        'body' => $body,
                        'deep_link' => $url,
                        'data' => $data,
                    ],
                    'data' => $data,
                ],
            ]
        );
    }

    public function generateToken(string $userId): ?array
    {
        $client = $this->client();

        if (! $client) {
            return null;
        }

        return null;
    }
}
