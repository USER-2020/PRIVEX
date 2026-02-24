<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_requests', function (Blueprint $table) {
            $table->string('public_token', 64)->nullable()->unique();
        });

        Schema::table('chats', function (Blueprint $table) {
            $table->string('public_token', 64)->nullable()->unique();
        });
    }

    public function down(): void
    {
        Schema::table('chat_requests', function (Blueprint $table) {
            $table->dropUnique(['public_token']);
            $table->dropColumn('public_token');
        });

        Schema::table('chats', function (Blueprint $table) {
            $table->dropUnique(['public_token']);
            $table->dropColumn('public_token');
        });
    }
};
