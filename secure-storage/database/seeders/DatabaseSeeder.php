<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Models\Group;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Crear roles
        $adminRole = Role::firstOrCreate(['name' => 'admin'], [
            'description' => 'Administrador del sistema'
        ]);
        
        $userRole = Role::firstOrCreate(['name' => 'user'], [
            'description' => 'Usuario regular'
        ]);

        // Crear usuario administrador
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
            ]
        );

        // Crear usuario de prueba
        $user = User::firstOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'Usuario de Prueba',
                'password' => Hash::make('password'),
                'role_id' => $userRole->id,
            ]
        );

        // Crear grupo de prueba
        $group = Group::firstOrCreate(
            ['name' => 'Grupo Principal'],
            [
                'description' => 'Grupo principal para pruebas',
                'storage_limit' => 1048576, // 1GB
                'used_storage' => 0,
            ]
        );

        // Asignar usuarios al grupo
        if (!$admin->groups->contains($group->id)) {
            $admin->groups()->attach($group->id);
        }
        if (!$user->groups->contains($group->id)) {
            $user->groups()->attach($group->id);
        }

        // Ejecutar seeder de configuración de almacenamiento
        $this->call([
            StorageSettingsTableSeeder::class,
        ]);
    }
}
