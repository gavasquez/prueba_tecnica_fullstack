<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Group extends Model
{
    /**
     * Los atributos que son asignables masivamente.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'storage_limit',
    ];

    /**
     * Los atributos que deben ser convertidos a tipos nativos.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'storage_limit' => 'integer',
    ];

    /**
     * Los usuarios que pertenecen al grupo.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    /**
     * Los archivos que pertenecen al grupo.
     */
    public function files(): HasMany
    {
        return $this->hasMany(File::class);
    }

    /**
     * Obtener el espacio de almacenamiento utilizado por el grupo.
     */
    public function getUsedStorageAttribute(): int
    {
        return $this->files()->sum('size');
    }

    /**
     * Obtener el espacio de almacenamiento disponible.
     */
    public function getAvailableStorageAttribute(): int
    {
        return max(0, $this->storage_limit - $this->used_storage);
    }

    /**
     * Verificar si el grupo tiene espacio suficiente para un archivo.
     */
    public function hasStorageForFile(int $fileSize): bool
    {
        return $this->available_storage >= $fileSize;
    }
}