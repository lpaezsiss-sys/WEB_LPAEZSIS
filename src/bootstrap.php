<?php
declare(strict_types=1);

/**
 * LPAEZsis API bootstrap.
 * Loaded from site/api/index.php (expects this file at <repo>/src/bootstrap.php
 * or on BlueHosting at public_html/src/bootstrap.php).
 *
 * Intentionally no namespace here so polyfills load in the global namespace first.
 */

require_once __DIR__ . '/polyfills.php';

spl_autoload_register(static function ($class) {
    $class = (string) ($class ?? '');
    $prefix = 'Lpaezsis\\';
    $len = strlen($prefix);
    if ($class === '' || strncmp($class, $prefix, $len) !== 0) {
        return;
    }
    $relative = str_replace('\\', '/', substr($class, $len));
    $path = __DIR__ . '/' . $relative . '.php';
    if (is_file($path)) {
        require $path;
    }
});

\Lpaezsis\Config::load(__DIR__);
\Lpaezsis\Support\ErrorHandler::register();
if (
    !\Lpaezsis\Support\PhpRuntime::meetsRecommended()
    && \Lpaezsis\Config::bool('APP_DEBUG')
) {
    error_log(
        '[lpaezsis] PHP ' . PHP_VERSION . ' < 8.1 recomendado; migracion en curso.'
    );
}
// MySQL se conecta bajo demanda (Database::pdo), no en el bootstrap,
// para que /api/health responda aunque falte .env o la BD.
