# Live Streaming Server Setup Guide

## Architecture Overview

```
Broadcaster (OBS/StreamYard)
        │
        ▼  RTMP ingest
┌───────────────────┐
│  Nginx-RTMP Server│
│  port 1935        │
└───────┬───────────┘
        │  Transcode to HLS
        ▼
┌───────────────────┐
│  HLS Segments     │
│  /var/www/hls/    │
└───────┬───────────┘
        │  Serve via HTTP
        ▼
┌───────────────────┐
│  Nginx HTTP       │
│  port 443 (HTTPS) │
│  /hls/*.m3u8      │
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│  Laravel App      │
│  manages metadata │
│  /api/v1/live-    │
│  streams/*        │
└───────────────────┘
        │
        ▼
  Browser (HLS.js player)
```

---

## Option 1: Nginx + RTMP Module (Recommended, Self-Hosted)

### 1. Install Nginx with RTMP Module (Ubuntu 22.04)

```bash
# Install build dependencies
sudo apt update
sudo apt install -y build-essential libpcre3 libpcre3-dev libssl-dev zlib1g-dev

# Download and compile Nginx with RTMP module
cd /tmp
wget http://nginx.org/download/nginx-1.24.0.tar.gz
wget https://github.com/arut/nginx-rtmp-module/archive/master.zip
tar -xzf nginx-1.24.0.tar.gz
unzip master.zip

cd nginx-1.24.0
./configure --with-http_ssl_module --add-module=../nginx-rtmp-module-master
make
sudo make install

# Or use the PPA for pre-built package (easier):
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:nginx/development
sudo apt install -y nginx libnginx-mod-rtmp
```

### 2. Configure Nginx-RTMP

Create `/etc/nginx/nginx.conf` (add RTMP block at the end):

```nginx
events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    keepalive_timeout 65;

    # HLS playback
    server {
        listen 443 ssl http2;
        server_name stream.isdb-bisew.org;

        ssl_certificate     /etc/letsencrypt/live/stream.isdb-bisew.org/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/stream.isdb-bisew.org/privkey.pem;

        # HLS stream serving
        location /hls {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root /var/www;
            add_header Cache-Control no-cache;
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods 'GET, OPTIONS';
        }

        # RTMP stats page (optional, password-protected)
        location /stats {
            rtmp_stat all;
            rtmp_stat_stylesheet /stat.xsl;
            auth_basic "Stream Stats";
            auth_basic_user_file /etc/nginx/.htpasswd;
        }
    }
}

# RTMP ingest
rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        max_streams 100;
        allow publish 127.0.0.1;
        allow publish 10.0.0.0/8;    # Private network (app server)
        deny publish all;            # Default deny
        allow play all;

        application live {
            live on;
            record off;

            # Transcode incoming RTMP to HLS
            hls on;
            hls_path /var/www/hls;
            hls_fragment 2;
            hls_playlist_length 30;
            hls_cleanup on;

            # Authentication via on_publish URL
            on_publish http://localhost:8000/api/v1/live-streams/auth-stream?key=$name;
            on_publish_done http://localhost:8000/api/v1/live-streams/end-stream?key=$name;

            # Allow dynamic stream keys
            allow publish all;
        }
    }
}
```

### 3. Set Up SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d stream.isdb-bisew.org
```

### 4. Create HLS Directory

```bash
sudo mkdir -p /var/www/hls
sudo chown -R www-data:www-data /var/www/hls
```

### 5. Restart Nginx

```bash
sudo nginx -t           # Test config
sudo systemctl restart nginx
```

---

## Option 2: MediaMTX (Simpler, Go-Based)

MediaMTX supports RTMP, WebRTC, HLS, and SRT out of the box.

```bash
# Download MediaMTX
wget https://github.com/bluenviron/mediamtx/releases/latest/download/mediamtx_v1.8.0_linux_amd64.tar.gz
tar -xzf mediamtx_v1.8.0_linux_amd64.tar.gz
sudo mv mediamtx /usr/local/bin/
sudo mkdir -p /etc/mediamtx
sudo mv mediamtx.yml /etc/mediamtx/

# Create systemd service
sudo tee /etc/systemd/system/mediamtx.service << 'EOF'
[Unit]
Description=MediaMTX Server
After=network.target

