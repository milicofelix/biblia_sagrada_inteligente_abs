<?php

use App\Http\Controllers\Ai\AnswerQuestionController;
use App\Http\Controllers\Ai\ShowAnswerController;
use App\Http\Controllers\Bible\CompleteReadingPlanDayController;
use App\Http\Controllers\Bible\SearchController;
use App\Http\Controllers\Bible\StoreStudyNoteController;
use App\Http\Controllers\Bible\ToggleVerseFavoriteController;
use App\Support\DashboardProps;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Dashboard', [
        'initialReference' => 'Joao 3:16',
        ...DashboardProps::make(),
    ]);
})->name('dashboard');

Route::get('/buscar', [SearchController::class, '__invoke'])
    ->name('bible.search');

Route::post('/versiculos/{verse}/notas', StoreStudyNoteController::class)
    ->name('bible.verses.notes.store');

Route::post('/versiculos/{verse}/favorito', ToggleVerseFavoriteController::class)
    ->name('bible.verses.favorite.toggle');

Route::post('/planos-leitura/dias/{day}/concluir', CompleteReadingPlanDayController::class)
    ->name('bible.reading-plan-days.complete');

Route::post('/ai/responder', AnswerQuestionController::class)
    ->name('ai.answer');

Route::get('/ai/respostas/{answer}', ShowAnswerController::class)
    ->name('ai.answer.show');
