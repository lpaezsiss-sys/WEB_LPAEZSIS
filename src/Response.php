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

    /**
     * Éxito con espejo raíz + data (contrato admin: success/ok y claves brand|brands|url).
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public static function success(array $payload): array
    {
        return array_merge(['success' => true, 'ok' => true, 'data' => $payload], $payload);
    }

    /** @param array<string, mixed> $payload */
    public static function ok(array $payload, int $status = 200): void
    {
        self::json(self::success($payload), $status);
    }

    public static function error(string $message, int $status = 400, array $extra = []): void
    {
        $payload = [
            'success' => false,
            'ok' => false,
            'error' => $message,
        ];
        if ($extra !== []) {
            $payload['data'] = $extra;
        }
        self::json($payload, $status);
    }
}
