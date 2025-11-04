<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Listar usuarios.
     */
    public function index()
    {
        try {
            $user = Auth::user();
            
            // Verificar que el usuario sea administrador
            if (!$user->isAdmin()) {
                return response()->json([
                    'message' => 'No autorizado. Solo administradores pueden ver todos los usuarios.'
                ], 403);
            }
            
            // Obtener todos los usuarios con sus roles y grupos
            $users = User::with(['role', 'groups'])
                ->select('id', 'name', 'email', 'role_id', 'email_verified_at', 'created_at', 'updated_at')
                ->latest()
                ->get();
            
            // Agregar información calculada
            $users = $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role_id' => $user->role_id,
                    'role' => $user->role ? $user->role->name : null,
                    'is_admin' => $user->role_id === 1,
                    'storage_limit' => $user->storage_limit,
                    'groups' => $user->groups->map(function ($group) {
                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'description' => $group->description,
                        ];
                    }),
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ];
            });
            
            return response()->json($users);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener los usuarios',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear usuario.
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Verificar que el usuario sea administrador
            if (!$user->isAdmin()) {
                return response()->json([
                    'message' => 'No autorizado. Solo administradores pueden crear usuarios.'
                ], 403);
            }
            
            // Normalizar storage_limit vacío a null
            if ($request->has('storage_limit') && ($request->input('storage_limit') === '' || $request->input('storage_limit') === null)) {
                $request->merge(['storage_limit' => null]);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8',
                'role_id' => 'sometimes|integer|exists:roles,id',
                'storage_limit' => 'sometimes|nullable|numeric|min:0',
            ]);
            
            // Crear el usuario
            $newUser = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role_id' => $validated['role_id'] ?? 2, // Por defecto, usuario regular
                'storage_limit' => isset($validated['storage_limit']) ? (int)$validated['storage_limit'] : null,
            ]);
            
            // Cargar relaciones
            $newUser->load(['role', 'groups']);
            
            return response()->json([
                'id' => $newUser->id,
                'name' => $newUser->name,
                'email' => $newUser->email,
                'role_id' => $newUser->role_id,
                'role' => $newUser->role ? $newUser->role->name : null,
                'is_admin' => $newUser->role_id === 1,
                'storage_limit' => $newUser->storage_limit,
                'groups' => [],
                'created_at' => $newUser->created_at,
                'updated_at' => $newUser->updated_at,
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear el usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ver un usuario.
     */
    public function show(string $id)
    {
        try {
            $user = Auth::user();
            
            // Verificar que el usuario sea administrador
            if (!$user->isAdmin()) {
                return response()->json([
                    'message' => 'No autorizado. Solo administradores pueden ver usuarios.'
                ], 403);
            }
            
            $targetUser = User::with(['role', 'groups'])
                ->findOrFail($id);
            
            return response()->json([
                'id' => $targetUser->id,
                'name' => $targetUser->name,
                'email' => $targetUser->email,
                'role_id' => $targetUser->role_id,
                'role' => $targetUser->role ? $targetUser->role->name : null,
                'is_admin' => $targetUser->role_id === 1,
                'storage_limit' => $targetUser->storage_limit,
                'groups' => $targetUser->groups->map(function ($group) {
                    return [
                        'id' => $group->id,
                        'name' => $group->name,
                        'description' => $group->description,
                    ];
                }),
                'email_verified_at' => $targetUser->email_verified_at,
                'created_at' => $targetUser->created_at,
                'updated_at' => $targetUser->updated_at,
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Usuario no encontrado'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al obtener el usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar usuario.
     */
    public function update(Request $request, string $id)
    {
        try {
            $user = Auth::user();
            
            // Verificar que el usuario sea administrador
            if (!$user->isAdmin()) {
                return response()->json([
                    'message' => 'No autorizado. Solo administradores pueden actualizar usuarios.'
                ], 403);
            }
            
            $targetUser = User::findOrFail($id);
            
            // Normalizar storage_limit vacío a null
            if ($request->has('storage_limit') && ($request->input('storage_limit') === '' || $request->input('storage_limit') === null)) {
                $request->merge(['storage_limit' => null]);
            }

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => [
                    'sometimes',
                    'string',
                    'email',
                    'max:255',
                    Rule::unique('users')->ignore($targetUser->id)
                ],
                'password' => 'sometimes|string|min:8',
                'role_id' => 'sometimes|integer|exists:roles,id',
                'storage_limit' => 'sometimes|nullable|numeric|min:0',
            ]);
            
            // Actualizar campos
            if (isset($validated['name'])) {
                $targetUser->name = $validated['name'];
            }
            
            if (isset($validated['email'])) {
                $targetUser->email = $validated['email'];
            }
            
            if (isset($validated['password'])) {
                $targetUser->password = Hash::make($validated['password']);
            }
            
            if (isset($validated['role_id'])) {
                $targetUser->role_id = $validated['role_id'];
            }
        if (array_key_exists('storage_limit', $validated)) {
            $targetUser->storage_limit = isset($validated['storage_limit']) ? (int)$validated['storage_limit'] : null;
        }
            
            $targetUser->save();
            
            // Cargar relaciones
            $targetUser->load(['role', 'groups']);
            
            return response()->json([
                'id' => $targetUser->id,
                'name' => $targetUser->name,
                'email' => $targetUser->email,
                'role_id' => $targetUser->role_id,
                'role' => $targetUser->role ? $targetUser->role->name : null,
                'is_admin' => $targetUser->role_id === 1,
                'storage_limit' => $targetUser->storage_limit,
                'groups' => $targetUser->groups->map(function ($group) {
                    return [
                        'id' => $group->id,
                        'name' => $group->name,
                        'description' => $group->description,
                    ];
                }),
                'email_verified_at' => $targetUser->email_verified_at,
                'created_at' => $targetUser->created_at,
                'updated_at' => $targetUser->updated_at,
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Usuario no encontrado'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar el usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar usuario.
     */
    public function destroy(string $id)
    {
        try {
            $user = Auth::user();
            
            // Verificar que el usuario sea administrador
            if (!$user->isAdmin()) {
                return response()->json([
                    'message' => 'No autorizado. Solo administradores pueden eliminar usuarios.'
                ], 403);
            }
            
            // No permitir que un administrador se elimine a sí mismo
            if ($user->id == $id) {
                return response()->json([
                    'message' => 'No puedes eliminar tu propia cuenta.'
                ], 403);
            }
            
            $targetUser = User::findOrFail($id);
            $targetUser->delete();
            
            return response()->json([
                'message' => 'Usuario eliminado correctamente'
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Usuario no encontrado'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar el usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
