<?php
declare(strict_types=1);

namespace Lpaezsis\Support;

use Lpaezsis\Config;

final class Upload
{
    public static function storeImage(array $file): array
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            return ['ok' => false, 'error' => 'No se pudo subir el archivo'];
        }
        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            return ['ok' => false, 'error' => 'Archivo inválido'];
        }

        // Whitelist explícita: MIME + extensión (incluye WebP).
        $allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $allowed_exts  = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        $mime_to_ext = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
        ];

        $originalName = (string) ($file['name'] ?? '');
        $clientExt = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if ($clientExt !== '' && !in_array($clientExt, $allowed_exts, true)) {
            return ['ok' => false, 'error' => 'Extensión no permitida. Use jpg, png, webp o gif.'];
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($tmp) ?: '';
        // Algunos entornos reportan MIME vacío o genérico; confiar en extensión .webp/.png…
        if ($mime === '' || $mime === 'application/octet-stream') {
            $byExt = [
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'webp' => 'image/webp',
                'gif' => 'image/gif',
            ];
            $mime = $byExt[$clientExt] ?? $mime;
        }
        if (!in_array($mime, $allowed_types, true) || !isset($mime_to_ext[$mime])) {
            return ['ok' => false, 'error' => 'Solo se permiten JPG, PNG, WEBP o GIF'];
        }
        if (($file['size'] ?? 0) > 5 * 1024 * 1024) {
            return ['ok' => false, 'error' => 'La imagen supera 5 MB'];
        }

        $ext = $mime_to_ext[$mime];
        if ($clientExt !== '' && self::extMatchesMime($clientExt, $mime)) {
            $ext = $clientExt === 'jpeg' ? 'jpg' : $clientExt;
        }

        // Guardar físicamente en site/img/uploads/ (p-xxxxxxxx.webp, etc.).
        $dir = (string) Config::get('UPLOAD_DIR');
        if ($dir === '') {
            $dir = dirname(__DIR__, 2) . '/site/img/uploads';
        }
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            return ['ok' => false, 'error' => 'No se pudo crear carpeta de uploads'];
        }

        $name = 'p-' . bin2hex(random_bytes(8)) . '.' . $ext;
        $dest = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . $name;
        if (!move_uploaded_file($tmp, $dest)) {
            return ['ok' => false, 'error' => 'Error al guardar la imagen'];
        }

        $prefix = rtrim((string) Config::get('UPLOAD_URL_PREFIX', '/img/uploads'), '/');
        return ['ok' => true, 'url' => $prefix . '/' . $name];
    }

    private static function extMatchesMime(string $ext, string $mime): bool
    {
        $ext = $ext === 'jpeg' ? 'jpg' : $ext;
        $map = [
            'jpg' => ['image/jpeg'],
            'png' => ['image/png'],
            'webp' => ['image/webp'],
            'gif' => ['image/gif'],
        ];
        return in_array($mime, $map[$ext] ?? [], true);
    }
}
