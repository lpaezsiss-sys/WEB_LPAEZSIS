<?php
declare(strict_types=1);

namespace Lpaezsis\Support;

/**
 * Casts defensivos para PHP 7.4 y 8.1+.
 * Evita "Array to string conversion" / TypeError cuando $_GET/$_POST
 * llegan como array (p.ej. ?q[]=x) o null.
 */
final class Cast
{
    /** Escalar → string trim; arrays/objetos → default. */
    public static function str($value, string $default = ''): string
    {
        if ($value === null || is_array($value) || is_object($value)) {
            return $default;
        }
        if (is_bool($value)) {
            return $value ? '1' : '0';
        }
        return trim((string) $value);
    }

    /** Entero seguro; rechaza arrays/objetos; strings numéricos OK. */
    public static function int($value, int $default = 0): int
    {
        if ($value === null || is_array($value) || is_object($value) || is_bool($value)) {
            return $default;
        }
        if (is_int($value)) {
            return $value;
        }
        if (is_float($value)) {
            return (int) $value;
        }
        $s = trim((string) $value);
        if ($s === '' || !is_numeric($s)) {
            return $default;
        }
        return (int) $s;
    }

    /** @return array<mixed> */
    public static function arr($value): array
    {
        return is_array($value) ? $value : [];
    }

    /** true para 1/true/yes/on (case-insensitive). */
    public static function bool($value, bool $default = false): bool
    {
        if ($value === null || is_array($value) || is_object($value)) {
            return $default;
        }
        if (is_bool($value)) {
            return $value;
        }
        $s = strtolower(trim((string) $value));
        if ($s === '') {
            return $default;
        }
        return in_array($s, ['1', 'true', 'yes', 'on'], true);
    }
}
