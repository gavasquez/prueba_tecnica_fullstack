<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    /**
     * Los atributos que son asignables masivamente.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
    ];

    /**
     * Obtener los usuarios con este rol.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Verificar si el rol es de administrador.
     */
    public function isAdmin(): bool
    {
        return $this->name === 'admin';
    }
}
