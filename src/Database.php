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
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            // PHP 8.1+: evita casts implícitos string en fetches numéricos
            if (defined('PDO::ATTR_STRINGIFY_FETCHES')) {
                $options[PDO::ATTR_STRINGIFY_FETCHES] = false;
            }
            // Debe ir en el constructor (no setAttribute posterior).
            if (defined('PDO::MYSQL_ATTR_MULTI_STATEMENTS')) {
                $options[PDO::MYSQL_ATTR_MULTI_STATEMENTS] = false;
            }
            self::$pdo = new PDO($dsn, $user, $pass, $options);
            try {
                self::$pdo->exec('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
            } catch (PDOException $e) {
                // Algunos hosts restringen SET NAMES; el DSN ya pide charset.
            }
        } catch (PDOException $e) {
            if (Config::bool('APP_DEBUG')) {
                throw $e;
            }
            throw new RuntimeException('No se pudo conectar a la base de datos MySQL.');
        }

        return self::$pdo;
    }
}
