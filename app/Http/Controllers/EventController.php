<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\User;
use App\Services\FileUploadService;
use App\Services\GamificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Event::query()
            ->with('creator:id,name')
            ->withCount([
                'registrations',
                'registrations as attended_count' => fn($q) => $q->where('status', 'attended'),
            ])
            ->latest('start_date');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('event_type', $request->input('type'));
        }

        if ($request->filled('status')) {
            if ($request->input('status') !== 'all') {
                $query->where('status', $request->input('status'));
            }
        } else {
            $query->where('status', 'published');
        }

        if ($request->filled('from')) {
            $query->where('start_date', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->where('end_date', '<=', $request->input('to'));
        }

        return response()->json($query->paginate(12));
    }

    public function show(Event $event): JsonResponse
    {
        $event->load('creator:id,name')
            ->loadCount([
                'registrations',
                'registrations as attended_count' => fn($q) => $q->where('status', 'attended'),
            ]);

        $user = request()->user();
        if ($user) {
            $registration = $event->registrations()->where('user_id', $user->id)->first();
            $event->user_registration = $registration;
        }

        return response()->json($event);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'event_type' => ['required', 'string', 'in:workshop,seminar,hackathon,career_fair,training,alumni_meetup,other'],
            'location' => ['nullable', 'string', 'max:255'],
            'online_url' => ['nullable', 'string', 'url', 'max:500'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'max_participants' => ['nullable', 'integer', 'min:0'],
            'status' => ['required', 'string', 'in:draft,published,cancelled,completed'],
            'image' => ['nullable', 'image', 'max:5120'],
        ]);

        $data['slug'] = Str::slug($data['title']) . '-' . Str::random(6);
        $data['created_by'] = $request->user()->id;

        if ($request->hasFile('image')) {
            $upload = FileUploadService::upload($request->file('image'), 'events');
            if ($upload) {
                $data['image'] = $upload['url'];
            }
        }

        $event = Event::create($data);
        $event->load('creator:id,name');

        return response()->json($event, 201);
    }

    public function update(Request $request, Event $event): JsonResponse
    {
        if ($event->created_by !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'required', 'string'],
            'event_type' => ['sometimes', 'required', 'string', 'in:workshop,seminar,hackathon,career_fair,training,alumni_meetup,other'],
            'location' => ['nullable', 'string', 'max:255'],
            'online_url' => ['nullable', 'string', 'url', 'max:500'],
            'start_date' => ['sometimes', 'required', 'date'],
            'end_date' => ['sometimes', 'required', 'date', 'after_or_equal:start_date'],
            'max_participants' => ['nullable', 'integer', 'min:0'],
            'status' => ['sometimes', 'required', 'string', 'in:draft,published,cancelled,completed'],
            'image' => ['nullable', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('image')) {
            $upload = FileUploadService::upload($request->file('image'), 'events');
            if ($upload) {
                $data['image'] = $upload['url'];
            }
        }

        if (isset($data['title']) && $data['title'] !== $event->title) {
            $data['slug'] = Str::slug($data['title']) . '-' . Str::random(6);
        }

        $event->update($data);
        $event->load('creator:id,name');

        return response()->json($event);
    }

    public function destroy(Request $request, Event $event): JsonResponse
    {
        if ($event->created_by !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $event->delete();

        return response()->json(['message' => 'Event deleted.']);
    }

    public function register(Request $request, Event $event): JsonResponse
    {
        if ($event->status !== 'published') {
            return response()->json(['message' => 'Event is not open for registration.'], 422);
        }

        if ($event->max_participants > 0) {
            $count = $event->registrations()->whereIn('status', ['registered', 'attended'])->count();
            if ($count >= $event->max_participants) {
                return response()->json(['message' => 'Event is full.'], 422);
            }
        }

        $existing = $event->registrations()->where('user_id', $request->user()->id)->first();
        if ($existing) {
            return response()->json(['message' => 'Already registered.', 'registration' => $existing], 422);
        }

        $registration = EventRegistration::create([
            'event_id' => $event->id,
            'user_id' => $request->user()->id,
            'status' => 'registered',
            'qr_code' => Str::uuid(),
        ]);

        $registration->load('user:id,name,email');

        return response()->json($registration, 201);
    }

    public function cancelRegistration(Request $request, Event $event): JsonResponse
    {
        $registration = $event->registrations()->where('user_id', $request->user()->id)->first();

        if (!$registration) {
            return response()->json(['message' => 'Not registered.'], 404);
        }

        $registration->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Registration cancelled.']);
    }

    public function myRegistrations(Request $request): JsonResponse
    {
        $registrations = EventRegistration::query()
            ->with(['event' => function ($query) {
                $query->withCount('registrations');
            }])
            ->where('user_id', $request->user()->id)
            ->where('status', '!=', 'cancelled')
            ->latest()
            ->paginate(20);

        return response()->json($registrations);
    }

    public function registrations(Request $request, Event $event): JsonResponse
    {
        $query = $event->registrations()
            ->with('user:id,name,email,round,batch')
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json($query->paginate(20));
    }

    public function checkIn(Request $request, Event $event): JsonResponse
    {
        $data = $request->validate([
            'qr_code' => ['required', 'string'],
        ]);

        $registration = $event->registrations()
            ->where('qr_code', $data['qr_code'])
            ->first();

        if (!$registration) {
            return response()->json(['message' => 'Invalid QR code.'], 404);
        }

        if ($registration->status === 'cancelled') {
            return response()->json(['message' => 'Registration is cancelled.'], 422);
        }

        if ($registration->status === 'attended') {
            return response()->json(['message' => 'Already checked in.'], 422);
        }

        $registration->update([
            'status' => 'attended',
            'checked_in_at' => now(),
        ]);

        $user = User::query()->find($registration->user_id);
        if ($user) {
            app(GamificationService::class)->awardPoints($user, 'event_attended');
        }

        $registration->load('user:id,name,email,round,batch');

        return response()->json($registration);
    }
}
