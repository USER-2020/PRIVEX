<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->string('sender_name', 80)->nullable();
            $table->string('sender_role', 20)->default('user');
        });

        $driver = DB::getDriverName();
        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement('ALTER TABLE chat_messages MODIFY user_id BIGINT UNSIGNED NULL');
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();
        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement('ALTER TABLE chat_messages MODIFY user_id BIGINT UNSIGNED NOT NULL');
        }

        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropColumn(['sender_name', 'sender_role']);
        });
    }
};
