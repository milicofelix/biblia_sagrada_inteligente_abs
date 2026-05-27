<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_questions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('verse_id')->nullable()->constrained('bible_verses')->nullOnDelete();
            $table->longText('question');
            $table->string('intent', 80)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('ai_answers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('question_id')->constrained('ai_questions')->cascadeOnDelete();
            $table->string('model', 120)->nullable();
            $table->longText('answer');
            $table->json('citations')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('agent_runs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('answer_id')->nullable()->constrained('ai_answers')->cascadeOnDelete();
            $table->string('agent', 80);
            $table->string('status', 40)->default('pending');
            $table->json('input')->nullable();
            $table->json('output')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index(['agent', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_runs');
        Schema::dropIfExists('ai_answers');
        Schema::dropIfExists('ai_questions');
    }
};
