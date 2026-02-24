<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'apiLogin'])->name('api.login');
Route::post('/logout', [AuthController::class, 'apiLogout'])
    ->middleware('jwt.auth')
    ->name('api.logout');

Route::get('/me', [AuthController::class, 'me'])
    ->middleware('jwt.auth')
    ->name('api.me');
