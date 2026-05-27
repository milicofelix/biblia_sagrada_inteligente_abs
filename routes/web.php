<?php

use App\Http\Controllers\Bible\SearchController;
use App\Models\Bible\AgentRun;
use App\Models\Bible\Book;
use App\Models\Bible\StudyNote;
use App\Models\Bible\Verse;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Dashboard', [
        'initialReference' => 'Joao 3:16',
        'stats' => [
            'books' => Book::query()->count(),
            'verses' => Verse::query()->count(),
            'notes' => StudyNote::query()->count(),
            'agentRuns' => AgentRun::query()->count(),
        ],
    ]);
})->name('dashboard');

Route::get('/buscar', [SearchController::class, '__invoke'])
    ->name('bible.search');
