<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('worship_journal_entries', function (Blueprint $table): void {
            $table->unsignedTinyInteger('progress_percent')->default(0)->after('status');
            $table->string('progress_step', 80)->nullable()->after('progress_percent');
            $table->string('progress_message', 255)->nullable()->after('progress_step');
        });
    }

    public function down(): void
    {
        Schema::table('worship_journal_entries', function (Blueprint $table): void {
            $table->dropColumn(['progress_percent', 'progress_step', 'progress_message']);
        });
    }
};
