<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('worship_journal_entries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('verse_id')->nullable()->constrained('bible_verses')->nullOnDelete();
            $table->date('worship_date');
            $table->string('passage_reference', 160);
            $table->string('title')->nullable();
            $table->string('church_name')->nullable();
            $table->string('preacher_name')->nullable();
            $table->longText('personal_notes')->nullable();
            $table->json('passage')->nullable();
            $table->longText('ai_study')->nullable();
            $table->string('status', 40)->default('queued');
            $table->text('error')->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'worship_date']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('worship_journal_entries');
    }
};
