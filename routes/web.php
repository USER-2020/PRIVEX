<?php

use App\Http\Controllers\BeamsAuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ChatMessageController;
use App\Http\Controllers\ChatRequestController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Broadcast;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('welcome');

Route::get('/forgot-password', function () {
    return Inertia::render('Auth/ForgotPassword');
})->name('password.request');

Broadcast::routes(['middleware' => ['auth']]);

Route::middleware('auth')->get('/dashboard', [DashboardController::class, 'show'])->name('dashboard');

Route::get('/chat/request', [ChatRequestController::class, 'create'])->name('chat.request');
Route::post('/chat/request', [ChatRequestController::class, 'store'])->name('chat.request.store');
Route::get('/chat/public/{token}', [ChatController::class, 'showPublic'])->name('chat.public');
Route::post('/chat/public/{token}/messages', [ChatMessageController::class, 'storePublic'])->name('chat.public.messages');
Route::post('/push/subscribe', [PushSubscriptionController::class, 'store'])->name('push.subscribe');
Route::post('/push/test', [PushSubscriptionController::class, 'test'])->name('push.test');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::post('/user/delete', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/chat', [ChatController::class, 'show'])->name('chat.show');
    Route::post('/chat/{chat}/messages', [ChatMessageController::class, 'store'])->name('chat.messages.store');
    Route::post('/beams/auth', [BeamsAuthController::class, 'auth'])->name('beams.auth');
    Route::post('/notifications/read', [NotificationController::class, 'markAllRead'])->name('notifications.read');

    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/chat-requests', [ChatRequestController::class, 'adminIndex'])->name('admin.chat.requests');
        Route::post('/admin/chat-requests/{chatRequest}/approve', [ChatRequestController::class, 'approve'])
            ->name('admin.chat.requests.approve');
        Route::post('/admin/chat-requests/{chatRequest}/reject', [ChatRequestController::class, 'reject'])
            ->name('admin.chat.requests.reject');
        Route::get('/admin/chat/{chat}', [ChatController::class, 'showAdmin'])->name('admin.chat.show');
        Route::post('/admin/chat/{chat}/close', [ChatController::class, 'close'])->name('admin.chat.close');
    });
});
