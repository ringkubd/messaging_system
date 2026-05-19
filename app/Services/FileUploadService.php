<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileUploadService
{
    public const ALLOWED_IMAGE = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    public const ALLOWED_AUDIO = ['mp3', 'wav', 'ogg', 'webm'];
    public const ALLOWED_DOC   = ['pdf', 'doc', 'docx', 'txt'];

    public static function upload(UploadedFile $file, string $folder = 'uploads'): ?array
    {
        $originalName = $file->getClientOriginalName();
        $mime = $file->getMimeType();
        $size = $file->getSize();

        $type = match (true) {
            str_starts_with($mime, 'image/') => 'image',
            str_starts_with($mime, 'audio/') => 'audio',
            default => 'file',
        };

        if ($type === 'image') {
            $optimizer = new ImageOptimizer();
            $optimized = $optimizer->optimize($file);

            if ($optimized) {
                $file = $optimized;
                $mime = 'image/webp';
            }
        }

        $ext = strtolower($file->getClientOriginalExtension());
        $size = $file->getSize();

        $allowed = array_merge(self::ALLOWED_IMAGE, self::ALLOWED_AUDIO, self::ALLOWED_DOC);
        if (! in_array($ext, $allowed, true)) {
            return null;
        }

        if ($size > 10 * 1024 * 1024) {
            return null;
        }

        $path = $file->storePubliclyAs(
            "{$folder}/{$type}/" . now()->format('Y/m/d'),
            Str::uuid() . '.' . $ext,
            'public'
        );

        if (! $path) {
            return null;
        }

        return [
            'url' => Storage::url($path),
            'name' => $originalName,
            'type' => $type,
            'mime' => $mime,
            'size' => $size,
        ];
    }
}
