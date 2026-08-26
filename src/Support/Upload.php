<?php
declare(strict_types=1);

namespace Lpaezsis\Support;

use Lpaezsis\Config;

final class Upload
{
    public static function storeImage(array $file, string $subdir = ''): array
    {
        return self::store($file, 'image', $subdir);
    }

    public static function storeVideo(array $file, string $subdir = ''): array
    {
        return self::store($file, 'video', $subdir);
    }

    /**
     * Sanitiza un nombre de PDF: minúsculas, sin caracteres especiales, espacios → guiones.
     * Ejemplo: "HL7200 Cutsheet Spanish Digital.pdf" → "hl7200-cutsheet-spanish-digital.pdf"
     */
    public static function sanitizePdfFilename(string $originalName): string
    {
        $stem = self::sanitizePdfStem($originalName);
        if ($stem === '') {
            return '';
        }
        return $stem . '.pdf';
    }

    /** Stem sanitizado sin extensión (.pdf). */
    public static function sanitizePdfStem(string $value): string
    {
        $value = basename(str_replace('\\', '/', $value));
        $value = (string) (preg_replace('/\.pdf$/i', '', $value) ?? '');
        $value = trim($value);
        if ($value === '') {
            return '';
        }

        if (class_exists(\Normalizer::class)) {
            $normalized = \Normalizer::normalize($value, \Normalizer::FORM_D);
            if (is_string($normalized) && $normalized !== '') {
                $value = $normalized;
            }
            $value = (string) (preg_replace('/\p{M}/u', '', $value) ?? $value);
        } elseif (function_exists('iconv')) {
            $translit = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
            if (is_string($translit) && $translit !== '') {
                $value = $translit;
            }
        }

        $value = strtolower($value);
        $value = (string) (preg_replace('/[^a-z0-9]+/', '-', $value) ?? '');
        return trim($value, '-');
    }

    /**
     * Guarda un PDF en img/fichas/ (hermana de img/uploads/).
     * El nombre final se deriva del archivo original sanitizado; $preferredBase es fallback (slug).
     * @param array $file $_FILES entry
     * @param string $preferredBase Nombre preferido sin extensión (slug del producto)
     */
    public static function storePdf(array $file, string $preferredBase = ''): array
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            return ['ok' => false, 'error' => 'No se pudo subir el archivo'];
        }
        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            return ['ok' => false, 'error' => 'Archivo inválido'];
        }

        $origName = (string) ($file['name'] ?? '');
        // Extensión estrictamente .pdf
        if (!preg_match('/\.pdf$/i', $origName)) {
            return ['ok' => false, 'error' => 'Solo se permiten archivos PDF'];
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($tmp) ?: '';
        $isPdfMime = in_array($mime, ['application/pdf', 'application/x-pdf'], true)
            || in_array($mime, ['application/octet-stream', 'binary/octet-stream', ''], true);
        if (!$isPdfMime) {
            return ['ok' => false, 'error' => 'Solo se permiten archivos PDF'];
        }
        if (($file['size'] ?? 0) > 15 * 1024 * 1024) {
            return ['ok' => false, 'error' => 'El PDF supera 15 MB'];
        }

        $uploadDir = (string) Config::get('UPLOAD_DIR');
        $imgRoot = dirname(rtrim($uploadDir, '/\\'));
        $dir = $imgRoot . DIRECTORY_SEPARATOR . 'fichas';
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            return ['ok' => false, 'error' => 'No se pudo crear carpeta img/fichas'];
        }

        $base = self::sanitizePdfStem($origName);
        if ($base === '') {
            $base = self::sanitizePdfStem($preferredBase);
        }
        if ($base === '') {
            $base = 'ficha-' . bin2hex(random_bytes(6));
        }

        $name = $base . '.pdf';
        $dest = $dir . DIRECTORY_SEPARATOR . $name;

        if (!move_uploaded_file($tmp, $dest)) {
            return ['ok' => false, 'error' => 'Error al guardar el PDF'];
        }

        // URL relativa limpia registrada en BD
        return [
            'ok' => true,
            'url' => 'img/fichas/' . $name,
            'type' => 'pdf',
        ];
    }

    /**
     * @param array $file $_FILES entry
     * @param string $kind "image"|"video"|"auto"
     * @param string $subdir Optional subdirectory under UPLOAD_DIR (e.g. "sectores")
     */
    public static function store(array $file, string $kind = 'auto', string $subdir = ''): array
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

        // Algunos hosts reportan SVG como text/html, text/xml, etc.
        $isSvgName = (bool) preg_match('/\.svg$/i', $origName);
        if ($isSvgName && in_array($mime, ['image/svg+xml', 'text/plain', 'text/html', 'text/xml', 'application/xml', 'image/svg'], true)) {
            $mime = 'image/svg+xml';
        }

        $imageMap = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            'image/svg+xml' => 'svg',
        ];
        $videoMap = [
            'video/mp4' => 'mp4',
            'video/webm' => 'webm',
        ];

        $isImage = isset($imageMap[$mime]);
        $isVideo = isset($videoMap[$mime]);

        if ($kind === 'image' && !$isImage) {
            return ['ok' => false, 'error' => 'Solo se permiten JPG, PNG, WEBP, GIF o SVG'];
        }
        if ($kind === 'video' && !$isVideo) {
            return ['ok' => false, 'error' => 'Solo se permiten MP4 o WEBM'];
        }
        if ($kind === 'auto' && !$isImage && !$isVideo) {
            return ['ok' => false, 'error' => 'Tipo de archivo no permitido'];
        }

        $ext = $isVideo ? $videoMap[$mime] : $imageMap[$mime];
        $maxBytes = $isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
        if (($file['size'] ?? 0) > $maxBytes) {
            return ['ok' => false, 'error' => $isVideo ? 'El video supera 50 MB' : 'La imagen supera 5 MB'];
        }

        $dir = (string) Config::get('UPLOAD_DIR');
        $subdir = trim(str_replace(['..', '\\'], '', $subdir), '/');
        if ($subdir !== '') {
            // Only allow simple folder names (e.g. sectores)
            if (!preg_match('/^[a-z0-9_-]+$/i', $subdir)) {
                return ['ok' => false, 'error' => 'Subcarpeta de upload inválida'];
            }
            $dir = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . $subdir;
        }
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            return ['ok' => false, 'error' => 'No se pudo crear carpeta de uploads'];
        }

        $prefixName = $isVideo ? 'v-' : 'p-';
        $name = $prefixName . bin2hex(random_bytes(8)) . '.' . $ext;
        $dest = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . $name;
        if (!move_uploaded_file($tmp, $dest)) {
            return ['ok' => false, 'error' => 'Error al guardar el archivo'];
        }

        $prefix = rtrim((string) Config::get('UPLOAD_URL_PREFIX', '/img/uploads'), '/');
        $urlPath = $subdir !== '' ? ($prefix . '/' . $subdir . '/' . $name) : ($prefix . '/' . $name);
        return [
            'ok' => true,
            'url' => $urlPath,
            'type' => $isVideo ? 'video' : 'image',
        ];
    }
}
