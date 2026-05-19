<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BatchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Batch::query()->with(['scholarship:id,name,code', 'institution:id,name,code']);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($scholarshipId = $request->get('scholarship_id')) {
            $query->where('scholarship_id', $scholarshipId);
        }

        if ($institutionId = $request->get('institution_id')) {
            $query->where('institution_id', $institutionId);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $batches = $query->latest('id')->paginate($request->integer('per_page', 20));

        return response()->json($batches);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('batches')],
            'scholarship_id' => ['required', 'exists:scholarships,id'],
            'institution_id' => ['nullable', 'exists:institutions,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['required', Rule::in(['active', 'completed', 'upcoming'])],
        ]);

        $batch = Batch::create($validated);

        $batch->load(['scholarship:id,name,code', 'institution:id,name,code']);

        return response()->json($batch, 201);
    }

    public function show(Batch $batch): JsonResponse
    {
        $batch->load(['scholarship:id,name,code', 'institution:id,name,code']);

        return response()->json($batch);
    }

    public function update(Request $request, Batch $batch): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('batches')->ignore($batch->id)],
            'scholarship_id' => ['required', 'exists:scholarships,id'],
            'institution_id' => ['nullable', 'exists:institutions,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['required', Rule::in(['active', 'completed', 'upcoming'])],
        ]);

        $batch->update($validated);

        $batch->load(['scholarship:id,name,code', 'institution:id,name,code']);

        return response()->json($batch);
    }

    public function destroy(Batch $batch): JsonResponse
    {
        $batch->delete();

        return response()->json(['message' => 'Batch deleted successfully.']);
    }
}
