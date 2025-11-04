<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class File extends Model
{
    /**
     * Los atributos que son asignables masivamente.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'original_name',
        'stored_name',
        'mime_type',
        'size',
        'path',
        'user_id',
        'group_id',
        'is_approved',
        'rejection_reason',
    ];

    /**
     * Los atributos que deben ser convertidos a tipos nativos.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'size' => 'integer',
        'is_approved' => 'boolean',
    ];

    /**
     * Obtener la URL pública del archivo.
     */
    public function getUrlAttribute(): string
    {
        return Storage::url($this->path . '/' . $this->stored_name);
    }

    /**
     * Obtener la ruta completa del archivo en el sistema de archivos.
     */
    public function getFullPathAttribute(): string
    {
        return storage_path('app/' . $this->path . '/' . $this->stored_name);
    }

    /**
     * Obtener el usuario propietario del archivo.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Obtener el grupo al que pertenece el archivo.
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    /**
     * Verificar si el archivo está aprobado.
     */
    public function isApproved(): bool
    {
        return $this->is_approved === true;
    }

    /**
     * Verificar si el archivo está rechazado.
     */
    public function isRejected(): bool
    {
        return $this->is_approved === false;
    }

    /**
     * Marcar el archivo como aprobado.
     */
    public function approve(): void
    {
        $this->update([
            'is_approved' => true,
            'rejection_reason' => null,
        ]);
    }

    /**
     * Marcar el archivo como rechazado.
     */
    public function reject(string $reason): void
    {
        $this->update([
            'is_approved' => false,
            'rejection_reason' => $reason,
        ]);
    }
}