<?php

use App\Modules\Issues\Http\Controllers\ExportIssuesController;
use App\Modules\Issues\Http\Controllers\IssueController;
use App\Modules\Issues\Http\Controllers\IssueTagController;
use Illuminate\Support\Facades\Route;

Route::prefix('issues')->name('issues.')->group(function (): void {
    Route::get('export.csv', [ExportIssuesController::class, 'csv'])->name('export.csv');
    Route::get('export.xlsx', [ExportIssuesController::class, 'xlsx'])->name('export.xlsx');
    Route::get('/', [IssueController::class, 'index'])->name('index');
    Route::get('{issue}', [IssueController::class, 'show'])->whereNumber('issue')->name('show');
    Route::post('/', [IssueController::class, 'store'])->middleware('throttle:30,1')->name('store');
    Route::put('{issue}', [IssueController::class, 'update'])->whereNumber('issue')->middleware('throttle:30,1')->name('update');
    Route::delete('{issue}', [IssueController::class, 'destroy'])->whereNumber('issue')->middleware('throttle:10,1')->name('destroy');
});

Route::middleware('can:administer')->prefix('admin/issue-tags')->name('admin.issue-tags.')->group(function (): void {
    Route::get('/', [IssueTagController::class, 'index'])->name('index');
    Route::post('/', [IssueTagController::class, 'store'])->middleware('throttle:30,1')->name('store');
    Route::put('{issueTag}', [IssueTagController::class, 'update'])->middleware('throttle:30,1')->name('update');
    Route::post('{issueTag}/archive', [IssueTagController::class, 'archive'])->middleware('throttle:30,1')->name('archive');
});
