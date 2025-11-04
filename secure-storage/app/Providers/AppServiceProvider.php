<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Definir gate para verificar si el usuario es administrador
        Gate::define('admin', function ($user) {
            // Verificar directamente el role_id para evitar cargar la relación
            return $user->role_id === 1;
        });
    }
}
