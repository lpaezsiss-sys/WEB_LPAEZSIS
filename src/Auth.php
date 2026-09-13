<?php
declare(strict_types=1);

namespace Lpaezsis;

use Lpaezsis\Support\Cast;
use PDO;

final class Auth
{
    public static function bearerToken(): ?string
    {
        $header = Cast::str(
            $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '')
        );
        if ($header !== '' && preg_match('/Bearer\s+(\S+)/i', $header, $m)) {
            $token = Cast::str($m[1] ?? '');
            return $token !== '' ? $token : null;
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
        $stored = is_array($row) ? Cast::str($row['token'] ?? '') : '';
        $expiresAt = is_array($row) ? Cast::str($row['expires_at'] ?? '') : '';
        $expiresTs = $expiresAt !== '' ? strtotime($expiresAt) : false;

        // Comparación timing-safe del token en PHP (además del WHERE SQL).
        if (
            $stored === ''
            || !hash_equals($stored, $token)
            || $expiresTs === false
            || $expiresTs < time()
        ) {
            if ($stored !== '') {
                $pdo->prepare('DELETE FROM admin_sessions WHERE token = ?')->execute([$token]);
            }
            Response::error('No autorizado', 401);
            exit;
        }

        return $token;
    }

    public static function login(string $password): ?string
    {
        $password = Cast::str($password);
        $pdo = Database::pdo();
        $stmt = $pdo->query('SELECT password_hash FROM admin_credentials WHERE id = 1 LIMIT 1');
        $row = $stmt->fetch();
        $hash = is_array($row) ? Cast::str($row['password_hash'] ?? '') : '';
        if ($hash === '' || !password_verify($password, $hash)) {
            return null;
        }

        $token = bin2hex(random_bytes(32));
        $hours = max(1, Cast::int(Config::get('ADMIN_SESSION_HOURS', '12'), 12));
        $expires = (new \DateTimeImmutable('+' . $hours . ' hours'))->format('Y-m-d H:i:s');
        $pdo->prepare('INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)')->execute([$token, $expires]);
        $pdo->exec('DELETE FROM admin_sessions WHERE expires_at < NOW()');
        return $token;
    }

    public static function changePassword(string $token, string $current, string $next): bool
    {
        $token = Cast::str($token);
        $current = Cast::str($current);
        $next = Cast::str($next);
        $pdo = Database::pdo();
        $stmt = $pdo->query('SELECT password_hash FROM admin_credentials WHERE id = 1 LIMIT 1');
        $row = $stmt->fetch();
        $hash = is_array($row) ? Cast::str($row['password_hash'] ?? '') : '';
        if ($hash === '' || !password_verify($current, $hash)) {
            return false;
        }
        $newHash = password_hash($next, PASSWORD_BCRYPT);
        $pdo->prepare('UPDATE admin_credentials SET password_hash = ?, updated_at = NOW() WHERE id = 1')->execute([$newHash]);
        // Rotate session
        $pdo->prepare('DELETE FROM admin_sessions WHERE token = ?')->execute([$token]);
        return true;
    }
}
