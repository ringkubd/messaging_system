# Live Streaming + Audio/Video Call Infrastructure

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    UBUNTU + HESTIACP SERVER                    │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────────┐  │
│  │  Laravel App │  │  LiveKit    │  │  SRS Media Server     │  │
│  │  + Next.js   │  │  (WebRTC)   │  │  (RTMP + HLS)        │  │
│  │  :443        │  │  :7880      │  │  :1935 (RTMP)        │  │
│  └──────┬───────┘  └──────┬──────┘  │  :8080 (HLS HTTP)    │  │
│         │                  │         └──────────┬────────────┘  │
│         ▼                  ▼                     ▼              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              HESTIACP NGINX (reverse proxy)               │   │
│  │  app. → Laravel  |  rtc. → LiveKit  |  stream. → SRS    │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                  │                     │              │
│         ▼                  ▼                     ▼              │
│    Cloudflare ───── HTTPS ──────── Users (Web + Mobile)        │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Coturn (TURN/STUN) :3478  —  NAT traversal for WebRTC   │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Services (All Native — No Docker)

| Service | Purpose | Ports | How to check |
|---------|---------|-------|-------------|
| **LiveKit** | WebRTC SFU (1-on-1 & group calls) | 7880 (HTTP), 7881 (TCP/UDP), 50000-60000 (media) | `systemctl status livekit` |
| **SRS** | RTMP streaming + HLS transcoding | 1935 (RTMP), 8080 (HLS), 1985 (API) | `systemctl status srs` |
| **Coturn** | TURN/STUN relay for NAT traversal | 3478 (UDP/TCP), 5349 (TLS) | `systemctl status coturn` |
| **Nginx** | Reverse proxy (via HestiaCP or standalone) | 80, 443 | `nginx -t` |

## One-Click Install

```bash
# Download and run
wget -O install-media-server.sh https://your-server/install-media-server.sh
chmod +x install-media-server.sh

# Run with your domains
sudo bash install-media-server.sh \
    --rtc-domain rtc.isdb-bisew.org \
    --stream-domain stream.isdb-bisew.org \
    --turn-domain turn.isdb-bisew.org \
    --email admin@isdb-bisew.org \
    --hestia-user admin

# Optional: skip SSL if DNS isn't pointed yet
sudo bash install-media-server.sh --skip-ssl
```

## Manual Installation Steps

### 1. Prerequisites

```bash
sudo apt update
sudo apt install -y curl wget build-essential libpcre3-dev libssl-dev \
    zlib1g-dev libnginx-mod-rtmp coturn certbot python3-certbot-nginx \
    ufw redis-server ffmpeg
```

### 2. LiveKit (WebRTC SFU)

```bash
# Download binary
wget https://github.com/livekit/livekit/releases/download/v1.8.6/livekit_1.8.6_linux_amd64.tar.gz
tar -xzf livekit_1.8.6_linux_amd64.tar.gz
sudo mv livekit-server /usr/local/bin/
sudo chmod +x /usr/local/bin/livekit-server

# Generate keys
API_KEY=$(openssl rand -hex 32)
API_SECRET=$(openssl rand -hex 64)

# Config at /opt/media-server/livekit/livekit.yaml
sudo mkdir -p /opt/media-server/livekit

# Start
sudo systemctl enable --now livekit
```

### 3. SRS (RTMP + HLS Streaming)

```bash
# Compile from source (no Docker)
sudo apt install -y automake autoconf libtool patch
git clone --depth 1 -b v5.0-r3 https://github.com/ossrs/srs.git /tmp/srs
cd /tmp/srs/trunk
./configure --prefix=/usr/local/srs --disable-all --with-ssl --with-hls \
    --with-http-server --with-http-callback --with-http-api
make -j$(nproc)
sudo make install

# Config at /usr/local/srs/conf/srs.conf
sudo systemctl enable --now srs
```

### 4. Coturn (TURN/STUN)

```bash
sudo apt install -y coturn
# Config at /etc/turnserver.conf
sudo systemctl enable --now coturn
```

### 5. HestiaCP Integration

Add subdomains in HestiaCP panel:
- `rtc.yourdomain.com` → LiveKit proxy
- `stream.yourdomain.com` → SRS HLS proxy

Then add custom Nginx configs to:
- `/home/{user}/conf/nginx/{domain}.custom.conf`

**LiveKit proxy config** (for `rtc.domain`):
```nginx
location / {
    proxy_pass http://127.0.0.1:7880;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
}
```

