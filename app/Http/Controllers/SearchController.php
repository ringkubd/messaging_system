<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Post;
use App\Models\Community;
use App\Models\Job;
use App\Models\Resource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        $type = $request->query('type', 'all');
        $page = max(1, (int) $request->query('page', 1));
        $perPage = 20;
        $limitPerType = 10;

        if ($q === '') {
            return response()->json([
                'results' => [],
                'total' => 0,
                'per_page' => $perPage,
                'current_page' => 1,
                'types' => new \stdClass,
            ]);
        }

        $results = [];
        $typeCounts = [];

        if ($type === 'all' || $type === 'users') {
            $data = $this->searchUsers($q, $limitPerType);
            $typeCounts['users'] = count($data);
            $results = array_merge($results, $data);
        }

        if ($type === 'all' || $type === 'posts') {
            $data = $this->searchPosts($q, $limitPerType);
            $typeCounts['posts'] = count($data);
            $results = array_merge($results, $data);
        }

        if ($type === 'all' || $type === 'groups') {
            $data = $this->searchCommunities($q, $limitPerType);
            $typeCounts['groups'] = count($data);
            $results = array_merge($results, $data);
        }

        if ($type === 'all' || $type === 'jobs') {
            $data = $this->searchJobs($q, $limitPerType);
            $typeCounts['jobs'] = count($data);
            $results = array_merge($results, $data);
        }

        if ($type === 'all' || $type === 'resources') {
            $data = $this->searchResources($q, $limitPerType);
            $typeCounts['resources'] = count($data);
            $results = array_merge($results, $data);
        }

        $total = count($results);
        $offset = ($page - 1) * $perPage;
        $paginatedResults = array_slice($results, $offset, $perPage);

        return response()->json([
            'results' => $paginatedResults,
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'types' => $typeCounts,
        ]);
    }

    private function searchUsers(string $q, int $limit): array
    {
        $users = User::query()
            ->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('bio', 'like', "%{$q}%");
            })
            ->orWhereHas('userProfile', function ($query) use ($q) {
                $query->where('skills', 'like', "%{$q}%");
            })
            ->limit($limit)
            ->get(['id', 'name', 'email', 'round', 'batch', 'bio', 'avatar', 'role']);

        return $users->map(function ($user) {
            $snippet = '';
            if ($user->bio) {
                $snippet = strlen($user->bio) > 150 ? substr($user->bio, 0, 150) . '...' : $user->bio;
            } else {
                $snippet = $user->email;
            }
            $subtitle = '';
            if ($user->round && $user->batch) {
                $subtitle = "Round {$user->round}, Batch {$user->batch}";
            } elseif ($user->round) {
                $subtitle = "Round {$user->round}";
            } elseif ($user->batch) {
                $subtitle = "Batch {$user->batch}";
            }
            return [
                'type' => 'user',
                'id' => $user->id,
                'title' => $user->name,
                'subtitle' => $subtitle,
                'image' => $user->avatar,
                'url' => '/profile',
                'snippet' => $snippet,
                'created_at' => null,
            ];
        })->toArray();
    }

    private function searchPosts(string $q, int $limit): array
    {
        $posts = Post::query()
            ->with('author:id,name')
            ->where(function ($query) use ($q) {
                $query->where('body', 'like', "%{$q}%")
                    ->orWhere('tags', 'like', "%{$q}%");
            })
            ->limit($limit)
            ->latest()
            ->get(['id', 'user_id', 'body', 'tags', 'created_at']);

        return $posts->map(function ($post) {
            $snippet = strlen($post->body) > 150 ? substr($post->body, 0, 150) . '...' : $post->body;
            return [
                'type' => 'post',
                'id' => $post->id,
                'title' => $post->author ? 'Post by ' . $post->author->name : 'Post',
                'subtitle' => $post->created_at ? $post->created_at->diffForHumans() : '',
                'image' => null,
                'url' => '/feed',
                'snippet' => $snippet,
                'tags' => $post->tags,
                'created_at' => $post->created_at ? $post->created_at->toISOString() : null,
            ];
        })->toArray();
    }

    private function searchCommunities(string $q, int $limit): array
    {
        $communities = Community::query()
            ->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%")
                    ->orWhere('tags', 'like', "%{$q}%");
            })
            ->limit($limit)
            ->latest('id')
            ->get(['id', 'name', 'slug', 'description', 'tags']);

        return $communities->map(function ($community) {
            $description = $community->description ?? '';
            $subtitle = strlen($description) > 80 ? substr($description, 0, 80) . '...' : $description;
            $snippet = strlen($description) > 150 ? substr($description, 0, 150) . '...' : $description;
            return [
                'type' => 'group',
                'id' => $community->id,
                'title' => $community->name,
                'subtitle' => $subtitle,
                'image' => null,
                'url' => '/communities/' . $community->id,
                'snippet' => $snippet,
                'created_at' => null,
            ];
        })->toArray();
    }

    private function searchJobs(string $q, int $limit): array
    {
        $jobs = Job::query()
            ->with('company:id,name')
            ->where(function ($query) use ($q) {
                $query->where('title', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%")
                    ->orWhere('skills_required', 'like', "%{$q}%");
            })
            ->orWhereHas('company', function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%");
            })
            ->limit($limit)
            ->latest()
            ->get(['id', 'title', 'description', 'skills_required', 'company_id', 'created_at']);

        return $jobs->map(function ($job) {
            $description = $job->description ?? '';
            $snippet = strlen($description) > 150 ? substr($description, 0, 150) . '...' : $description;
            return [
                'type' => 'job',
                'id' => $job->id,
                'title' => $job->title,
                'subtitle' => $job->company ? $job->company->name : '',
                'image' => null,
                'url' => '/jobs/' . $job->id,
                'snippet' => $snippet,
                'created_at' => $job->created_at ? $job->created_at->toISOString() : null,
            ];
        })->toArray();
    }

    private function searchResources(string $q, int $limit): array
    {
        $resources = Resource::query()
            ->published()
            ->where(function ($query) use ($q) {
                $query->where('title', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%")
                    ->orWhere('tags', 'like', "%{$q}%");
            })
            ->limit($limit)
            ->latest()
            ->get(['id', 'title', 'description', 'type', 'tags', 'created_at']);

        return $resources->map(function ($resource) {
            $description = $resource->description ?? '';
            $snippet = strlen($description) > 150 ? substr($description, 0, 150) . '...' : $description;
            return [
                'type' => 'resource',
                'id' => $resource->id,
                'title' => $resource->title,
                'subtitle' => $resource->type ? ucfirst(str_replace('_', ' ', $resource->type)) : 'Resource',
                'image' => null,
                'url' => '/resources/' . $resource->id,
                'snippet' => $snippet,
                'created_at' => $resource->created_at ? $resource->created_at->toISOString() : null,
            ];
        })->toArray();
    }
}
