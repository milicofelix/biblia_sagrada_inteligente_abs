<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bible_cross_references', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('source_verse_id')->constrained('bible_verses')->cascadeOnDelete();
            $table->foreignId('target_verse_id')->constrained('bible_verses')->cascadeOnDelete();
            $table->string('relationship', 80)->default('related');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['source_verse_id', 'target_verse_id']);
        });

        Schema::create('study_notes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('verse_id')->nullable()->constrained('bible_verses')->nullOnDelete();
            $table->string('title');
            $table->longText('body');
            $table->string('visibility', 24)->default('private');
            $table->timestamps();

            $table->index(['user_id', 'visibility']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('study_notes');
        Schema::dropIfExists('bible_cross_references');
    }
};
