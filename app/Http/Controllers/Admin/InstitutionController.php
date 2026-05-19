<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Institution;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InstitutionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Institution::query();

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $institutions = $query->latest('id')->paginate($request->integer('per_page', 20));

        return response()->json($institutions);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('institutions')],
            'address' => ['nullable', 'string', 'max:1000'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $institution = Institution::create($validated);

        return response()->json($institution, 201);
    }

    public function show(Institution $institution): JsonResponse
    {
        return response()->json($institution);
    }

    public function update(Request $request, Institution $institution): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('institutions')->ignore($institution->id)],
            'address' => ['nullable', 'string', 'max:1000'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $institution->update($validated);

        return response()->json($institution);
    }

    public function destroy(Institution $institution): JsonResponse
    {
        $institution->delete();

        return response()->json(['message' => 'Institution deleted successfully.']);
    }
}
