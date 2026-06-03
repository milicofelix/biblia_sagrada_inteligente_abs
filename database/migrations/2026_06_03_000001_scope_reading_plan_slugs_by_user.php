<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reading_plans', function (Blueprint $table): void {
            $table->dropUnique('reading_plans_slug_unique');
            $table->unique(['user_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::table('reading_plans', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'slug']);
            $table->unique('slug');
        });
    }
};
