<?php
declare(strict_types=1);

namespace Lpaezsis;

final class Response
{
    /** @param mixed $payload */
    public static function json($payload, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public static function error(string $message, int $status = 400, array $extra = []): void
    {
        self::json(array_merge(['success' => false, 'ok' => false, 'error' => $message], $extra), $status);
    }
}
