<?php

use App\Modules\Organization\Http\Controllers\Admin\WorkspaceController;
use App\Modules\Organization\Http\Middleware\RequirePasswordChange;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [WorkspaceController::class, 'dashboard'])
        ->middleware(RequirePasswordChange::class)
        ->name('dashboard');
});

require __DIR__.'/settings.php';
