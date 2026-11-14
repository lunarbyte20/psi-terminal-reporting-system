<?php

use App\Modules\Terminals\Http\Controllers\SupervisorController;
use App\Modules\Terminals\Http\Controllers\TerminalController;
use App\Modules\Terminals\Http\Controllers\VehicleTypeController;
use Illuminate\Support\Facades\Route;

Route::middleware('can:administer')->prefix('admin')->name('admin.')->group(function (): void {
    Route::get('supervisors', [SupervisorController::class, 'index'])->name('supervisors.index');
    Route::get('supervisors/create', [SupervisorController::class, 'create'])->name('supervisors.create');
    Route::post('supervisors', [SupervisorController::class, 'store'])->middleware('throttle:30,1')->name('supervisors.store');
    Route::get('supervisors/{supervisor}', [SupervisorController::class, 'show'])->whereNumber('supervisor')->name('supervisors.show');
    Route::get('supervisors/{supervisor}/edit', [SupervisorController::class, 'edit'])->whereNumber('supervisor')->name('supervisors.edit');
    Route::put('supervisors/{supervisor}', [SupervisorController::class, 'update'])->whereNumber('supervisor')->middleware('throttle:30,1')->name('supervisors.update');
    Route::post('supervisors/{supervisor}/archive', [SupervisorController::class, 'archive'])->whereNumber('supervisor')->middleware('throttle:30,1')->name('supervisors.archive');

    Route::get('terminals', [TerminalController::class, 'index'])->name('terminals.index');
    Route::get('terminals/create', [TerminalController::class, 'create'])->name('terminals.create');
    Route::post('terminals', [TerminalController::class, 'store'])->middleware('throttle:30,1')->name('terminals.store');
    Route::get('terminals/{terminal}', [TerminalController::class, 'show'])->whereNumber('terminal')->name('terminals.show');
    Route::get('terminals/{terminal}/edit', [TerminalController::class, 'edit'])->whereNumber('terminal')->name('terminals.edit');
    Route::put('terminals/{terminal}', [TerminalController::class, 'update'])->whereNumber('terminal')->middleware('throttle:30,1')->name('terminals.update');
    Route::post('terminals/{terminal}/archive', [TerminalController::class, 'archive'])->whereNumber('terminal')->middleware('throttle:30,1')->name('terminals.archive');

    Route::get('vehicle-types', [VehicleTypeController::class, 'index'])->name('vehicle-types.index');
    Route::post('vehicle-types', [VehicleTypeController::class, 'store'])->middleware('throttle:30,1')->name('vehicle-types.store');
    Route::put('vehicle-types/{vehicleType}', [VehicleTypeController::class, 'update'])->whereNumber('vehicleType')->middleware('throttle:30,1')->name('vehicle-types.update');
    Route::post('vehicle-types/{vehicleType}/archive', [VehicleTypeController::class, 'archive'])->whereNumber('vehicleType')->middleware('throttle:30,1')->name('vehicle-types.archive');
});
