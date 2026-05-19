<div align="center">
  <h1>IsDB-BISEW Connect</h1>
  <p><strong>A centralized digital ecosystem for ISDB-BISEW scholarship students, alumni, mentors, and administrators.</strong></p>
  <p>Social networking + academic collaboration + career development + scholarship management + AI-powered community engagement.</p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/PHP-8.1+-777BB4?logo=php" alt="PHP">
  <img src="https://img.shields.io/badge/Laravel-10-red?logo=laravel" alt="Laravel">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/MySQL-8-blue?logo=mysql" alt="MySQL">
  <img src="https://img.shields.io/badge/WebSocket-Pusher-important" alt="WebSocket">
  <img src="https://img.shields.io/badge/AI-Ollama-512BD4" alt="Ollama">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

---

## Overview

IsDB-BISEW Connect is a private educational social networking and community management platform that combines:

| Feature Area | Description |
|-------------|-------------|
| **Social Network** | Facebook-style feed, real-time chat, groups, friend system, reactions, comments |
| **Career Portal** | Job listings, applications, resume builder, placement tracking, skill matching |
| **Learning Hub** | Resource library (PDFs, videos, e-books), categorization, ratings, downloads |
| **Events & Attendance** | Event management, QR code registration, check-in, attendance reports |
| **Scholarship Management** | Scholarship programs, batch tracking, institution management, student eligibility |
| **AI-Powered** | Content moderation, smart feed ranking, chatbot assistant, resume analysis, auto-tagging |
| **Alumni Network** | Mentorship requests, success stories, alumni directory, professional networking |
| **Gamification** | Badges, points, leaderboards, achievement levels |
| **Live Streaming & Calls** | RTMP+HLS streaming, WebRTC audio/video calls via LiveKit |

---

## Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **Laravel 10** | API framework, Eloquent ORM, Queues, Broadcasting |
| **PHP 8.1+** | Server-side language |
| **MySQL 8** | Primary database |
| **Redis** | Cache, queue driver, real-time presence |
| **Pusher / Soketi** | WebSocket broadcasting |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | SPA frontend |
| **React Router v7** | Client-side routing |
| **Axios** | HTTP client |
| **TailwindCSS** | Utility-first CSS |
| **HLS.js** | HLS video playback |
| **LiveKit JS SDK** | WebRTC video/audio calls |

### AI Layer
| Technology | Purpose |
|-----------|---------|
| **Ollama** | Local LLM inference (content moderation, chatbot, resume analysis, tagging) |
| **llama3.2 / qwen2.5** | Models for moderation, tagging, chatbot, resume analysis |

### Media Server (Separate)
| Technology | Purpose |
|-----------|---------|
| **LiveKit** | WebRTC SFU for audio/video calls |
| **SRS Media Server** | RTMP ingest + HLS transcoding for live streaming |
| **Coturn** | TURN/STUN for NAT traversal |

---

## Architecture

```
                   ┌─────────────────────────────────────┐
                   │         Cloudflare CDN               │
                   └──────────┬──────────────────────────┘
                              │
                   ┌──────────▼──────────────────────────┐
                   │      Ubuntu + HestiaCP Server        │
                   │                                      │
                   │  ┌────────────────────────────────┐  │
                   │  │         Nginx (HestiaCP)        │  │
                   │  │  app.domain  │  api.domain      │  │
                   │  └──────┬─────────────────────────┘  │
                   │         │                            │
                   │  ┌──────▼─────────┐  ┌────────────┐  │
                   │  │  Laravel API   │  │  React SPA │  │
                   │  │  :8000         │  │  :3000     │  │
                   │  └──────┬─────────┘  └────────────┘  │
                   │         │                             │
                   │  ┌──────▼─────────┐                  │
                   │  │    MySQL 8     │                  │
                   │  └────────────────┘                  │
                   └──────────────────────────────────────┘

              Media Server (Optional, Separate VPS)
                   ┌──────────────────────────────────────┐
                   │  LiveKit :7880  │  SRS :1935         │
                   │  Coturn  :3478  │  Redis :6379       │
                   └──────────────────────────────────────┘
```

---

## Features

### Phase 1 — Foundation
- [x] Profile editing with avatar upload
- [x] Extended profiles (LinkedIn, GitHub, skills, experience, certifications)
- [x] Post & comment edit/delete with inline editing
- [x] Group chat UI with create, members, real-time messaging
- [x] Password reset flow (forgot/reset)
- [x] Email verification (MustVerifyEmail)
- [x] Email notifications with per-type preferences
- [x] Dark mode with system preference detection

### Phase 2 — Management
- [x] Events module with QR code registration and check-in
- [x] Announcements & CMS with pin/publish workflow
- [x] Scholarship management (institutions, batches, programs)
- [x] Attendance tracking with reports
- [x] Admin dashboard with charts, stats, activity feed
- [x] Audit log with search, filter, date range, detail modal

### Phase 3 — Career & Learning
- [x] Resource hub with categories, upload, rating, download tracking
- [x] Job & career portal (jobs, internships, applications, companies)
- [x] Resume builder with print and data from profile
- [x] Placement tracking with stats, bulk import, skill-gap analysis
- [x] Alumni networking (mentorship requests, success stories)
- [x] Global search across users, posts, jobs, resources

