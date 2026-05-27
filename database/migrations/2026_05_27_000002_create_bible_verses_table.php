<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bible_verses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('translation_id')->constrained('bible_translations')->cascadeOnDelete();
            $table->foreignId('book_id')->constrained('bible_books')->cascadeOnDelete();
            $table->foreignId('chapter_id')->constrained('bible_chapters')->cascadeOnDelete();
            $table->unsignedSmallInteger('chapter_number');
            $table->unsignedSmallInteger('verse_number');
            $table->string('reference', 120);
            $table->text('text');
            $table->timestamps();

            $table->unique(['translation_id', 'book_id', 'chapter_number', 'verse_number'], 'bible_verses_unique_reference');
            $table->index(['book_id', 'chapter_number']);
            $table->index('reference');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE bible_verses ADD FULLTEXT bible_verses_reference_text_fulltext (reference, text)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bible_verses');
    }
};
