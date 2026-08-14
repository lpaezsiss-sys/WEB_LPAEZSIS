<?php
declare(strict_types=1);

/**
 * LPAEZsis API bootstrap.
 * Loaded from site/api/index.php (expects this file at <repo>/src/bootstrap.php
 * or on BlueHosting at public_html/src/bootstrap.php).
 */

require_once __DIR__ . '/polyfills.php';

namespace Lpaezsis;

spl_autoload_register(static function ($class) {
    $prefix = __NAMESPACE__ . '\\';
    if (!\str_starts_with($class, $prefix)) {
        return;
    }
    $relative = str_replace('\\', '/', substr($class, strlen($prefix)));
    $path = __DIR__ . '/' . $relative . '.php';
    if (is_file($path)) {
        require $path;
    }
});

Config::load(__DIR__);
Database::boot();
