<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receive_token(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Student One',
            'email' => 'student1@example.com',
            'password' => 'password123',
            'round' => '63',
            'batch' => 'A',
            'course' => 'Web Development',
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'round', 'batch', 'course']]);
    }

    public function test_user_can_login_and_access_me_endpoint(): void
    {
        $user = User::factory()->create([
            'email' => 'student2@example.com',
            'password' => 'password123',
        ]);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $token = $loginResponse->assertOk()->json('token');

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('email', 'student2@example.com');
    }
}
