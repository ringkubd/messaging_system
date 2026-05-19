<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Scholarship;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ScholarshipController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Scholarship::query();

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $scholarships = $query->latest('id')->paginate($request->integer('per_page', 20));

        return response()->json($scholarships);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('scholarships')],
            'description' => ['nullable', 'string', 'max:5000'],
            'type' => ['required', Rule::in(['technical', 'professional', 'academic'])],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['required', Rule::in(['active', 'completed', 'upcoming'])],
        ]);

        $scholarship = Scholarship::create($validated);

        return response()->json($scholarship, 201);
    }

    public function show(Scholarship $scholarship): JsonResponse
    {
        return response()->json($scholarship);
    }

    public function update(Request $request, Scholarship $scholarship): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('scholarships')->ignore($scholarship->id)],
            'description' => ['nullable', 'string', 'max:5000'],
            'type' => ['required', Rule::in(['technical', 'professional', 'academic'])],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['required', Rule::in(['active', 'completed', 'upcoming'])],
        ]);

        $scholarship->update($validated);

        return response()->json($scholarship);
    }

    public function destroy(Scholarship $scholarship): JsonResponse
    {
        $scholarship->delete();

        return response()->json(['message' => 'Scholarship deleted successfully.']);
    }
}
