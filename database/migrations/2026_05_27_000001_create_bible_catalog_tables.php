<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bible_translations', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('abbreviation', 24)->unique();
            $table->string('language', 16)->default('pt-BR');
            $table->string('source')->nullable();
            $table->text('copyright')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        Schema::create('bible_books', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->string('abbreviation', 24)->unique();
            $table->enum('testament', ['old', 'new']);
            $table->unsignedTinyInteger('position')->unique();
            $table->unsignedTinyInteger('chapters_count');
            $table->timestamps();
        });

        Schema::create('bible_chapters', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('book_id')->constrained('bible_books')->cascadeOnDelete();
            $table->unsignedSmallInteger('number');
            $table->text('summary')->nullable();
            $table->timestamps();

            $table->unique(['book_id', 'number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bible_chapters');
        Schema::dropIfExists('bible_books');
        Schema::dropIfExists('bible_translations');
    }
};
