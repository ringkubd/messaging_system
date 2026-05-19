<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ChatGroupController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\FriendshipController;
use App\Http\Controllers\GroupMessageController;
use App\Http\Controllers\MessageController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::get('/me', function (Request $request) {
        return $request->user();
    });

    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::post('/conversations', [ConversationController::class, 'store']);
    Route::get('/conversations/{conversation}', [ConversationController::class, 'show']);

    Route::get('/conversations/{conversation}/messages', [MessageController::class, 'index']);
    Route::post('/conversations/{conversation}/messages', [MessageController::class, 'store']);

    Route::get('/groups', [ChatGroupController::class, 'index']);
    Route::post('/groups', [ChatGroupController::class, 'store']);
    Route::get('/groups/{group}', [ChatGroupController::class, 'show']);
    Route::post('/groups/{group}/members', [ChatGroupController::class, 'addMember']);

    Route::get('/groups/{group}/messages', [GroupMessageController::class, 'index']);
    Route::post('/groups/{group}/messages', [GroupMessageController::class, 'store']);

    Route::get('/friendships', [FriendshipController::class, 'index']);
    Route::post('/friendships', [FriendshipController::class, 'store']);
    Route::patch('/friendships/{friendship}/respond', [FriendshipController::class, 'respond']);
});
