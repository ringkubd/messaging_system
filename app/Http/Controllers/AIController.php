<?php

namespace App\Http\Controllers;

use App\Services\OllamaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIController extends Controller
{
    public function generateTags(Request $request, OllamaService $ollama): JsonResponse
    {
        $data = $request->validate([
            'text' => ['required', 'string', 'min:10', 'max:5000'],
        ]);

        $tags = $ollama->extractTags(strip_tags($data['text']));

        return response()->json(['tags' => $tags]);
    }
}
