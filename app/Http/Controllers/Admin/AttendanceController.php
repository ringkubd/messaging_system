<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function attendanceReport(Request $request, Event $event): JsonResponse
    {
        $query = $event->registrations()->with('user:id,name,email,round,batch');

        if ($request->filled('batch')) {
            $query->whereHas('user', fn($q) => $q->where('batch', $request->input('batch')));
        }

        if ($request->filled('round')) {
            $query->whereHas('user', fn($q) => $q->where('round', $request->input('round')));
        }

        $registrations = $query->latest()->get();

        $totalRegistered = $registrations->count();
        $totalAttended = $registrations->where('status', 'attended')->count();
        $attendanceRate = $totalRegistered > 0 ? round(($totalAttended / $totalRegistered) * 100, 2) : 0;

        return response()->json([
            'total_registered' => $totalRegistered,
            'total_attended' => $totalAttended,
            'attendance_rate' => $attendanceRate,
            'attendees' => $registrations->map(fn($r) => [
                'id' => $r->id,
                'user' => $r->user,
                'status' => $r->status,
                'checked_in_at' => $r->checked_in_at,
                'qr_code' => $r->qr_code,
            ]),
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $totalEvents = Event::query()->count();
        $totalRegistrations = EventRegistration::query()->count();
        $totalAttendance = EventRegistration::query()->where('status', 'attended')->count();
        $overallRate = $totalRegistrations > 0 ? round(($totalAttendance / $totalRegistrations) * 100, 2) : 0;

        $topEvents = Event::query()
            ->withCount(['registrations as attended_count' => fn($q) => $q->where('status', 'attended')])
            ->orderByDesc('attended_count')
            ->take(5)
            ->get(['id', 'title', 'start_date']);

        $byBatch = EventRegistration::query()
            ->where('status', 'attended')
            ->join('users', 'event_registrations.user_id', '=', 'users.id')
            ->selectRaw('users.batch, COUNT(*) as total')
            ->whereNotNull('users.batch')
            ->groupBy('users.batch')
            ->orderByDesc('total')
            ->get();

        return response()->json([
            'total_events' => $totalEvents,
            'total_registrations' => $totalRegistrations,
            'total_attendance' => $totalAttendance,
            'attendance_rate' => $overallRate,
            'top_events' => $topEvents,
            'by_batch' => $byBatch,
        ]);
    }
}
