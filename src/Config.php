<?php
declare(strict_types=1);

namespace Lpaezsis;

final class Config
{
    /** @var array<string, string> */
    private static array $values = [];

    public static function load(string $srcDir): void
    {
        $envFile = $srcDir . '/.env';
        $example = $srcDir . '/.env.example';
        $path = is_file($envFile) ? $envFile : (is_file($example) ? $example : null);

        $defaults = [
            'DB_HOST' => '127.0.0.1',
            'DB_PORT' => '3306',
            'DB_NAME' => 'lpaezsis',
            'DB_USER' => 'root',
            'DB_PASS' => '',
            'DB_CHARSET' => 'utf8mb4',
            'UPLOAD_DIR' => '',
            'UPLOAD_URL_PREFIX' => '/img/uploads',
            'ADMIN_SESSION_HOURS' => '12',
            'APP_DEBUG' => '0',
        ];

        self::$values = $defaults;
        if ($path) {
            foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
                $line = trim($line);
                if ($line === '' || \str_starts_with($line, '#') || !\str_contains($line, '=')) {
                    continue;
                }
                [$k, $v] = array_map('trim', explode('=', $line, 2));
                $v = trim($v, "\"'");
                self::$values[$k] = $v;
            }
        }

        // Allow environment overrides (BlueHosting / local).
        foreach (array_keys(self::$values) as $key) {
            $env = getenv($key);
            if ($env !== false && $env !== '') {
                self::$values[$key] = $env;
            }
        }

        if (self::$values['UPLOAD_DIR'] === '') {
            // site/img/uploads relative to src/
            self::$values['UPLOAD_DIR'] = dirname($srcDir) . '/site/img/uploads';
            // On BlueHosting subdomain: public_html/prueba1.../img/uploads may differ;
            // prefer sibling site folder if present, else public_html/<host>/img/uploads via env.
            $candidates = [
                dirname($srcDir) . '/site/img/uploads',
                dirname($srcDir) . '/prueba1.lpaezsis.cl/img/uploads',
                dirname($srcDir) . '/img/uploads',
            ];
            foreach ($candidates as $cand) {
                if (is_dir($cand) || is_dir(dirname($cand))) {
                    self::$values['UPLOAD_DIR'] = $cand;
                    break;
                }
            }
        }
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        return self::$values[$key] ?? $default;
    }

    public static function bool(string $key, bool $default = false): bool
    {
        $v = strtolower((string) self::get($key, $default ? '1' : '0'));
        return in_array($v, ['1', 'true', 'yes', 'on'], true);
    }
}
