<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\Company;
use App\Models\Institution;
use App\Models\Scholarship;
use Illuminate\Http\JsonResponse;

class ReferenceController extends Controller
{
    public function institutions(): JsonResponse
    {
        $institutions = Institution::where('status', 'active')
            ->select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        return response()->json($institutions);
    }

    public function scholarships(): JsonResponse
    {
        $scholarships = Scholarship::where('status', 'active')
            ->select('id', 'name', 'code', 'type')
            ->orderBy('name')
            ->get();

        return response()->json($scholarships);
    }

    public function batches(): JsonResponse
    {
        $batches = Batch::where('status', 'active')
            ->with(['scholarship:id,name,code'])
            ->select('id', 'name', 'code', 'scholarship_id')
            ->orderBy('name')
            ->get();

        return response()->json($batches);
    }

    public function companies(): JsonResponse
    {
        $companies = Company::where('status', 'active')
            ->select('id', 'name', 'industry')
            ->orderBy('name')
            ->get();

        return response()->json($companies);
    }
}
