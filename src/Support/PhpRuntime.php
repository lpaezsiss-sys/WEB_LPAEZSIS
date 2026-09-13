<?php
declare(strict_types=1);

namespace Lpaezsis\Support;

/**
 * Runtime PHP para el corte a 8.1+.
 * Compatible con hosts que aún reporten 7.4 durante la transición.
 */
final class PhpRuntime
{
    public const MIN_RECOMMENDED = '8.1.0';
    public const MIN_SUPPORTED = '7.4.0';

    public static function version(): string
    {
        return PHP_VERSION;
    }

    public static function meetsRecommended(): bool
    {
        return version_compare(PHP_VERSION, self::MIN_RECOMMENDED, '>=');
    }

    public static function meetsSupported(): bool
    {
        return version_compare(PHP_VERSION, self::MIN_SUPPORTED, '>=');
    }

    /** @return array<string, mixed> */
    public static function healthMeta(): array
    {
        return [
            'php' => PHP_VERSION,
            'php_id' => PHP_VERSION_ID,
            'compat' => '7.4+/8.1-ready',
            'php_min_supported' => self::MIN_SUPPORTED,
            'php_min_recommended' => self::MIN_RECOMMENDED,
            'php81_ready' => true,
            'php81_active' => self::meetsRecommended(),
            'zend_version' => zend_version(),
            'sapi' => PHP_SAPI,
        ];
    }
}
