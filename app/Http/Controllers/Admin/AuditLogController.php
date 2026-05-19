<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::query()->with('user:id,name,email');

        if ($search = $request->get('search')) {
            $query->where('action', 'like', '%' . $search . '%');
        }

        if ($action = $request->get('action')) {
            $actions = array_map('trim', explode(',', $action));
            $query->whereIn('action', $actions);
        }

        if ($resourceType = $request->get('resource_type')) {
            $query->where('resource_type', $resourceType);
        }

        if ($userId = $request->get('user_id')) {
            $query->where('user_id', $userId);
        }

        if ($dateFrom = $request->get('date_from')) {
            $query->where('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $request->get('date_to')) {
            $query->where('created_at', '<=', $dateTo);
        }

        $sort = $request->get('sort', 'desc');
        $sort = in_array($sort, ['asc', 'desc']) ? $sort : 'desc';
        $query->orderBy('created_at', $sort);

        $logs = $query->paginate($request->integer('per_page', 30));

        return response()->json($logs);
    }

    public function show(AuditLog $auditLog): JsonResponse
    {
        $auditLog->load('user:id,name,email');

        return response()->json($auditLog);
    }
}
