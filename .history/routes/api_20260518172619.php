<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ChatGroupController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\FriendshipController;
use App\Http\Controllers\GroupMessageController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\NotificationPreferenceController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ReactionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserBlockController;

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
    Route::post('/conversations/{conversation}/read', [ConversationController::class, 'markRead']);
    Route::post('/conversations/{conversation}/typing', [ConversationController::class, 'typing']);
    Route::post('/conversations/{conversation}/mute', [ConversationController::class, 'mute']);

    Route::get('/conversations/{conversation}/messages', [MessageController::class, 'index']);
    Route::post('/conversations/{conversation}/messages', [MessageController::class, 'store']);

    Route::get('/groups', [ChatGroupController::class, 'index']);
    Route::post('/groups', [ChatGroupController::class, 'store']);
    Route::get('/groups/{group}', [ChatGroupController::class, 'show']);
    Route::post('/groups/{group}/members', [ChatGroupController::class, 'addMember']);
    Route::post('/groups/{group}/mute', [ChatGroupController::class, 'mute']);

    Route::get('/groups/{group}/messages', [GroupMessageController::class, 'index']);
    Route::post('/groups/{group}/messages', [GroupMessageController::class, 'store']);
    Route::post('/groups/{group}/typing', [GroupMessageController::class, 'typing']);

    Route::get('/friendships', [FriendshipController::class, 'index']);
    Route::post('/friendships', [FriendshipController::class, 'store']);
    Route::patch('/friendships/{friendship}/respond', [FriendshipController::class, 'respond']);
    Route::delete('/friendships/{friendship}', [FriendshipController::class, 'destroy']);

    Route::get('/blocks', [UserBlockController::class, 'index']);
    Route::post('/blocks', [UserBlockController::class, 'store']);
    Route::delete('/blocks/{blockedUser}', [UserBlockController::class, 'destroy']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/{notificationId}/read', [NotificationController::class, 'markAsRead']);

    Route::get('/notification-preferences', [NotificationPreferenceController::class, 'show']);
    Route::patch('/notification-preferences', [NotificationPreferenceController::class, 'update']);

    Route::get('/communities', [CommunityController::class, 'index']);
    Route::post('/communities', [CommunityController::class, 'store']);
    Route::get('/communities/{community}', [CommunityController::class, 'show']);
    Route::post('/communities/{community}/join', [CommunityController::class, 'join']);

    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::get('/posts/{post}', [PostController::class, 'show']);

    Route::get('/posts/{post}/comments', [CommentController::class, 'index']);
    Route::post('/posts/{post}/comments', [CommentController::class, 'store']);

    Route::post('/posts/{post}/reactions', [ReactionController::class, 'reactToPost']);
    Route::post('/comments/{comment}/reactions', [ReactionController::class, 'reactToComment']);

    Route::get('/reports/mine', [ReportController::class, 'indexMine']);
    Route::post('/reports', [ReportController::class, 'store']);
    Route::get('/admin/reports', [ReportController::class, 'queue']);
    Route::patch('/admin/reports/{report}/resolve', [ReportController::class, 'resolve']);
});
