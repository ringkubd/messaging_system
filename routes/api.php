<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CallRoomController;
use App\Http\Controllers\ChatGroupController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\FriendshipController;
use App\Http\Controllers\GroupMessageController;
use App\Http\Controllers\MeController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\NotificationPreferenceController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ReactionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserBlockController;
use App\Http\Controllers\UserDirectoryController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\Admin\AnnouncementController as AdminAnnouncementController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\AuditLogController as AdminAuditLogController;
use App\Http\Controllers\Admin\InstitutionController as AdminInstitutionController;
use App\Http\Controllers\Admin\ScholarshipController as AdminScholarshipController;
use App\Http\Controllers\Admin\BatchController as AdminBatchController;
use App\Http\Controllers\Admin\ModerationController as AdminModerationController;
use App\Http\Controllers\Admin\AttendanceController as AdminAttendanceController;
use App\Http\Controllers\Admin\AdminSuccessStoryController;
use App\Http\Controllers\Admin\AIController as AdminAIController;
use App\Http\Controllers\Admin\PlacementController as AdminPlacementController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\MentorshipController;
use App\Http\Controllers\ReferenceController;
use App\Http\Controllers\SuccessStoryController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\ResourceController;
use App\Http\Controllers\ResumeController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\Admin\AnalyticsController as AdminAnalyticsController;
use App\Http\Controllers\BadgeController;
use App\Http\Controllers\ChatbotController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\LiveStreamController;

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

Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [PasswordResetController::class, 'sendResetLink']);
    Route::post('/auth/reset-password', [PasswordResetController::class, 'reset']);
    Route::get('/auth/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail']);

    // SRS/Nginx on_publish webhook (called by streaming server, no auth)
    Route::get('/live-streams/auth-stream', [LiveStreamController::class, 'authStream']);
    Route::get('/live-streams/end-stream', [LiveStreamController::class, 'endStreamByKey']);
});

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/email/resend', [AuthController::class, 'resendVerificationEmail']);

    Route::get('/me', function (Request $request) {
        return $request->user();
    });
    Route::put('/me', [MeController::class, 'updateProfile']);
    Route::get('/me/stats', [MeController::class, 'stats']);
    Route::get('/resume', [MeController::class, 'resume']);
    Route::post('/resume/analyze', [ResumeController::class, 'analyze']);
    Route::get('/resume/suggestions', [ResumeController::class, 'suggestions']);
    Route::post('/resume/accept-suggestions', [ResumeController::class, 'acceptSuggestions']);

    Route::get('/notifications/unread-count', [MeController::class, 'unreadNotificationsCount']);

    Route::get('/profile', [UserProfileController::class, 'show']);
    Route::put('/profile', [UserProfileController::class, 'update']);

    Route::get('/users', [UserDirectoryController::class, 'index']);
    Route::get('/search', [SearchController::class, 'index']);
    Route::post('/ai/generate-tags', [AIController::class, 'generateTags']);

    Route::get('/jobs/matching', [JobController::class, 'matchingJobs']);
    Route::apiResource('jobs', JobController::class)->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::get('/my-jobs', [JobController::class, 'myJobs']);

    Route::post('/chatbot/chat', [ChatbotController::class, 'chat']);
    Route::get('/chatbot/history', [ChatbotController::class, 'history']);

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
    Route::get('/friendships/accepted', [FriendshipController::class, 'accepted']);
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
    Route::post('/communities/{community}/leave', [CommunityController::class, 'leave']);
    Route::post('/communities/{community}/invite', [CommunityController::class, 'invite']);

    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::get('/posts/{post}', [PostController::class, 'show']);
    Route::put('/posts/{post}', [PostController::class, 'update']);
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);

    Route::get('/posts/{post}/comments', [CommentController::class, 'index']);
    Route::post('/posts/{post}/comments', [CommentController::class, 'store']);
    Route::put('/comments/{comment}', [CommentController::class, 'update']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);

    Route::post('/posts/{post}/reactions', [ReactionController::class, 'reactToPost']);
    Route::delete('/posts/{post}/reactions', [ReactionController::class, 'unreactToPost']);
    Route::post('/comments/{comment}/reactions', [ReactionController::class, 'reactToComment']);
    Route::delete('/comments/{comment}/reactions', [ReactionController::class, 'unreactToComment']);

    Route::get('/reports/mine', [ReportController::class, 'indexMine']);
    Route::post('/reports', [ReportController::class, 'store']);

    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::get('/announcements/featured', [AnnouncementController::class, 'featured']);
    Route::get('/announcements/{announcement}', [AnnouncementController::class, 'show']);

    Route::get('/institutions', [ReferenceController::class, 'institutions']);
    Route::get('/scholarships', [ReferenceController::class, 'scholarships']);
    Route::get('/batches', [ReferenceController::class, 'batches']);
    Route::get('/companies', [ReferenceController::class, 'companies']);

    Route::get('/events', [EventController::class, 'index']);
    Route::get('/events/registrations/mine', [EventController::class, 'myRegistrations']);
    Route::get('/events/{event}', [EventController::class, 'show']);
    Route::post('/events', [EventController::class, 'store']);
    Route::put('/events/{event}', [EventController::class, 'update']);
    Route::delete('/events/{event}', [EventController::class, 'destroy']);
    Route::post('/events/{event}/register', [EventController::class, 'register']);
    Route::delete('/events/{event}/register', [EventController::class, 'cancelRegistration']);

    // Mentorship routes
    Route::get('/mentorship-requests', [MentorshipController::class, 'index']);
    Route::post('/mentorship-requests', [MentorshipController::class, 'store']);
    Route::patch('/mentorship-requests/{mentorshipRequest}/respond', [MentorshipController::class, 'respond']);
    Route::get('/mentors', [MentorshipController::class, 'mentors']);

    // Success stories
    Route::get('/success-stories', [SuccessStoryController::class, 'index']);
    Route::post('/success-stories', [SuccessStoryController::class, 'store']);
    Route::put('/success-stories/{successStory}', [SuccessStoryController::class, 'update']);
    Route::delete('/success-stories/{successStory}', [SuccessStoryController::class, 'destroy']);

    // Resource Hub routes
    Route::get('/resource-categories', [ResourceController::class, 'categories']);
    Route::get('/resources', [ResourceController::class, 'index']);
    Route::post('/resources', [ResourceController::class, 'store']);
    Route::get('/resources/{resource}', [ResourceController::class, 'show']);
    Route::put('/resources/{resource}', [ResourceController::class, 'update']);
    Route::delete('/resources/{resource}', [ResourceController::class, 'destroy']);
    Route::post('/resources/{resource}/download', [ResourceController::class, 'download']);
    Route::post('/resources/{resource}/rate', [ResourceController::class, 'rate']);

    // Gamification routes
    Route::get('/leaderboard', [LeaderboardController::class, 'index']);
    Route::get('/badges', [BadgeController::class, 'index']);
    Route::get('/user/badges', [BadgeController::class, 'userBadges']);
    Route::get('/user/points', [BadgeController::class, 'userPoints']);

    // Live Stream routes
    Route::get('/live-streams', [LiveStreamController::class, 'index']);
    Route::post('/live-streams', [LiveStreamController::class, 'store']);
    Route::get('/live-streams/{liveStream}', [LiveStreamController::class, 'show']);
    Route::put('/live-streams/{liveStream}', [LiveStreamController::class, 'update']);
    Route::delete('/live-streams/{liveStream}', [LiveStreamController::class, 'destroy']);
    Route::post('/live-streams/{liveStream}/start', [LiveStreamController::class, 'startStream']);
    Route::post('/live-streams/{liveStream}/end', [LiveStreamController::class, 'endStream']);
    Route::get('/live-streams/{liveStream}/status', [LiveStreamController::class, 'status']);
    Route::get('/my/streams', [LiveStreamController::class, 'myStreams']);

    // Audio/Video Call routes (LiveKit)
    Route::get('/call-rooms', [CallRoomController::class, 'index']);
    Route::post('/call-rooms', [CallRoomController::class, 'store']);
    Route::get('/call-rooms/{callRoom}', [CallRoomController::class, 'show']);
    Route::delete('/call-rooms/{callRoom}', [CallRoomController::class, 'destroy']);
    Route::post('/call-rooms/{callRoom}/join', [CallRoomController::class, 'join']);
    Route::post('/call-rooms/{callRoom}/leave', [CallRoomController::class, 'leave']);
    Route::get('/my/call-rooms', [CallRoomController::class, 'myRooms']);

    // Admin routes
    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);
        Route::get('/dashboard/charts', [AdminDashboardController::class, 'charts']);

        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/metrics', [AdminUserController::class, 'metrics']);
        Route::get('/users/{user}', [AdminUserController::class, 'show']);
        Route::patch('/users/{user}/role', [AdminUserController::class, 'updateRole']);
        Route::post('/users/{user}/warn', [AdminUserController::class, 'warn']);
        Route::post('/users/{user}/suspend', [AdminUserController::class, 'suspend']);
        Route::post('/users/{user}/unsuspend', [AdminUserController::class, 'unsuspend']);

        Route::get('/reports', [ReportController::class, 'queue']);
        Route::patch('/reports/{report}/resolve', [ReportController::class, 'resolve']);

        Route::get('/audit-logs', [AdminAuditLogController::class, 'index']);
        Route::get('/audit-logs/{auditLog}', [AdminAuditLogController::class, 'show']);

        Route::get('/announcements', [AdminAnnouncementController::class, 'index']);
        Route::post('/announcements', [AdminAnnouncementController::class, 'store']);
        Route::get('/announcements/{announcement}', [AdminAnnouncementController::class, 'show']);
        Route::put('/announcements/{announcement}', [AdminAnnouncementController::class, 'update']);
        Route::delete('/announcements/{announcement}', [AdminAnnouncementController::class, 'destroy']);
        Route::post('/announcements/{announcement}/pin', [AdminAnnouncementController::class, 'togglePin']);
        Route::post('/announcements/{announcement}/publish', [AdminAnnouncementController::class, 'publish']);

        Route::apiResource('institutions', AdminInstitutionController::class);
        Route::apiResource('scholarships', AdminScholarshipController::class);
        Route::apiResource('batches', AdminBatchController::class);

        Route::get('/events/{event}/registrations', [EventController::class, 'registrations']);
        Route::post('/events/{event}/checkin', [EventController::class, 'checkIn']);
        Route::get('/events/{event}/attendance-report', [AdminAttendanceController::class, 'attendanceReport']);
        Route::get('/attendance/stats', [AdminAttendanceController::class, 'stats']);

        // Placements
        Route::get('/placements/stats', [AdminPlacementController::class, 'stats']);
        Route::post('/placements/bulk-import', [AdminPlacementController::class, 'bulkImport']);
        Route::apiResource('placements', AdminPlacementController::class);

        // Admin success stories
        Route::get('/success-stories', [AdminSuccessStoryController::class, 'index']);
        Route::patch('/success-stories/{successStory}/approve', [AdminSuccessStoryController::class, 'approve']);

        // Moderation
        Route::get('/moderation', [AdminModerationController::class, 'queue']);
        Route::get('/moderation/stats', [AdminModerationController::class, 'stats']);
        Route::get('/moderation/{id}', [AdminModerationController::class, 'show']);
        Route::post('/moderation/{id}/approve', [AdminModerationController::class, 'approve']);
        Route::post('/moderation/{id}/reject', [AdminModerationController::class, 'reject']);

        // AI Tagging
        Route::get('/ai/tag-suggestions', [AdminAIController::class, 'tagSuggestions']);
        Route::patch('/ai/resources/{resource}/approve-category', [AdminAIController::class, 'approveCategory']);

        // Analytics
        Route::get('/analytics/skill-gaps', [AdminAnalyticsController::class, 'skillGaps']);
    });
});
