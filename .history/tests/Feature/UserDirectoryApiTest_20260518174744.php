<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserDirectoryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_directory_returns_students_and_supports_search(): void
    {
        $currentUser = User::factory()->create([
            'name' => 'Current User',
            'course' => 'Web Development',
        ]);

        User::factory()->create([
            'name' => 'Anik Rahman',
            'email' => 'anik@example.com',
            'round' => '62',
            'batch' => 'B',
            'course' => 'Web Development',
        ]);

        User::factory()->create([
            'name' => 'Mitu Akter',
            'email' => 'mitu@example.com',
            'round' => '61',
            'batch' => 'A',
            'course' => 'Graphic Design',
        ]);

        Sanctum::actingAs($currentUser);

        $allResponse = $this->getJson('/api/v1/users');
        $allResponse->assertOk()->assertJsonCount(2, 'data');

        $searchResponse = $this->getJson('/api/v1/users?search=Web Development');
        $searchResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['name' => 'Anik Rahman']);
    }
}
