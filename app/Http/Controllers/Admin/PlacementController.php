<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Placement;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlacementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Placement::query()
            ->with([
                'user:id,name,email,round,batch,course',
                'company:id,name',
                'creator:id,name',
            ]);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('company', fn ($cq) => $cq->where('name', 'like', "%{$search}%"))
                  ->orWhere('position', 'like', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($batch = $request->get('batch')) {
            $query->whereHas('user', fn ($uq) => $uq->where('batch', $batch));
        }

        if ($round = $request->get('round')) {
            $query->whereHas('user', fn ($uq) => $uq->where('round', $round));
        }

        if ($course = $request->get('course')) {
            $query->whereHas('user', fn ($uq) => $uq->where('course', $course));
        }

        if ($companyId = $request->get('company_id')) {
            $query->where('company_id', $companyId);
        }

        if ($dateFrom = $request->get('date_from')) {
            $query->where('offer_date', '>=', $dateFrom);
        }

        if ($dateTo = $request->get('date_to')) {
            $query->where('offer_date', '<=', $dateTo);
        }

        $placements = $query->latest('id')->paginate($request->integer('per_page', 20));

        return response()->json($placements);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'company_id' => ['required', 'exists:companies,id'],
            'position' => ['required', 'string', 'max:255'],
            'offer_date' => ['required', 'date'],
            'joining_date' => ['nullable', 'date', 'after_or_equal:offer_date'],
            'salary' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['placed', 'offer_received', 'interviewing', 'not_placed'])],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $validated['created_by'] = $request->user()->id;

        $placement = Placement::create($validated);

        $placement->load([
            'user:id,name,email,round,batch,course',
            'company:id,name',
            'creator:id,name',
        ]);

        return response()->json($placement, 201);
    }

    public function show(Placement $placement): JsonResponse
    {
        $placement->load([
            'user:id,name,email,round,batch,course',
            'company:id,name',
            'creator:id,name',
        ]);

        return response()->json($placement);
    }

    public function update(Request $request, Placement $placement): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['sometimes', 'required', 'exists:users,id'],
            'company_id' => ['sometimes', 'required', 'exists:companies,id'],
            'position' => ['sometimes', 'required', 'string', 'max:255'],
            'offer_date' => ['sometimes', 'required', 'date'],
            'joining_date' => ['nullable', 'date', 'after_or_equal:offer_date'],
            'salary' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'required', Rule::in(['placed', 'offer_received', 'interviewing', 'not_placed'])],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $placement->update($validated);

        $placement->load([
            'user:id,name,email,round,batch,course',
            'company:id,name',
            'creator:id,name',
        ]);

        return response()->json($placement);
    }

    public function destroy(Placement $placement): JsonResponse
    {
        $placement->delete();

        return response()->json(['message' => 'Placement deleted successfully.']);
    }

    public function stats(Request $request): JsonResponse
    {
        $totalPlaced = Placement::query()->where('status', 'placed')->count();
        $totalOfferReceived = Placement::query()->where('status', 'offer_received')->count();
        $totalInterviewing = Placement::query()->where('status', 'interviewing')->count();
        $totalNotPlaced = Placement::query()->where('status', 'not_placed')->count();
        $totalPlacements = Placement::query()->count();
        $totalStudents = User::query()->whereNotNull('batch')->count();

        $placementRate = $totalStudents > 0
            ? round(($totalPlaced / $totalStudents) * 100, 1)
            : 0;

        $byBatch = Placement::query()
            ->selectRaw("COALESCE(users.round, '') as round_label, COALESCE(users.batch, '') as batch_label, count(*) as total, sum(case when placements.status = 'placed' then 1 else 0 end) as placed_count")
            ->join('users', 'users.id', '=', 'placements.user_id')
            ->whereNotNull('users.batch')
            ->groupBy('users.round', 'users.batch')
            ->orderBy('users.round')
            ->orderBy('users.batch')
            ->get();

        $byCompany = Placement::query()
            ->selectRaw('company_id, companies.name as company_name, count(*) as total, sum(case when status = \'placed\' then 1 else 0 end) as placed_count')
            ->join('companies', 'companies.id', '=', 'placements.company_id')
            ->groupBy('company_id', 'companies.name')
            ->orderByDesc('total')
            ->get();

        $byCourse = Placement::query()
            ->selectRaw("COALESCE(users.course, 'Unknown') as course, count(*) as total, sum(case when placements.status = 'placed' then 1 else 0 end) as placed_count")
            ->join('users', 'users.id', '=', 'placements.user_id')
            ->groupBy('users.course')
            ->orderByDesc('total')
            ->get();

        return response()->json([
            'total_placed' => $totalPlaced,
            'total_offer_received' => $totalOfferReceived,
            'total_interviewing' => $totalInterviewing,
            'total_not_placed' => $totalNotPlaced,
            'total_placements' => $totalPlacements,
            'total_students' => $totalStudents,
            'placement_rate' => $placementRate,
            'by_batch' => $byBatch,
            'by_company' => $byCompany,
            'by_course' => $byCourse,
        ]);
    }

    public function bulkImport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'placements' => ['required', 'array', 'min:1'],
            'placements.*.user_id' => ['required', 'exists:users,id'],
            'placements.*.company_id' => ['required', 'exists:companies,id'],
            'placements.*.position' => ['required', 'string', 'max:255'],
            'placements.*.offer_date' => ['required', 'date'],
            'placements.*.joining_date' => ['nullable', 'date'],
            'placements.*.salary' => ['nullable', 'string', 'max:255'],
            'placements.*.status' => ['required', Rule::in(['placed', 'offer_received', 'interviewing', 'not_placed'])],
            'placements.*.notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $userId = $request->user()->id;

        $created = collect($validated['placements'])->map(function ($item) use ($userId) {
            $item['created_by'] = $userId;
            return Placement::create($item);
        });

        $created->load([
            'user:id,name,email,round,batch,course',
            'company:id,name',
            'creator:id,name',
        ]);

        return response()->json([
            'message' => count($created) . ' placements imported successfully.',
            'data' => $created,
        ], 201);
    }
}
