<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role_id' => 'integer',
        ];
    }

    /**
     * Obtener el rol del usuario.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Los grupos a los que pertenece el usuario.
     */
    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(Group::class)->withTimestamps();
    }

    /**
     * Los archivos subidos por el usuario.
     */
    public function files()
    {
        return $this->hasMany(File::class);
    }

    /**
     * Verificar si el usuario tiene un rol específico.
     */
    public function hasRole($roleName): bool
    {
        // Si la relación role está cargada, usarla
        if ($this->relationLoaded('role') && $this->role) {
            return $this->role->name === $roleName;
        }
        
        // Si no está cargada, cargar la relación y verificar
        $role = $this->role;
        return $role && $role->name === $roleName;
    }

    /**
     * Verificar si el usuario es administrador.
     */
    public function isAdmin(): bool
    {
        // Verificar directamente el role_id === 1 (más eficiente y no requiere cargar la relación)
        // Esto funciona porque en el seeder el rol admin siempre tiene id = 1
        if ($this->role_id === 1) {
            return true;
        }
        
        // Fallback: usar hasRole si role_id no está disponible
        return $this->hasRole('admin');
    }
}
