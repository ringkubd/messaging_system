<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CompanyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Company::query()
            ->where('status', 'active')
            ->withCount('jobs')
            ->latest();

        if ($request->filled('industry')) {
            $query->where('industry', $request->input('industry'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(20));
    }

    public function show(Company $company): JsonResponse
    {
        if ($company->status !== 'active') {
            $user = request()->user();
            if (!$user || !$user->isAdmin()) {
                return response()->json(['message' => 'Not found.'], 404);
            }
        }

        $company->loadCount('jobs');

        return response()->json($company);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'website' => ['nullable', 'string', 'url', 'max:500'],
            'industry' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'logo' => ['nullable', 'string', 'max:500'],
            'status' => ['sometimes', 'string', 'in:active,inactive'],
        ]);

        $data['slug'] = Str::slug($data['name']) . '-' . Str::random(6);

        $company = Company::create($data);

        return response()->json($company, 201);
    }

    public function update(Request $request, Company $company): JsonResponse
    {
        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'website' => ['nullable', 'string', 'url', 'max:500'],
            'industry' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'logo' => ['nullable', 'string', 'max:500'],
            'status' => ['sometimes', 'string', 'in:active,inactive'],
        ]);

        if (isset($data['name']) && $data['name'] !== $company->name) {
            $data['slug'] = Str::slug($data['name']) . '-' . Str::random(6);
        }

        $company->update($data);

        return response()->json($company);
    }

    public function destroy(Request $request, Company $company): JsonResponse
    {
        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $company->delete();

        return response()->json(['message' => 'Company deleted.']);
    }
}
