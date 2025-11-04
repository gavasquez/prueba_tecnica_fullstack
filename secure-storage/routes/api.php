<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\StorageSettingController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Rutas de autenticación
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Rutas protegidas
Route::middleware('auth:sanctum')->group(function () {
    // Obtener usuario autenticado
    Route::get('/user', [AuthController::class, 'user']);
    
    // Cerrar sesión
    Route::post('/logout', [AuthController::class, 'logout']);

    // Rutas de archivos
    Route::apiResource('files', FileController::class);
    Route::get('files/{file}/download', [FileController::class, 'download'])
        ->name('files.download')
        ->middleware('can:download,file');

    // Rutas de grupos
    Route::apiResource('groups', GroupController::class);
    Route::post('groups/{group}/users', [GroupController::class, 'addUser']);
    Route::delete('groups/{group}/users/{user}', [GroupController::class, 'removeUser']);

    // Rutas de usuarios (solo administradores)
    Route::middleware('can:admin')->group(function () {
        Route::apiResource('users', UserController::class);
    });

    // Rutas de configuración (solo administradores)
    Route::middleware('can:admin')->group(function () {
        Route::apiResource('settings', StorageSettingController::class);
    });
});
