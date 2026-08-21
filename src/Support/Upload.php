<?php
declare(strict_types=1);

namespace Lpaezsis\Support;

use Lpaezsis\Config;

final class Upload
{
    public static function storeImage(array $file): array
    {
        return self::store($file, 'image');
    }

    /**
     * @param array $file $_FILES entry
     * @param string $kind "image"|"pdf"|"auto"
     */
    public static function store(array $file, string $kind = 'auto'): array
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            return ['ok' => false, 'error' => 'No se pudo subir el archivo'];
        }
        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            return ['ok' => false, 'error' => 'Archivo inválido'];
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($tmp) ?: '';
        $origName = strtolower((string) ($file['name'] ?? ''));
        if ($mime === 'application/octet-stream' && preg_match('/\.pdf$/', $origName)) {
            $mime = 'application/pdf';
        }

        $imageMap = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
        ];
        $isImage = isset($imageMap[$mime]);
        $isPdf = $mime === 'application/pdf';

        if ($kind === 'image' && !$isImage) {
            return ['ok' => false, 'error' => 'Solo se permiten JPG, PNG, WEBP o GIF'];
        }
        if ($kind === 'pdf' && !$isPdf) {
            return ['ok' => false, 'error' => 'Solo se permiten PDF'];
        }
        if ($kind === 'auto' && !$isImage && !$isPdf) {
            return ['ok' => false, 'error' => 'Solo se permiten JPG, PNG, WEBP, GIF o PDF'];
        }

        $maxBytes = $isPdf ? 12 * 1024 * 1024 : 5 * 1024 * 1024;
        if (($file['size'] ?? 0) > $maxBytes) {
            return ['ok' => false, 'error' => $isPdf ? 'El PDF supera 12 MB' : 'La imagen supera 5 MB'];
        }

        $dir = (string) Config::get('UPLOAD_DIR');
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            return ['ok' => false, 'error' => 'No se pudo crear carpeta de uploads'];
        }

        $ext = $isPdf ? 'pdf' : $imageMap[$mime];
        $name = ($isPdf ? 'f-' : 'p-') . bin2hex(random_bytes(8)) . '.' . $ext;
        $dest = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . $name;
        if (!move_uploaded_file($tmp, $dest)) {
            return ['ok' => false, 'error' => 'Error al guardar el archivo'];
        }

        $converted = false;
        if ($isImage) {
            $webp = self::convertImageToWebp($dest, $mime);
            if ($webp !== null) {
                @unlink($dest);
                $dest = $webp;
                $name = basename($webp);
                $converted = true;
            }
        }

        $prefix = rtrim((string) Config::get('UPLOAD_URL_PREFIX', '/img/uploads'), '/');
        return [
            'ok' => true,
            'url' => $prefix . '/' . $name,
            'type' => $isPdf ? 'pdf' : 'image',
            'converted' => $converted,
        ];
    }

    /** Convierte JPEG/PNG a WebP (calidad 82). GIF animado y WebP nativo se dejan igual. */
    private static function convertImageToWebp(string $path, string $mime): ?string
    {
        if (!function_exists('imagewebp')) {
            return null;
        }
        if ($mime === 'image/webp' || $mime === 'image/gif') {
            return null;
        }
        $im = null;
        if ($mime === 'image/jpeg' && function_exists('imagecreatefromjpeg')) {
            $im = @imagecreatefromjpeg($path);
        } elseif ($mime === 'image/png' && function_exists('imagecreatefrompng')) {
            $im = @imagecreatefrompng($path);
            if ($im) {
                if (function_exists('imagepalettetotruecolor')) {
                    @imagepalettetotruecolor($im);
                }
                imagealphablending($im, true);
                imagesavealpha($im, true);
            }
        }
        if (!$im) {
            return null;
        }
        $webpPath = (string) preg_replace('/\.(jpe?g|png)$/i', '.webp', $path);
        if ($webpPath === '' || $webpPath === $path) {
            $webpPath = $path . '.webp';
        }
        $ok = @imagewebp($im, $webpPath, 82);
        imagedestroy($im);
        if (!$ok || !is_file($webpPath) || filesize($webpPath) < 32) {
            @unlink($webpPath);
            return null;
        }
        return $webpPath;
    }
}
