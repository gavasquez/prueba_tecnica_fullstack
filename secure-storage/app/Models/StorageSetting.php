<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StorageSetting extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'max_file_size',
        'forbidden_extensions',
        'global_storage_limit',
        'default_user_storage',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'forbidden_extensions' => 'array',
    ];

    /**
     * Obtener la configuración actual o crear una nueva si no existe
     *
     * @return \App\Models\StorageSetting
     */
    public static function current()
    {
        return static::firstOrCreate(
            ['id' => 1],
            [
                'max_file_size' => 10240, // 10MB en KB
                'forbidden_extensions' => ['exe', 'bat', 'sh', 'php', 'js', 'py', 'rb', 'pl'],
                'global_storage_limit' => 1048576, // 1GB en MB
                'default_user_storage' => 104857, // 100MB en KB
            ]
        );
    }
}
