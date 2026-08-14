<?php
declare(strict_types=1);

namespace Lpaezsis;

use PDO;

final class Auth
{
    public static function bearerToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(\S+)/i', $header, $m)) {
            return $m[1];
        }
        return null;
    }

    public static function requireAdmin(): string
    {
        $token = self::bearerToken();
        if (!$token) {
            Response::error('No autorizado', 401);
            exit;
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT token, expires_at FROM admin_sessions WHERE token = ? LIMIT 1');
        $stmt->execute([$token]);
        $row = $stmt->fetch();
        if (!$row || strtotime((string) $row['expires_at']) < time()) {
            if ($row) {
                $pdo->prepare('DELETE FROM admin_sessions WHERE token = ?')->execute([$token]);
            }
            Response::error('No autorizado', 401);
            exit;
        }

        return $token;
    }

    public static function login(string $password): ?string
    {
        $pdo = Database::pdo();
        $stmt = $pdo->query('SELECT password_hash FROM admin_credentials WHERE id = 1 LIMIT 1');
        $row = $stmt->fetch();
        if (!$row || !password_verify($password, (string) $row['password_hash'])) {
            return null;
        }

        $token = bin2hex(random_bytes(32));
        $hours = (int) (Config::get('ADMIN_SESSION_HOURS', '12') ?: '12');
        $expires = (new \DateTimeImmutable('+' . max(1, $hours) . ' hours'))->format('Y-m-d H:i:s');
        $pdo->prepare('INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)')->execute([$token, $expires]);
        $pdo->exec('DELETE FROM admin_sessions WHERE expires_at < NOW()');
        return $token;
    }

    public static function changePassword(string $token, string $current, string $next): bool
    {
        $pdo = Database::pdo();
        $stmt = $pdo->query('SELECT password_hash FROM admin_credentials WHERE id = 1 LIMIT 1');
        $row = $stmt->fetch();
        if (!$row || !password_verify($current, (string) $row['password_hash'])) {
            return false;
        }
        $hash = password_hash($next, PASSWORD_BCRYPT);
        $pdo->prepare('UPDATE admin_credentials SET password_hash = ?, updated_at = NOW() WHERE id = 1')->execute([$hash]);
        // Rotate session
        $pdo->prepare('DELETE FROM admin_sessions WHERE token = ?')->execute([$token]);
        return true;
    }
}