[Service]
ExecStart=/usr/local/bin/mediamtx /etc/mediamtx/mediamtx.yml
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now mediamtx
```

### MediaMTX Configuration (`/etc/mediamtx/mediamtx.yml`)

```yaml
rtmp: true
rtmpAddress: :1935

hls: true
hlsAddress: :8888
hlsDirectory: /var/www/hls

paths:
  all:
    source: publisher
    publishUser: admin
    publishPass: your-stream-password
```

---

## Option 3: Cloud-Hosted (No Server Management)

| Service | Pricing | Notes |
|---------|---------|-------|
| **Mux.com** | $5/1000 min | Simple API, great HLS delivery |
| **Bunny.net** | Pay-as-you-go | CDN + Stream, good for Bangladesh |
| **Vimeo Livestream** | $75/mo | Enterprise features |
| **Cloudflare Stream** | $5/1000 min | Great global CDN |

---

## Integration with Laravel App

### 1. Environment Variables (`.env`)

```env
RTMP_SERVER=rtmp://stream.isdb-bisew.org
HLS_SERVER=https://stream.isdb-bisew.org/hls
```

### 2. Stream Key Authentication

The `on_publish` hook in Nginx calls the Laravel app to verify stream keys. Add this endpoint:

```php
// In LiveStreamController or a dedicated endpoint
public function authStream(Request $request)
{
    $key = $request->query('key');
    $stream = LiveStream::where('stream_key', $key)
        ->where('status', 'scheduled')
        ->first();

    if (!$stream) {
        return response('Invalid stream key', 403);
    }

    $stream->update([
        'status' => 'live',
        'started_at' => now(),
    ]);

    return response('OK', 200);
}

public function endStreamOnPublishDone(Request $request)
{
    $key = $request->query('key');
    $stream = LiveStream::where('stream_key', $key)
        ->where('status', 'live')
        ->first();

    if ($stream) {
        $stream->update([
            'status' => 'ended',
            'ended_at' => now(),
        ]);
    }

    return response('OK', 200);
}
```

Route (public, no auth — called by Nginx):
```php
Route::get('/live-streams/auth-stream', [LiveStreamController::class, 'authStream']);
Route::get('/live-streams/end-stream', [LiveStreamController::class, 'endStreamOnPublishDone']);
```

### 3. HLS Player in Frontend

The player is already implemented in `LiveStreamWatchPage.jsx` using HLS.js:
```js
import Hls from 'hls.js';

if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(hlsUrl);
    hls.attachMedia(videoElement);
}
```

---

## OBS Studio Configuration (for Streamers)

1. Open OBS Studio
2. **Settings → Stream**:
   - Service: Custom
   - Server: `rtmp://stream.isdb-bisew.org/live`
   - Stream Key: (copy from the app's Go Live page)
3. **Settings → Output**:
   - Video Bitrate: 2500 Kbps (adjust for your upload speed)
   - Audio Bitrate: 128 Kbps
   - Encoder: Hardware (NVENC/AMF) if available
4. **Settings → Video**:
   - Base Resolution: 1920x1080
   - Output Resolution: 1280x720 (720p recommended)
   - FPS: 30
5. Click **Start Streaming**

---

## Monitoring & Scaling

### Monitoring
```bash
# Check RTMP stats
curl http://stream.isdb-bisew.org/stats

# Monitor HLS segments
ls -la /var/www/hls/

# Nginx access logs
tail -f /var/log/nginx/access.log

# MediaMTX logs
journalctl -u mediamtx -f
```

### Scaling for 100+ Concurrent Viewers

1. **CDN for HLS delivery**: Use Cloudflare or Bunny CDN in front of `/hls/`
2. **Edge server**: Move Nginx-RTMP to a server with good upload in Bangladesh
3. **Transcoding server**: Use a separate server for transcoding if needed
4. **Load balancer**: For multiple streaming servers, use RTMP redirect

### Recommended Hardware

| Usage | Spec | Estimated Cost (BDT) |
|-------|------|---------------------|
| Small (10-50 viewers) | 2 vCPU, 4GB RAM | ~2,000/mo VPS |
| Medium (50-200 viewers) | 4 vCPU, 8GB RAM | ~5,000/mo VPS |
| Large (200-1000 viewers) | 8 vCPU, 16GB RAM + CDN | ~15,000/mo + CDN |

Choose a VPS provider with good Bangladesh connectivity: DigitalOcean (Singapore), Linode (Singapore), or local providers like ServerErend or BDCOM.
