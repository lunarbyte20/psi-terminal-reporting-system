<?php

use App\Modules\Reporting\Actions\ResolveReportPeriod;
use App\Modules\Reporting\Http\Controllers\BulkApproveWeeklyReportsController;
use App\Modules\Reporting\Http\Controllers\DashboardController;
use App\Modules\Reporting\Http\Controllers\ExportMonthlyTerminalXlsxController;
use App\Modules\Reporting\Http\Controllers\ExportTerminalSalesController;
use App\Modules\Reporting\Http\Controllers\ExportTerminalSalesXlsxController;
use App\Modules\Reporting\Http\Controllers\ManagementReportController;
use App\Modules\Reporting\Http\Controllers\ManagementReportPdfController;
use App\Modules\Reporting\Http\Controllers\MonthlyTerminalSummaryController;
use App\Modules\Reporting\Http\Controllers\ReportHistoryController;
use App\Modules\Reporting\Http\Controllers\ReportingWeekController;
use App\Modules\Reporting\Http\Controllers\ReportReviewController;
use App\Modules\Reporting\Http\Controllers\ReportSettingsController;
use App\Modules\Reporting\Http\Controllers\RequestReportReopenController;
use App\Modules\Reporting\Http\Controllers\RidershipController;
use App\Modules\Reporting\Http\Controllers\SendWeeklyReportRemindersController;
use App\Modules\Reporting\Http\Controllers\WeeklyReportController;
use Illuminate\Support\Facades\Route;

Route::get('dashboard', DashboardController::class)->name('dashboard');
// {period} is a reporting week id ("42") or a month ("2026-11").
Route::get('dashboard/{period}/terminal-sales.csv', ExportTerminalSalesController::class)
    ->where('period', ResolveReportPeriod::PATTERN)->middleware('throttle:30,1')->name('dashboard.export');
Route::get('dashboard/{period}/terminal-sales.xlsx', ExportTerminalSalesXlsxController::class)
    ->where('period', ResolveReportPeriod::PATTERN)->middleware('throttle:30,1')->name('dashboard.export-xlsx');
Route::get('dashboard/{period}/management-report', ManagementReportController::class)
    ->where('period', ResolveReportPeriod::PATTERN)->name('dashboard.management-report');
Route::get('dashboard/{period}/management-report/pdf', ManagementReportPdfController::class)
    ->where('period', ResolveReportPeriod::PATTERN)->middleware('throttle:20,1')->name('dashboard.management-report-pdf');
Route::get('history', ReportHistoryController::class)->name('history.index');
Route::get('ridership', RidershipController::class)->name('ridership.index');

Route::prefix('reports')->name('reports.')->group(function (): void {
    Route::get('/', [WeeklyReportController::class, 'index'])->name('index');
    Route::get('monthly', MonthlyTerminalSummaryController::class)->name('monthly');
    Route::get('monthly/export.xlsx', ExportMonthlyTerminalXlsxController::class)->middleware('throttle:30,1')->name('monthly.export-xlsx');
    Route::post('/', [WeeklyReportController::class, 'store'])->middleware('throttle:30,1')->name('store');
    Route::get('{report}', [WeeklyReportController::class, 'show'])->whereNumber('report')->name('show');
    Route::get('{report}/edit', [WeeklyReportController::class, 'edit'])->whereNumber('report')->name('edit');
    Route::put('{report}', [WeeklyReportController::class, 'update'])->whereNumber('report')->middleware('throttle:60,1')->name('update');
    Route::post('{report}/review', [ReportReviewController::class, 'store'])->whereNumber('report')->middleware('throttle:60,1')->name('review');
    Route::post('{report}/request-reopen', RequestReportReopenController::class)->whereNumber('report')->middleware('throttle:20,1')->name('request-reopen');
    Route::post('bulk-approve', BulkApproveWeeklyReportsController::class)->middleware(['can:administer', 'throttle:20,1'])->name('bulk-approve');
    Route::post('send-reminders', SendWeeklyReportRemindersController::class)->middleware(['can:administer', 'throttle:10,1'])->name('send-reminders');
});

Route::middleware('can:administer')->prefix('admin/reporting-weeks')->name('admin.reporting-weeks.')->group(function (): void {
    Route::get('/', [ReportingWeekController::class, 'index'])->name('index');
    Route::post('/', [ReportingWeekController::class, 'store'])->middleware('throttle:20,1')->name('store');
});

Route::middleware('can:administer')->prefix('admin/report-settings')->name('admin.report-settings.')->group(function (): void {
    Route::get('/', [ReportSettingsController::class, 'edit'])->name('edit');
    Route::put('/', [ReportSettingsController::class, 'update'])->middleware('throttle:20,1')->name('update');
});
