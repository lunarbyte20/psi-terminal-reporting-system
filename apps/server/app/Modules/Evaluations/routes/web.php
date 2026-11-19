<?php

use App\Modules\Evaluations\Http\Controllers\ManagementEvaluationController;
use Illuminate\Support\Facades\Route;

Route::get('evaluation', [ManagementEvaluationController::class, 'show'])->name('evaluation.show');
Route::put('evaluation/{week}', [ManagementEvaluationController::class, 'update'])
    ->whereNumber('week')->middleware('throttle:30,1')->name('evaluation.update');
