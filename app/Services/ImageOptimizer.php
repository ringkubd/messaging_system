<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class ImageOptimizer
{
    protected ?string $driver = null;

    public function __construct()
    {
        if (extension_loaded('gd')) {
            $this->driver = 'gd';
        } elseif (extension_loaded('imagick')) {
            $this->driver = 'imagick';
        }
    }

    public function isAvailable(): bool
    {
        return $this->driver !== null;
    }

    public function optimize(UploadedFile $file, int $maxWidth = 1920, int $quality = 80): ?UploadedFile
    {
        if (! $this->isAvailable()) {
            return null;
        }

        $mime = $file->getMimeType();

        if (! str_starts_with($mime, 'image/')) {
            return null;
        }

        try {
            $image = match ($this->driver) {
                'gd' => $this->optimizeWithGd($file, $maxWidth, $quality),
                'imagick' => $this->optimizeWithImagick($file, $maxWidth, $quality),
                default => null,
            };

            return $image;
        } catch (\Throwable $e) {
            Log::warning('Image optimization failed: ' . $e->getMessage(), [
                'file' => $file->getClientOriginalName(),
            ]);

            return null;
        }
    }

    protected function optimizeWithGd(UploadedFile $file, int $maxWidth, int $quality): ?UploadedFile
    {
        $sourceImage = match ($file->getMimeType()) {
            'image/jpeg' => @imagecreatefromjpeg($file->getRealPath()),
            'image/png' => @imagecreatefrompng($file->getRealPath()),
            'image/gif' => @imagecreatefromgif($file->getRealPath()),
            'image/webp' => @imagecreatefromwebp($file->getRealPath()),
            default => null,
        };

        if (! $sourceImage) {
            return null;
        }

        $origWidth = imagesx($sourceImage);
        $origHeight = imagesy($sourceImage);

        if ($origWidth > $maxWidth) {
            $ratio = $maxWidth / $origWidth;
            $newWidth = $maxWidth;
            $newHeight = (int) round($origHeight * $ratio);

            $resized = imagecreatetruecolor($newWidth, $newHeight);

            if ($file->getMimeType() === 'image/png') {
                imagealphablending($resized, false);
                imagesavealpha($resized, true);
            }

            imagecopyresampled($resized, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);
            imagedestroy($sourceImage);
            $sourceImage = $resized;
        }

        $tempPath = tempnam(sys_get_temp_dir(), 'img_') . '.webp';
        $success = imagewebp($sourceImage, $tempPath, $quality);

        imagedestroy($sourceImage);

        if (! $success) {
            @unlink($tempPath);

            return null;
        }

        $optimized = new UploadedFile(
            $tempPath,
            pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME) . '.webp',
            'image/webp',
            null,
            true
        );

        return $optimized;
    }

    protected function optimizeWithImagick(UploadedFile $file, int $maxWidth, int $quality): ?UploadedFile
    {
        $imagick = new \Imagick($file->getRealPath());

        $origWidth = $imagick->getImageWidth();

        if ($origWidth > $maxWidth) {
            $imagick->resizeImage($maxWidth, 0, \Imagick::FILTER_LANCZOS, 1);
        }

        $imagick->setImageFormat('webp');
        $imagick->setImageCompressionQuality($quality);

        $tempPath = tempnam(sys_get_temp_dir(), 'img_') . '.webp';
        $imagick->writeImage($tempPath);
        $imagick->clear();

        $optimized = new UploadedFile(
            $tempPath,
            pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME) . '.webp',
            'image/webp',
            null,
            true
        );

        return $optimized;
    }
}
