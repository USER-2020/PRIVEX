<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_requests', function (Blueprint $table) {
            $table->timestamp('photo_deleted_at')->nullable()->after('photo_path');
        });
    }

    public function down(): void
    {
        Schema::table('chat_requests', function (Blueprint $table) {
            $table->dropColumn('photo_deleted_at');
        });
    }
};
