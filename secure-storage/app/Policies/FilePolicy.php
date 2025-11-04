<?php

namespace App\Policies;

use App\Models\File;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class FilePolicy
{
    use HandlesAuthorization;

    /**
     * Determinar si el usuario puede ver cualquier archivo.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determinar si el usuario puede ver el archivo.
     */
    public function view(User $user, File $file): bool
    {
        // El usuario es el propietario, es administrador o pertenece al mismo grupo
        return $user->id === $file->user_id || 
               $user->isAdmin() || 
               $user->groups->contains($file->group_id);
    }

    /**
     * Determinar si el usuario puede crear archivos.
     */
    public function create(User $user): bool
    {
        // Cualquier usuario autenticado puede subir archivos
        return true;
    }

    /**
     * Determinar si el usuario puede actualizar el archivo.
     */
    public function update(User $user, File $file): bool
    {
        // Solo el administrador puede aprobar/rechazar archivos
        return $user->isAdmin();
    }

    /**
     * Determinar si el usuario puede eliminar el archivo.
     */
    public function delete(User $user, File $file): bool
    {
        // El propietario o un administrador pueden eliminar
        return $user->id === $file->user_id || $user->isAdmin();
    }

    /**
     * Determinar si el usuario puede descargar el archivo.
     */
    public function download(User $user, File $file): bool
    {
        // Usuarios del mismo grupo, el propietario o administradores pueden descargar
        return $user->id === $file->user_id
            || $user->isAdmin()
            || $user->groups->contains('id', $file->group_id);
    }
}
