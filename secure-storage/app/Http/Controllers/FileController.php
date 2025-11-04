<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Group;
use App\Models\StorageSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\File as HttpFile;
use Illuminate\Validation\Rule;
use ZipArchive;
use App\Support\StorageConfig;

class FileController extends Controller
{
    /**
     * Listar archivos del usuario autenticado (o todos si es admin).
     */
    public function index()
    {
        $user = Auth::user();
        
        // Si es administrador, ver todos los archivos; de lo contrario, solo archivos subidos por el usuario
        $files = $user->isAdmin()
            ? File::with(['user', 'group'])->latest()->paginate(20)
            : File::where('user_id', $user->id)
                ->with(['user', 'group'])
                ->latest()
                ->paginate(20);

        return response()->json($files);
    }

    /**
     * Subir un archivo nuevo con validaciones de seguridad y cuota.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        // Validar tamaño de archivo dinámicamente
        $maxFileSizeBytes = StorageConfig::getMaxFileSize();
        $maxFileSizeKb = (int) ceil($maxFileSizeBytes / 1024);

        $validated = $request->validate([
            'file' => 'required|file|max:' . $maxFileSizeKb,
            'group_id' => 'required|exists:groups,id',
            'description' => 'nullable|string|max:500',
        ]);

        // Verificar que el usuario pertenezca al grupo (salvo admin)
        if (!$user->groups->contains($validated['group_id']) && !$user->isAdmin()) {
            return response()->json([
                'message' => 'No tienes permiso para subir archivos a este grupo.'
            ], 403);
        }

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $mimeType = $file->getMimeType();
        $size = $file->getSize();
        
        // Validar extensión no prohibida
        $forbiddenExtensions = StorageConfig::getBannedExtensions();
        if (in_array(strtolower($extension), $forbiddenExtensions)) {
            return response()->json([
                'message' => "Error: El tipo de archivo '.{$extension}' no está permitido"
            ], 422);
        }

        // Si es .zip, inspeccionar su contenido por extensiones prohibidas
        if (strtolower($extension) === 'zip') {
            $zip = new ZipArchive;
            if ($zip->open($file->getPathname()) === true) {
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $zipFile = $zip->statIndex($i);
                    $zipExt = pathinfo($zipFile['name'], PATHINFO_EXTENSION);
                    if (in_array(strtolower($zipExt), $forbiddenExtensions)) {
                        return response()->json([
                            'message' => "Error: El archivo '{$zipFile['name']}' dentro del .zip no está permitido"
                        ], 422);
                    }
                }
                $zip->close();
            }
        }

        // Verificar cuota (prioridad: usuario > grupo > global)
        $group = Group::findOrFail($validated['group_id']);
        $assignedQuota = $user->storage_limit
            ?? $group->storage_limit
            ?? StorageConfig::getDefaultStorageLimit();

        // Uso actual del usuario (suma total de sus archivos)
        $currentUsage = File::where('user_id', $user->id)->sum('size');
        if (($currentUsage + $size) > $assignedQuota) {
            $assignedQuotaMb = number_format($assignedQuota / (1024 * 1024), 2);
            return response()->json([
                'message' => "Error: Cuota de almacenamiento ({$assignedQuotaMb} MB) excedida"
            ], 422);
        }

        // Nombre único y ruta de almacenamiento
        $fileName = Str::random(40) . '.' . $extension;
        $filePath = 'files/' . $fileName;

        // Guardar archivo físico
        Storage::putFileAs('public/files', $file, $fileName);

        // Guardar registro en base de datos
        $fileRecord = File::create([
            'user_id' => $user->id,
            'group_id' => $validated['group_id'],
            'original_name' => $originalName,
            'stored_name' => $fileName,  // Añadido el campo stored_name
            'path' => 'files',  // Solo el directorio, no el nombre del archivo
            'mime_type' => $mimeType,
            'size' => $size,
            'description' => $validated['description'] ?? null,
            'is_approved' => $user->isAdmin(), // Aprobación automática si es admin
        ]);

        // Nota: el uso por grupo se infiere por archivos; no se mantienen contadores manuales

        return response()->json([
            'message' => 'Archivo subido exitosamente',
            'file' => $fileRecord->load('user', 'group')
        ], 201);
    }

    /**
     * Ver detalles de un archivo.
     */
    public function show(File $file)
    {
        $this->authorize('view', $file);
        return response()->json($file->load(['user', 'group']));
    }

    /**
     * Aprobar o rechazar un archivo (solo admin).
     */
    public function update(Request $request, File $file)
    {
        $this->authorize('update', $file);
        
        $validated = $request->validate([
            'is_approved' => 'required|boolean',
            'rejection_reason' => 'required_if:is_approved,false|string|max:500',
        ]);

        $file->update([
            'is_approved' => $validated['is_approved'],
            'rejection_reason' => $validated['rejection_reason'] ?? null,
        ]);

        return response()->json([
            'message' => $validated['is_approved'] ? 'Archivo aprobado' : 'Archivo rechazado',
            'file' => $file->load(['user', 'group'])
        ]);
    }

    /**
     * Eliminar un archivo (archivo físico y registro).
     */
    public function destroy(File $file)
    {
        $this->authorize('delete', $file);
        
        // Eliminar archivo físico
        Storage::delete('public/' . trim($file->path, '/'). '/' . $file->stored_name);
        
        // Nota: no se tocan contadores manuales de grupos para evitar inconsistencias
        
        // Eliminar registro
        $file->delete();
        
        return response()->json(['message' => 'Archivo eliminado correctamente']);
    }
    
    /**
     * Descargar un archivo.
     */
    public function download(File $file)
    {
        $this->authorize('download', $file);
        
        $relativePath = trim($file->path, '/'). '/' . $file->stored_name;
        if (!Storage::exists('public/' . $relativePath)) {
            abort(404, 'El archivo no existe');
        }
        
        $filePath = storage_path('app/public/' . $relativePath);
        return response()->download($filePath, $file->original_name);
    }
}