### Phase 4 — AI Features
- [x] AI content moderation (toxicity/spam detection via Ollama)
- [x] Smart feed algorithm (engagement-based ranking, trending)
- [x] AI chatbot assistant (FAQ, RAG with conversation history)
- [x] Resume AI analysis (skill extraction, job matching)
- [x] Smart tagging & auto-categorization of posts and resources

### Phase 5 — Scale & Engagement
- [x] Gamification (10 badges, points system, weekly/monthly/all-time leaderboards)
- [x] Platform scaling (Redis caching, database indexes, image optimization)
- [ ] React Native mobile app
- [x] Live streaming (RTMP ingest + HLS playback)
- [x] Audio/Video calls (WebRTC via LiveKit SFU)

---

## Quick Start

### Prerequisites
- PHP 8.1+
- Composer
- Node.js 18+
- MySQL 8
- Redis (recommended)

### Installation

```bash
# Clone the repository
git clone git@github.com:ringkubd/messaging_system.git isdb-bisew-connect
cd isdb-bisew-connect

# Backend setup
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link

# Frontend setup
npm install
npm run dev

# Start the dev server
php artisan serve
```

### Environment Configuration

Key `.env` variables:

```env
APP_URL=https://yourdomain.com
DB_DATABASE=messaging_system
DB_USERNAME=root
DB_PASSWORD=

# Broadcasting (Pusher or Soketi)
BROADCAST_DRIVER=pusher
PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=

# Ollama AI
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b

# LiveKit (audio/video calls)
LIVEKIT_HOST=https://rtc.yourdomain.com
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

# Streaming (SRS/RTMP)
RTMP_SERVER=rtmp://stream.yourdomain.com
HLS_SERVER=https://stream.yourdomain.com/hls
```

### Media Server Installation

For live streaming and video/audio calls, deploy a separate media server:

```bash
# On your media server (fresh Ubuntu 22.04+)
sudo bash docs/install-media-server.sh \
    --rtc-domain rtc.yourdomain.com \
    --stream-domain stream.yourdomain.com \
    --email admin@yourdomain.com
```

---

## Project Structure

```
├── app/
│   ├── Console/           # Artisan commands
│   ├── Events/            # Broadcast events (10+ real-time events)
│   ├── Exceptions/        # Error handlers
│   ├── Http/
│   │   ├── Controllers/   # API controllers (30+)
│   │   │   ├── Admin/     # Admin controllers
│   │   │   └── Auth/      # Auth-specific controllers
│   │   └── Middleware/     # Custom middleware
│   ├── Jobs/              # Queueable jobs (AI, moderation, etc.)
│   ├── Listeners/         # Event listeners
│   ├── Models/            # Eloquent models (25+)
│   ├── Notifications/     # Notification classes
│   ├── Policies/          # Authorization policies
│   └── Services/          # Business logic services
├── config/                # Configuration files
├── database/
│   ├── migrations/        # Database migrations (35+)
│   └── seeders/           # Database seeders
├── docs/                  # Documentation
│   ├── live-streaming-server-setup.md
│   └── install-media-server.sh
├── resources/
│   ├── css/               # Stylesheets
│   ├── js/                # React SPA
│   │   └── ui/
│   │       ├── components/  # Reusable UI components
│   │       ├── contexts/    # React contexts (Theme)
│   │       └── pages/       # Page components (30+)
│   └── views/             # Blade templates
├── routes/                # Route definitions
│   ├── api.php            # API routes (90+ endpoints)
│   └── web.php            # Web routes
└── tests/                 # PHPUnit tests (23 passing)
```

---

## API Overview

The platform exposes **90+ REST API endpoints** under `/api/v1/`:

| Module | Key Endpoints |
|--------|--------------|
| **Auth** | register, login, logout, forgot-password, reset-password, email/verify |
| **Profile** | GET/PUT /me, GET/PUT /profile, GET /resume |
| **Feed** | CRUD posts, comments, reactions (7 types) |
| **Chat** | conversations, messages, groups, group-messages, typing, read receipts |
| **Friends** | requests, accept/decline, blocks |
| **Communities** | CRUD, join/leave, invite members |
| **Events** | CRUD, register, QR check-in, attendance reports |
| **Resources** | upload, categories, rate, download |
| **Jobs** | CRUD, apply, matching, applications |
| **Placements** | CRUD, stats, bulk-import, skill-gaps |
| **Live Streaming** | CRUD streams, start/end, HLS playback |
| **Call Rooms** | create, join (JWT token), leave |
| **Notifications** | list, mark-read, preferences |
| **Search** | global search across all entities |
| **AI** | generate tags, chatbot, resume analysis, moderation queue |
| **Gamification** | leaderboard, badges, points |
| **Admin** | dashboard, users, reports, audit-logs, moderation, announcements, scholarships, placements |

---

## Tests

```bash
# Run the test suite
php artisan test

# Run specific test
php artisan test --filter=AuthApiTest

# 23 tests passing (112 assertions)
```

---

## Documentation

- `docs/live-streaming-server-setup.md` — Media server setup for live streaming and WebRTC calls
- `docs/install-media-server.sh` — One-click media server installer (HestiaCP-compatible)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## Security

- All API endpoints use Laravel Sanctum token authentication
- Role-based access control (super_admin, moderator, user)
- Content moderation with AI-powered toxicity detection
- Rate limiting on API endpoints
- CSRF protection, XSS prevention, SQL injection protection
- Audit logging for all admin actions

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ for the ISDB-BISEW Scholarship Community</p>
</div>
