<?php

use App\Modules\Reporting\Http\Controllers\DashboardController;
use App\Modules\Reporting\Http\Controllers\ExportTerminalSalesController;
use App\Modules\Reporting\Http\Controllers\ReportHistoryController;
use App\Modules\Reporting\Http\Controllers\ReportingWeekController;
use App\Modules\Reporting\Http\Controllers\ReportReviewController;
use App\Modules\Reporting\Http\Controllers\RidershipController;
use App\Modules\Reporting\Http\Controllers\WeeklyReportController;
use Illuminate\Support\Facades\Route;

Route::get('dashboard', DashboardController::class)->name('dashboard');
Route::get('dashboard/{week}/terminal-sales.csv', ExportTerminalSalesController::class)
    ->whereNumber('week')->middleware('throttle:30,1')->name('dashboard.export');
Route::get('history', ReportHistoryController::class)->name('history.index');
Route::get('ridership', RidershipController::class)->name('ridership.index');

Route::prefix('reports')->name('reports.')->group(function (): void {
    Route::get('/', [WeeklyReportController::class, 'index'])->name('index');
    Route::post('/', [WeeklyReportController::class, 'store'])->middleware('throttle:30,1')->name('store');
    Route::get('{report}', [WeeklyReportController::class, 'show'])->whereNumber('report')->name('show');
    Route::get('{report}/edit', [WeeklyReportController::class, 'edit'])->whereNumber('report')->name('edit');
    Route::put('{report}', [WeeklyReportController::class, 'update'])->whereNumber('report')->middleware('throttle:60,1')->name('update');
    Route::post('{report}/review', [ReportReviewController::class, 'store'])->whereNumber('report')->middleware('throttle:60,1')->name('review');
});

Route::middleware('can:administer')->prefix('admin/reporting-weeks')->name('admin.reporting-weeks.')->group(function (): void {
    Route::get('/', [ReportingWeekController::class, 'index'])->name('index');
    Route::post('/', [ReportingWeekController::class, 'store'])->middleware('throttle:20,1')->name('store');
});
