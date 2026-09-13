<?php
declare(strict_types=1);

namespace Lpaezsis\Support;

use Lpaezsis\Config;
use Lpaezsis\Response;

/**
 * Manejador de errores/deprecations para API JSON bajo PHP 8.1+.
 * Evita que Notices/Deprecated contaminen el body JSON.
 */
final class ErrorHandler
{
    /** @var list<array{type:int,message:string,file:string,line:int}> */
    private static array $logged = [];

    public static function register(): void
    {
        // API: nunca imprimir warnings al output
        ini_set('display_errors', '0');
        ini_set('html_errors', '0');

        set_error_handler([self::class, 'handleError']);
        set_exception_handler([self::class, 'handleException']);
    }

    /** @return list<array{type:int,message:string,file:string,line:int}> */
    public static function logged(): array
    {
        return self::$logged;
    }

    public static function handleError(int $severity, string $message, string $file = '', int $line = 0): bool
    {
        // Respetar @ operator
        if (!(error_reporting() & $severity)) {
            return true;
        }

        self::$logged[] = [
            'type' => $severity,
            'message' => $message,
            'file' => $file,
            'line' => $line,
        ];

        // Deprecated / Notice / Warning: no convertir en excepción (rompe JSON mid-response).
        // Solo se exponen vía APP_DEBUG en health o logs internos.
        if (in_array($severity, [
            E_DEPRECATED,
            E_USER_DEPRECATED,
            E_NOTICE,
            E_USER_NOTICE,
            E_STRICT,
            E_WARNING,
            E_USER_WARNING,
            E_CORE_WARNING,
            E_COMPILE_WARNING,
        ], true)) {
            if (Config::bool('APP_DEBUG')) {
                error_log(sprintf('[lpaezsis php%s] %s in %s:%d', PHP_VERSION, $message, $file, $line));
            }
            return true;
        }

        // Errores fatales recuperables → excepción
        throw new \ErrorException($message, 0, $severity, $file, $line);
    }

    public static function handleException(\Throwable $e): void
    {
        $extra = [];
        if (Config::bool('APP_DEBUG')) {
            $extra = [
                'detail' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ];
        }
        if (!headers_sent()) {
            Response::error('Error interno del servidor', 500, $extra);
        } else {
            // Último recurso si ya hubo output
            echo json_encode(['error' => 'Error interno del servidor'] + $extra, JSON_UNESCAPED_UNICODE);
        }
        exit;
    }
}
