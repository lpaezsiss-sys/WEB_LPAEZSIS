<?php
declare(strict_types=1);

namespace Lpaezsis;

use Lpaezsis\Controllers\AdminApi;
use Lpaezsis\Controllers\PublicApi;

final class Router
{
    public static function dispatch(string $method, string $path): void
    {
        $method = strtoupper($method);
        $path = '/' . trim($path, '/');
        if ($path === '/') {
            $path = '/api';
        }
        if (strncmp($path, '/api', 4) !== 0) {
            $path = '/api' . ($path === '/' ? '' : $path);
        }

        try {
            if (strncmp($path, '/api/admin', 10) === 0) {
                AdminApi::handle($method, $path);
                return;
            }
            PublicApi::handle($method, $path);
        } catch (\Throwable $e) {
            if (Config::bool('APP_DEBUG')) {
                Response::error('Error interno', 500, [
                    'detail' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]);
                return;
            }
            Response::error('Error interno del servidor', 500);
        }
    }
}
