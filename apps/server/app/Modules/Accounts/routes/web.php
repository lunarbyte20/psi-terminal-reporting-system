<?php

use App\Modules\Accounts\Http\Controllers\AuditLogController;
use App\Modules\Accounts\Http\Controllers\UserAccountController;
use Illuminate\Support\Facades\Route;

Route::get('admin/audit-log', AuditLogController::class)->middleware('can:administer')->name('admin.audit-log');

Route::middleware('can:administer')->prefix('admin/users')->name('admin.users.')->group(function (): void {
    Route::get('/', [UserAccountController::class, 'index'])->name('index');
    Route::get('create', [UserAccountController::class, 'create'])->name('create');
    Route::post('/', [UserAccountController::class, 'store'])->middleware('throttle:20,1')->name('store');
    Route::get('{user}/edit', [UserAccountController::class, 'edit'])->whereNumber('user')->name('edit');
    Route::put('{user}', [UserAccountController::class, 'update'])->whereNumber('user')->middleware('throttle:20,1')->name('update');
    Route::post('{user}/status', [UserAccountController::class, 'status'])->whereNumber('user')->middleware('throttle:20,1')->name('status');
    Route::post('{user}/reset-password', [UserAccountController::class, 'resetPassword'])->whereNumber('user')->middleware('throttle:5,1')->name('reset-password');
});
