<?php

use Illuminate\Support\Facades\Route;

// Public landing page; every feature route lives in app/Modules/*/routes/web.php behind sign-in.
Route::inertia('/', 'welcome')->name('home');

require __DIR__.'/settings.php';
