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

class FileController extends Controller
{
    /**
     * Obtener lista de archivos del usuario autenticado
     */
    public function index()
    {
        $user = Auth::user();
        
        // Si es administrador, ver todos los archivos, de lo contrario solo los del usuario
        $files = $user->isAdmin() 
            ? File::with(['user', 'group'])->latest()->paginate(20)
            : File::where('user_id', $user->id)
                ->orWhereIn('group_id', $user->groups->pluck('id'))
                ->with(['user', 'group'])
                ->latest()
                ->paginate(20);

        return response()->json($files);
    }

    /**
     * Almacenar un nuevo archivo
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'file' => 'required|file|max:10240', // Máximo 10MB
            'group_id' => 'required|exists:groups,id',
            'description' => 'nullable|string|max:500',
        ]);

        // Verificar si el usuario pertenece al grupo
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
        
        // Verificar extensión permitida
        $forbiddenExtensions = StorageSetting::first()->forbidden_extensions ?? [];
        if (in_array(strtolower($extension), $forbiddenExtensions)) {
            return response()->json([
                'message' => 'El tipo de archivo no está permitido.'
            ], 422);
        }

        // Verificar si es un archivo ZIP para inspeccionar su contenido
        if (strtolower($extension) === 'zip') {
            $zip = new ZipArchive;
            if ($zip->open($file->getPathname()) === true) {
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $zipFile = $zip->statIndex($i);
                    $zipExt = pathinfo($zipFile['name'], PATHINFO_EXTENSION);
                    if (in_array(strtolower($zipExt), $forbiddenExtensions)) {
                        return response()->json([
                            'message' => 'El archivo ZIP contiene archivos con extensiones no permitidas.'
                        ], 422);
                    }
                }
                $zip->close();
            }
        }

        // Verificar cuota de almacenamiento
        $group = Group::findOrFail($validated['group_id']);
        if (($group->used_storage + $size) > $group->storage_limit) {
            return response()->json([
                'message' => 'No hay suficiente espacio de almacenamiento en el grupo.'
            ], 422);
        }

        // Generar nombre único para el archivo
        $fileName = Str::random(40) . '.' . $extension;
        $filePath = 'files/' . $fileName;

        // Almacenar el archivo
        Storage::putFileAs('public/files', $file, $fileName);

        // Crear registro en la base de datos
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

        // Actualizar el espacio usado en el grupo
        $group->increment('used_storage', $size);

        return response()->json([
            'message' => 'Archivo subido exitosamente',
            'file' => $fileRecord->load('user', 'group')
        ], 201);
    }

    /**
     * Mostrar los detalles de un archivo
     */
    public function show(File $file)
    {
        $this->authorize('view', $file);
        return response()->json($file->load(['user', 'group']));
    }

    /**
     * Actualizar metadatos de un archivo (solo aprobación/rechazo para admin)
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
     * Eliminar un archivo
     */
    public function destroy(File $file)
    {
        $this->authorize('delete', $file);
        
        // Eliminar archivo físico
        Storage::delete('public/' . $file->path);
        
        // Actualizar espacio usado en el grupo
        if ($file->group) {
            $file->group->decrement('used_storage', $file->size);
        }
        
        // Eliminar registro
        $file->delete();
        
        return response()->json(['message' => 'Archivo eliminado correctamente']);
    }
    
    /**
     * Descargar un archivo
     */
    public function download(File $file)
    {
        $this->authorize('download', $file);
        
        if (!Storage::exists('public/' . $file->path)) {
            abort(404, 'El archivo no existe');
        }
        
        $filePath = storage_path('app/public/' . $file->path);
        return response()->download($filePath, $file->original_name);
    }
}
