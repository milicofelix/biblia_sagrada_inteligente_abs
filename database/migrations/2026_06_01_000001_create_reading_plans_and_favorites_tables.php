<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verse_favorites', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('verse_id')->constrained('bible_verses')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'verse_id']);
            $table->index('verse_id');
        });

        Schema::create('reading_plans', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('days_count');
            $table->timestamps();
        });

        Schema::create('reading_plan_days', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('reading_plan_id')->constrained('reading_plans')->cascadeOnDelete();
            $table->unsignedSmallInteger('day_number');
            $table->string('title');
            $table->string('reference');
            $table->foreignId('start_verse_id')->nullable()->constrained('bible_verses')->nullOnDelete();
            $table->foreignId('end_verse_id')->nullable()->constrained('bible_verses')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['reading_plan_id', 'day_number']);
            $table->index(['reading_plan_id', 'completed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reading_plan_days');
        Schema::dropIfExists('reading_plans');
        Schema::dropIfExists('verse_favorites');
    }
};
