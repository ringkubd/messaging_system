<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->select(['id', 'name', 'email', 'role', 'round', 'batch', 'course', 'suspended_until', 'created_at']);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($round = $request->get('round')) {
            $query->where('round', $round);
        }

        if ($batch = $request->get('batch')) {
            $query->where('batch', $batch);
        }

        if ($course = $request->get('course')) {
            $query->where('course', $course);
        }

        if ($status = $request->get('status')) {
            match ($status) {
                'suspended' => $query->whereNotNull('suspended_until')->where('suspended_until', '>', now()),
                'active' => $query->where(function ($q) {
                    $q->whereNull('suspended_until')->orWhere('suspended_until', '<=', now());
                }),
                'admin' => $query->whereIn('role', [User::ROLE_SUPER_ADMIN, User::ROLE_MODERATOR]),
                default => null,
            };
        }

        if ($role = $request->get('role')) {
            $query->where('role', $role);
        }

        $users = $query->latest('id')->paginate($request->integer('per_page', 20));

        return response()->json($users);
    }

    public function show(User $user): JsonResponse
    {
        $user->loadCount(['posts', 'comments', 'reportsFiled', 'reportsReviewed']);

        return response()->json($user);
    }

    public function updateRole(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'role' => ['required', Rule::in(User::ROLES)],
        ]);

        $actor = $request->user();

        if ($actor->isModerator() && $request->role === User::ROLE_SUPER_ADMIN) {
            abort(403, 'Moderators cannot assign super_admin role.');
        }

        $oldRole = $user->role;
        $user->update(['role' => $request->role]);

        AuditLog::log(
            $actor,
            'user.role.updated',
            'user',
            $user->id,
            ['old_role' => $oldRole, 'new_role' => $request->role]
        );

        return response()->json($user->fresh());
    }

    public function warn(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        AuditLog::log(
            $request->user(),
            'user.warned',
            'user',
            $user->id,
            ['reason' => $request->reason]
        );

        return response()->json(['message' => 'User warned successfully.']);
    }

    public function suspend(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'reason' => ['required', 'string', 'max:500'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:8760'],
        ]);

        $suspendedUntil = now()->addHours((int) $request->duration_hours);
        $user->update(['suspended_until' => $suspendedUntil]);

        AuditLog::log(
            $request->user(),
            'user.suspended',
            'user',
            $user->id,
            [
                'reason' => $request->reason,
                'duration_hours' => $request->duration_hours,
                'suspended_until' => $suspendedUntil->toDateTimeString(),
            ]
        );

        return response()->json([
            'message' => 'User suspended successfully.',
            'suspended_until' => $suspendedUntil,
        ]);
    }

    public function unsuspend(Request $request, User $user): JsonResponse
    {
        $user->update(['suspended_until' => null]);

        AuditLog::log(
            $request->user(),
            'user.unsuspended',
            'user',
            $user->id,
            ['previous_suspended_until' => $user->getOriginal('suspended_until')?->toDateTimeString()]
        );

        return response()->json(['message' => 'User unsuspended successfully.']);
    }

    public function metrics(Request $request): JsonResponse
    {
        $activeToday = User::query()
            ->whereHas('sentMessages', fn ($q) => $q->where('created_at', '>=', now()->subDay()))
            ->orWhereHas('sentGroupMessages', fn ($q) => $q->where('created_at', '>=', now()->subDay()))
            ->count();

        $newThisWeek = User::query()
            ->where('created_at', '>=', now()->subWeek())
            ->count();

        $totalUsers = User::query()->count();

        $suspendedUsers = User::query()
            ->whereNotNull('suspended_until')
            ->where('suspended_until', '>', now())
            ->count();

        return response()->json([
            'active_today' => $activeToday,
            'new_this_week' => $newThisWeek,
            'total_users' => $totalUsers,
            'suspended_users' => $suspendedUsers,
        ]);
    }
}