**Stream proxy config** (for `stream.domain`):
```nginx
location /hls {
    types {
        application/vnd.apple.mpegurl m3u8;
        video/mp2t ts;
    }
    alias /var/www/hls;
    add_header Cache-Control no-cache;
    add_header Access-Control-Allow-Origin *;
}
location /stats {
    proxy_pass http://127.0.0.1:1985/;
}
```

### 6. SSL via Let's Encrypt

```bash
sudo certbot --nginx -d rtc.yourdomain.com
sudo certbot --nginx -d stream.yourdomain.com
```

## Laravel .env Configuration

```env
# LiveKit (WebRTC calls)
LIVEKIT_HOST=https://rtc.isdb-bisew.org
LIVEKIT_API_KEY=<from install output>
LIVEKIT_API_SECRET=<from install output>
LIVEKIT_WS_URL=wss://rtc.isdb-bisew.org

# SRS (RTMP/HLS streaming)
RTMP_SERVER=rtmp://stream.isdb-bisew.org
HLS_SERVER=https://stream.isdb-bisew.org/hls

# Coturn (TURN/STUN)
TURN_SERVER=turn.isdb-bisew.org
TURN_SECRET=<from install output>
```

## OBS Studio Setup (Streamers)

1. Open OBS Studio
2. Settings → Stream:
   - Service: Custom
   - Server: `rtmp://stream.isdb-bisew.org/live`
   - Stream Key: (copy from the app's Go Live page)
3. Settings → Output:
   - Video Bitrate: 2500 Kbps
   - Audio Bitrate: 128 Kbps
4. Click **Start Streaming**

## WebRTC Call Flow (LiveKit)

```
1. User A clicks "Start Call" on another user's profile
2. Laravel creates a CallRoom → POST /api/v1/call-rooms
3. Laravel creates a LiveKit room via LiveKit REST API
4. User A joins → POST /api/v1/call-rooms/{id}/join
5. Laravel returns LiveKit JWT token + WebSocket URL
6. User A's browser connects to LiveKit via LiveKit JS SDK
7. User A sends invite to User B via Soketi
8. User B joins the same room → gets their own JWT token
9. Both users now in LiveKit room → WebRTC peer connection via SFU

LiveKit handles: ICE, STUN/TURN, media forwarding, simulcast, recording
```

## Firewall Rules

| Port(s) | Protocol | Service | Required |
|---------|----------|---------|----------|
| 22 | TCP | SSH | Yes |
| 80, 443 | TCP | HTTP/HTTPS | Yes |
| 1935 | TCP | RTMP ingest | Yes (streaming) |
| 3478 | TCP+UDP | TURN | Yes (calls behind NAT) |
| 5349 | TCP+UDP | TURN TLS | Yes (secure TURN) |
| 7880 | TCP | LiveKit HTTP | No (internal) |
| 7881 | TCP+UDP | LiveKit media | Yes (calls) |
| 50000-60000 | TCP+UDP | WebRTC media | Yes (calls) |

## Troubleshooting

### Check service status
```bash
systemctl status livekit
systemctl status srs
systemctl status coturn
journalctl -u livekit -n 50 --no-pager
```

### Test RTMP stream
```bash
# Using FFmpeg to push a test stream
ffmpeg -re -i test.mp4 -c copy -f flv rtmp://localhost/live/test-key-123

# Check if HLS is being generated
ls /var/www/hls/
```

### Test LiveKit
```bash
curl -s http://127.0.0.1:7880/rtc | head -5

# List rooms
curl -s -H "Authorization: Bearer $(php artisan livekit:admin-token)" \
    http://127.0.0.1:7880/twirp/livekit.RoomService/ListRooms
```

### Test TURN
```bash
# From another machine
turnutils_uclient -t -T -p 3478 turn.isdb-bisew.org
```

### Firewall issues
```bash
sudo ufw status numbered
sudo tail -f /var/log/ufw.log
```

## Frontend Integration

### Web (Next.js)
```bash
npm install livekit-client @livekit/components-react hls.js
```

### Mobile (React Native)
```bash
npm install @livekit/react-native
npm install react-native-webrtc
```

### Basic LiveKit connection (web)
```js
import { Room, RoomEvent } from 'livekit-client';

const room = new Room();
await room.connect('wss://rtc.isdb-bisew.org', jwtToken);

// Publish local tracks
const tracks = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
tracks.getTracks().forEach(track => room.localParticipant.publishTrack(track));

// Subscribe to remote tracks
room.on(RoomEvent.TrackSubscribed, (track, participant) => {
    const el = track.attach();
    document.getElementById('remote-video').appendChild(el);
});
```

### Basic HLS player (web)
```js
import Hls from 'hls.js';

const video = document.getElementById('video');
if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource('https://stream.isdb-bisew.org/hls/stream-key.m3u8');
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
}
```
