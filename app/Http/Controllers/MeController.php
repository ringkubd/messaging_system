<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Message;
use App\Models\Post;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class MeController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $postsCount = Post::query()->where('user_id', $user->id)->count();
        $commentsCount = Comment::query()->where('user_id', $user->id)->count();
        $unreadNotifications = $user->unreadNotifications()->count();

        $unreadMessages = (int) DB::table('messages')
            ->join('conversation_user', function ($join) use ($user) {
                $join->on('messages.conversation_id', '=', 'conversation_user.conversation_id')
                    ->where('conversation_user.user_id', $user->id);
            })
            ->where('messages.sender_id', '!=', $user->id)
            ->where(function ($query) {
                $query->whereNull('conversation_user.last_read_message_id')
                    ->orWhereColumn('messages.id', '>', 'conversation_user.last_read_message_id');
            })
            ->count();

        $recentPosts = Post::query()
            ->where('user_id', $user->id)
            ->with(['community:id,name,slug'])
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(fn (Post $post) => [
                'id' => $post->id,
                'body' => Str::limit($post->body, 120),
                'created_at' => $post->created_at,
                'community' => $post->community,
                'comments_count' => $post->comments()->count(),
                'reactions_count' => $post->reactions()->count(),
            ]);

        $recentComments = Comment::query()
            ->where('user_id', $user->id)
            ->with(['post:id,body'])
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(fn (Comment $comment) => [
                'id' => $comment->id,
                'body' => Str::limit($comment->body, 120),
                'created_at' => $comment->created_at,
                'post' => [
                    'id' => $comment->post?->id,
                    'body' => Str::limit($comment->post?->body ?? '', 60),
                ],
            ]);

        return response()->json([
            'posts_count' => $postsCount,
            'comments_count' => $commentsCount,
            'unread_messages_count' => $unreadMessages,
            'unread_notifications_count' => $unreadNotifications,
            'recent_posts' => $recentPosts,
            'recent_comments' => $recentComments,
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'bio' => 'nullable|string|max:1000',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'round' => 'nullable|string|max:50',
            'batch' => 'nullable|string|max:50',
            'course' => 'nullable|string|max:255',
            'avatar' => 'nullable|image|mimes:jpg,jpeg,png,gif,webp|max:2048',
        ]);

        if ($request->hasFile('avatar')) {
            $uploaded = FileUploadService::upload($request->file('avatar'), 'avatars');
            if ($uploaded && $user->avatar) {
                $oldPath = str_replace(Storage::url(''), '', $user->avatar);
                Storage::disk('public')->delete($oldPath);
            }
            if ($uploaded) {
                $validated['avatar'] = $uploaded['url'];
            }
        }

        $user->update($validated);

        return response()->json($user->fresh());
    }

    public function unreadNotificationsCount(Request $request): JsonResponse
    {
        return response()->json([
            'count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function resume(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->profile;

        $education = [];
        if ($user->round || $user->batch || $user->course) {
            $education[] = [
                'institution' => 'IsDB-BISEW IT Scholarship Programme',
                'round' => $user->round,
                'batch' => $user->batch,
                'course' => $user->course,
            ];
        }

        return response()->json([
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'address' => $user->address,
            'bio' => $user->bio,
            'avatar' => $user->avatar,
            'round' => $user->round,
            'batch' => $user->batch,
            'course' => $user->course,
            'linkedin_url' => $profile->linkedin_url,
            'github_url' => $profile->github_url,
            'portfolio_url' => $profile->portfolio_url,
            'skills' => $profile->skills ?? [],
            'experience' => $profile->experience ?? [],
            'certifications' => $profile->certifications ?? [],
            'projects' => $profile->projects ?? [],
            'education' => $education,
        ]);
    }
}
