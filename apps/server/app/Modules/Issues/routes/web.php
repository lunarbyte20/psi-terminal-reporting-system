<?php

use App\Modules\Issues\Http\Controllers\IssueController;
use Illuminate\Support\Facades\Route;

Route::prefix('issues')->name('issues.')->group(function (): void {
    Route::get('/', [IssueController::class, 'index'])->name('index');
    Route::post('/', [IssueController::class, 'store'])->middleware('throttle:30,1')->name('store');
    Route::put('{issue}', [IssueController::class, 'update'])->whereNumber('issue')->middleware('throttle:30,1')->name('update');
    Route::delete('{issue}', [IssueController::class, 'destroy'])->whereNumber('issue')->middleware('throttle:10,1')->name('destroy');
});
