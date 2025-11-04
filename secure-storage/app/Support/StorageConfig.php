<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class StorageConfig
{
    public static function getBannedExtensions(): array
    {
        $value = DB::table('storage_settings')->where('setting_key', 'banned_extensions')->value('setting_value');
        $decoded = $value ? json_decode($value, true) : null;
        return is_array($decoded) ? array_map(fn($e) => strtolower(trim($e)), $decoded) : [];
    }

    public static function getDefaultStorageLimit(): int
    {
        $value = DB::table('storage_settings')->where('setting_key', 'default_storage_limit')->value('setting_value');
        return (int)($value ?? 10485760); // 10MB por defecto en bytes
    }

    public static function getMaxFileSize(): int
    {
        $value = DB::table('storage_settings')->where('setting_key', 'max_file_size')->value('setting_value');
        return (int)($value ?? 5242880); // 5MB por defecto en bytes
    }
}


