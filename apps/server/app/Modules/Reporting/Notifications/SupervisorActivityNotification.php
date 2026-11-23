<?php

namespace App\Modules\Reporting\Notifications;

use Illuminate\Notifications\Notification;

/**
 * In-app notification (header bell) sent to Admin accounts when a supervisor
 * saves/submits a weekly report or records/updates an operational issue.
 */
class SupervisorActivityNotification extends Notification
{
    /**
     * @param  array<string, string|int>  $titleValues
     * @param  array<string, string|int>  $bodyValues
     */
    public function __construct(
        public readonly string $titleKey,
        public readonly array $titleValues,
        public readonly string $bodyKey,
        public readonly array $bodyValues,
        public readonly string $url,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => __($this->titleKey, $this->titleValues),
            'body' => __($this->bodyKey, $this->bodyValues),
            'title_key' => $this->titleKey,
            'title_values' => $this->titleValues,
            'body_key' => $this->bodyKey,
            'body_values' => $this->bodyValues,
            'url' => $this->url,
        ];
    }
}
