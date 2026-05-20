<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::first();
        if (!$admin) return;

        $events = [
            [
                'title' => 'Web Development Bootcamp 2026',
                'description' => 'An intensive 3-day bootcamp covering modern web development with React, Laravel, and TailwindCSS. Suitable for beginners and intermediate developers.',
                'event_type' => 'workshop',
                'location' => 'ISDB-BISEW Training Center, Dhaka',
                'online_url' => 'https://meet.google.com/abc-defg-hij',
                'start_date' => now()->addDays(7)->setHour(9)->setMinute(0),
                'end_date' => now()->addDays(9)->setHour(17)->setMinute(0),
                'max_participants' => 50,
                'status' => 'published',
            ],
            [
                'title' => 'Career Fair 2026 — Connect with Top Employers',
                'description' => 'Meet with leading IT companies and recruiters. Bring your CV and portfolio. On-the-spot interviews for selected candidates.',
                'event_type' => 'career_fair',
                'location' => 'International Convention Center, Dhaka',
                'start_date' => now()->addDays(14)->setHour(10)->setMinute(0),
                'end_date' => now()->addDays(14)->setHour(17)->setMinute(0),
                'max_participants' => 200,
                'status' => 'published',
            ],
            [
                'title' => 'AI & Machine Learning Seminar',
                'description' => 'Guest lecture on the latest advances in AI and machine learning, featuring industry experts from leading tech companies.',
                'event_type' => 'seminar',
                'online_url' => 'https://zoom.us/j/123456789',
                'start_date' => now()->addDays(21)->setHour(15)->setMinute(0),
                'end_date' => now()->addDays(21)->setHour(17)->setMinute(0),
                'max_participants' => 100,
                'status' => 'published',
            ],
            [
                'title' => 'Alumni Networking Night',
                'description' => 'An evening of networking with ISDB-BISEW alumni working in various industries. Share experiences, find mentors, and build your professional network.',
                'event_type' => 'alumni_meetup',
                'location' => 'Pan Pacific Sonargaon, Dhaka',
                'start_date' => now()->addDays(30)->setHour(18)->setMinute(0),
                'end_date' => now()->addDays(30)->setHour(21)->setMinute(0),
                'max_participants' => 80,
                'status' => 'published',
            ],
            [
                'title' => 'Hackathon: Build for Bangladesh',
                'description' => 'A 48-hour hackathon to build solutions for real-world problems in Bangladesh. Teams of 3-5. Prizes for top 3 teams. Food and accommodation provided.',
                'event_type' => 'hackathon',
                'location' => 'ISDB-BISEW Innovation Lab, Dhaka',
                'start_date' => now()->addDays(45)->setHour(9)->setMinute(0),
                'end_date' => now()->addDays(47)->setHour(17)->setMinute(0),
                'max_participants' => 120,
                'status' => 'published',
            ],
            [
                'title' => 'Professional CV Writing Workshop',
                'description' => 'Learn how to write a professional CV that stands out to recruiters. Bring your current CV for personalized feedback.',
                'event_type' => 'training',
                'location' => 'ISDB-BISEW Training Center, Dhaka',
                'online_url' => 'https://meet.google.com/xyz-uvw-rst',
                'start_date' => now()->addDays(3)->setHour(10)->setMinute(0),
                'end_date' => now()->addDays(3)->setHour(13)->setMinute(0),
                'max_participants' => 30,
                'status' => 'published',
            ],
            [
                'title' => 'Mobile App Development with React Native',
                'description' => 'Hands-on training on building cross-platform mobile apps using React Native. Covers navigation, state management, and API integration.',
                'event_type' => 'workshop',
                'online_url' => 'https://zoom.us/j/987654321',
                'start_date' => now()->addDays(10)->setHour(14)->setMinute(0),
                'end_date' => now()->addDays(12)->setHour(17)->setMinute(0),
                'max_participants' => 40,
                'status' => 'published',
            ],
            [
                'title' => 'Past Event: Scholarship Orientation 2026',
                'description' => 'Orientation program for new ISDB-BISEW scholarship recipients. Important information about scholarship terms, expectations, and resources.',
                'event_type' => 'seminar',
                'location' => 'ISDB-BISEW Auditorium, Dhaka',
                'start_date' => now()->subDays(30)->setHour(10)->setMinute(0),
                'end_date' => now()->subDays(30)->setHour(16)->setMinute(0),
                'max_participants' => 300,
                'status' => 'completed',
            ],
        ];

        foreach ($events as $eventData) {
            $eventData['created_by'] = $admin->id;
            Event::create($eventData);
        }

        $this->command->info('Created ' . count($events) . ' demo events.');
    }
}
