<?php

namespace Database\Seeders;

use App\Models\StorageSetting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class StorageSettingsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Usar el método current() que crea la configuración si no existe
        StorageSetting::current();
    }
}
