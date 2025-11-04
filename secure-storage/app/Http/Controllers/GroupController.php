<?php

namespace App\Http\Controllers;

use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GroupController extends Controller
{
    /**
     * Display a listing of the resource.
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
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        try {
            $group = Group::create($validated);
            return response()->json($group, 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear el grupo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
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
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]);

        try {
            $group = Group::findOrFail($id);
            $group->update($validated);
            return response()->json($group);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar el grupo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
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
}
