<?php
declare(strict_types=1);

namespace Lpaezsis;

use PDO;
use PDOException;
use RuntimeException;

final class Database
{
    private static ?PDO $pdo = null;

    public static function boot(): void
    {
        self::pdo();
    }

    public static function pdo(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $host = (string) (Config::get('DB_HOST', '127.0.0.1') ?? '127.0.0.1');
        $port = (string) (Config::get('DB_PORT', '3306') ?? '3306');
        $name = (string) (Config::get('DB_NAME', 'lpaezsis') ?? 'lpaezsis');
        $user = (string) (Config::get('DB_USER', 'root') ?? 'root');
        $pass = (string) (Config::get('DB_PASS', '') ?? '');
        $charset = (string) (Config::get('DB_CHARSET', 'utf8mb4') ?? 'utf8mb4');

        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $host, $port, $name, $charset);

        try {
            self::$pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            if (Config::bool('APP_DEBUG')) {
                throw $e;
            }
            throw new RuntimeException('No se pudo conectar a la base de datos MySQL.');
        }

        return self::$pdo;
    }
}
