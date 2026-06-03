<?php

use App\Http\Controllers\Ai\AnswerQuestionController;
use App\Http\Controllers\Ai\ShowAnswerController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Bible\CompleteReadingPlanDayController;
use App\Http\Controllers\Bible\SearchController;
use App\Http\Controllers\Bible\StoreStudyNoteController;
use App\Http\Controllers\Bible\ToggleVerseFavoriteController;
use App\Support\DashboardProps;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login.store');
    Route::get('/cadastro', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/cadastro', [RegisteredUserController::class, 'store'])->name('register.store');
});

Route::middleware('auth')->group(function (): void {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::get('/', function () {
        return Inertia::render('Dashboard', [
            'initialReference' => 'Joao 3:16',
            ...DashboardProps::make(request()->user()),
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
});
