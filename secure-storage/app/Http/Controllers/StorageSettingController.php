<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StorageSettingController extends Controller
{
    /**
     * Obtener la configuración completa (solo para administradores).
     */
    public function index()
    {
        $settings = DB::table('storage_settings')
            ->pluck('setting_value', 'setting_key');

        return response()->json([
            'banned_extensions' => json_decode($settings['banned_extensions'] ?? '[]', true),
            'default_storage_limit' => (int)($settings['default_storage_limit'] ?? 10485760),
            'max_file_size' => (int)($settings['max_file_size'] ?? 5242880),
        ]);
    }

    /**
     * Versión pública (no admin) para consultar límites por defecto
     */
    public function publicIndex()
    {
        $settings = DB::table('storage_settings')
            ->pluck('setting_value', 'setting_key');

        return response()->json([
            'default_storage_limit' => (int)($settings['default_storage_limit'] ?? 10485760),
            'max_file_size' => (int)($settings['max_file_size'] ?? 5242880),
        ]);
    }

    /**
     * Crear configuración (no se utiliza; la configuración se actualiza vía update).
     */
    public function store(Request $request)
    {
        return response()->json(['message' => 'Método no permitido'], 405);
    }

    /**
     * Mostrar una configuración específica (no implementado).
     */
    public function show(string $id)
    {
        return response()->json(['message' => 'Método no implementado'], 501);
    }

    /**
     * Actualizar la configuración (valores globales: extensiones prohibidas, límites, etc.).
     */
    public function update(Request $request, string $id)
    {
        // Permitir actualización sin ID específico (usar un solo registro lógico)
        $validated = $request->validate([
            'banned_extensions' => 'sometimes|array',
            'banned_extensions.*' => 'string',
            'default_storage_limit' => 'sometimes|integer|min:0',
            'max_file_size' => 'sometimes|integer|min:0',
        ]);

        foreach (['banned_extensions', 'default_storage_limit', 'max_file_size'] as $key) {
            if (array_key_exists($key, $validated)) {
                $value = $validated[$key];
                DB::table('storage_settings')->updateOrInsert(
                    ['setting_key' => $key],
                    ['setting_value' => is_array($value) ? json_encode($value) : (string)$value, 'updated_at' => now(), 'created_at' => now()]
                );
            }
        }

        return $this->index();
    }

    /**
     * Eliminar configuración (no se utiliza).
     */
    public function destroy(string $id)
    {
        return response()->json(['message' => 'Método no permitido'], 405);
    }
}
