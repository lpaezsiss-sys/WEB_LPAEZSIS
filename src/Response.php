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
        $flags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
        // PHP 7.2+: sustituye UTF-8 inválido en vez de devolver false
        if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
            $flags |= JSON_INVALID_UTF8_SUBSTITUTE;
        }
        $encoded = json_encode($payload, $flags);
        if ($encoded === false) {
            http_response_code(500);
            echo '{"error":"No se pudo serializar la respuesta JSON"}';
            return;
        }
        echo $encoded;
    }

    public static function error(string $message, int $status = 400, array $extra = []): void
    {
        $message = (string) ($message ?? '');
        $extra = is_array($extra) ? $extra : [];
        self::json(array_merge(['error' => $message], $extra), $status);
    }
}
