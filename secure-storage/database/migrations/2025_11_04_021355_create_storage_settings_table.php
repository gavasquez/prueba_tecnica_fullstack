<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('storage_settings', function (Blueprint $table) {
            $table->id();
            $table->string('setting_key')->unique();
            $table->text('setting_value');
            $table->timestamps();
        });

        // Insert default settings
        DB::table('storage_settings')->insert([
            ['setting_key' => 'banned_extensions', 'setting_value' => json_encode(['exe', 'bat', 'js', 'php', 'sh', 'py', 'rb', 'pl', 'cgi', 'asp', 'aspx', 'jsp', 'jar', 'dll'])],
            ['setting_key' => 'default_storage_limit', 'setting_value' => '10485760'], // 10MB in bytes
            ['setting_key' => 'max_file_size', 'setting_value' => '5242880'], // 5MB in bytes
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('storage_settings');
    }
};
