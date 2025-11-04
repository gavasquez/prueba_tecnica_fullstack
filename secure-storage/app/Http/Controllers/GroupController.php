<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GroupController extends Controller
{
    /**
     * Listar grupos
     */
    public function index()
    {
        try {
            $user = Auth::user();
            
            // Si el usuario es administrador, obtener todos los grupos
            if ($user->isAdmin()) {
                $groups = Group::select('id', 'name', 'description', 'storage_limit', 'used_storage', 'created_at')
                    ->withCount('users')
                    ->latest()
                    ->get();
            } else {
                // Si no es administrador, obtener solo los grupos a los que pertenece
                $groups = $user->groups()
                    ->select('groups.id', 'groups.name', 'groups.description', 'groups.storage_limit', 'groups.used_storage', 'groups.created_at')
                    ->withCount('users')
                    ->get();
            }
            
            return response()->json($groups);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener los grupos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear grupo.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'storage_limit' => 'sometimes|integer|min:0',
        ]);

        try {
            $group = Group::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'storage_limit' => $validated['storage_limit'] ?? (1024 * 1024 * 10),
            ]);
            return response()->json($group, 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear el grupo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ver un grupo.
     */
    public function show(string $id)
    {
        try {
            $group = Group::findOrFail($id);
            return response()->json($group);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Grupo no encontrado',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Actualizar un grupo.
     */
    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'storage_limit' => 'sometimes|integer|min:0',
        ]);

        try {
            $group = Group::findOrFail($id);
            if (array_key_exists('name', $validated)) {
                $group->name = $validated['name'];
            }
            if (array_key_exists('description', $validated)) {
                $group->description = $validated['description'];
            }
            if (array_key_exists('storage_limit', $validated)) {
                $group->storage_limit = $validated['storage_limit'];
            }
            $group->save();
            return response()->json($group);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar el grupo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un grupo.
     */
    public function destroy(string $id)
    {
        try {
            $group = Group::findOrFail($id);
            $group->delete();
            
            return response()->json([
                'message' => 'Grupo eliminado correctamente'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar el grupo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Asignar usuario a grupo.
     */
    public function addUser(Request $request, Group $group)
    {
        $authUser = Auth::user();
        if (!$authUser->isAdmin()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($validated['user_id']);
        $group->users()->syncWithoutDetaching([$user->id]);

        return response()->json(['message' => 'Usuario asignado al grupo']);
    }

    /**
     * Quitar usuario de un grupo.
     */
    public function removeUser(Request $request, Group $group, User $user)
    {
        $authUser = Auth::user();
        if (!$authUser->isAdmin()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $group->users()->detach($user->id);

        return response()->json(['message' => 'Usuario removido del grupo']);
    }
}
