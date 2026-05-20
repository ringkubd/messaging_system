#!/usr/bin/env bash
# Run with: sudo bash setup-media-local.sh
set -euo pipefail

PUBLIC_IP=$(curl -4 -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo "Public IP: ${PUBLIC_IP}"

# ============================
# 1. Fix LiveKit (v1.12.0)
# ============================
echo ">>> Fixing LiveKit config for v1.12.0..."
mkdir -p /opt/media-server/credentials.d

cat > /etc/systemd/system/livekit.service <<LIVEKITSVC
[Unit]
Description=LiveKit Server (WebRTC SFU)
After=network.target redis-server.service
Wants=redis-server.service

[Service]
Type=simple
ExecStart=/usr/local/bin/livekit-server \
    --bind 0.0.0.0 \
    --port 7880 \
    --node-ip ${PUBLIC_IP} \
    --udp-port 50000:60000 \
    --keys "API7Kf8AKuvgHmD: Kv8MFQZL1lRiTISvXX14nkJHUDYblkQjfjaxxOmdbtE" \
    --redis-host 127.0.0.1:6379
Restart=always
RestartSec=3
User=nobody
Group=nogroup
LimitNOFILE=100000

[Install]
WantedBy=multi-user.target
LIVEKITSVC

systemctl daemon-reload
systemctl enable --now livekit 2>/dev/null || true
sleep 1

if systemctl is-active livekit > /dev/null 2>&1; then
    echo "   ✅ LiveKit is running"
    curl -sf http://127.0.0.1:7880/rtc > /dev/null && echo "   ✅ LiveKit API OK"
else
    echo "   ❌ LiveKit NOT running — check: journalctl -u livekit -n 20 --no-pager"
fi

# ============================
# 2. Install SRS (RTMP + HLS)
# ============================
echo ">>> Installing SRS Media Server..."
if [[ -f /usr/local/srs/objs/srs ]]; then
    echo "   SRS already installed at /usr/local/srs"
else
    apt update -qq && apt install -y -qq automake autoconf libtool patch build-essential
    cd /tmp
    git clone --depth 1 -b v5.0-r3 https://github.com/ossrs/srs.git srs-src 2>/dev/null || true
    cd srs-src/trunk
    ./configure --prefix=/usr/local/srs --disable-all --with-ssl --with-hls --with-http-server --with-http-api
    make -j$(nproc)
    make install
    cd /
    rm -rf /tmp/srs-src
    echo "   ✅ SRS compiled from source"
fi

# SRS config
mkdir -p /usr/local/srs/conf
cat > /usr/local/srs/conf/srs.conf <<SRSEOF
listen 1935;
max_connections 1000;
pid /usr/local/srs/objs/srs.pid;
srs_log_tank file;
srs_log_file /var/log/srs.log;

http_api {
    enabled on;
    listen 1985;
}

http_server {
    enabled on;
    listen 8080;
}

vhost __defaultVhost__ {
    hls {
        enabled on;
        hls_path /var/www/hls;
        hls_fragment 2;
        hls_window 30;
        hls_cleanup on;
        hls_dispose 10;
    }
    http_remux {
        enabled on;
    }
}
SRSEOF

# SRS systemd service
cat > /etc/systemd/system/srs.service <<SRSSVC
[Unit]
Description=SRS Media Server (RTMP + HLS)
After=network.target

[Service]
Type=forking
ExecStart=/usr/local/srs/objs/srs -c /usr/local/srs/conf/srs.conf
PIDFile=/usr/local/srs/objs/srs.pid
Restart=always
RestartSec=5
User=root
LimitNOFILE=100000

[Install]
WantedBy=multi-user.target
SRSSVC

systemctl daemon-reload
systemctl enable --now srs 2>/dev/null || true
sleep 1

if curl -sf http://127.0.0.1:1985/api/v1/versions > /dev/null 2>&1; then
    echo "   ✅ SRS is running (RTMP :1935, HLS :8080, API :1985)"
else
    echo "   ⚠️  SRS might not be running — check: journalctl -u srs -n 10 --no-pager"
fi

# ============================
# 3. Fix Coturn (listen on 0.0.0.0)
# ============================
echo ">>> Fixing Coturn config..."
cat > /etc/turnserver.conf <<TURNEOF
listening-port=3478
listening-ip=0.0.0.0
relay-ip=${PUBLIC_IP}
external-ip=${PUBLIC_IP}

realm=turn.isdb-bisew.org
fingerprint
use-auth-secret
static-auth-secret=AyXzSfFo5cJyFGNnFmyjZHqYTq9sYVvDc4rBTrBqsCnDGzFzsD

min-port=49152
max-port=65535
no-udp-relay=0

log-file=/var/log/turnserver.log
no-stdout-log
no-tlsv1
no-tlsv1_1

denied-peerlist=*
no-multicast-peers
TURNEOF

sed -i 's/^TURNSERVER_ENABLED=.*/TURNSERVER_ENABLED=1/' /etc/default/coturn
systemctl restart coturn
sleep 1

if ss -tlnp 2>/dev/null | grep -q ":3478"; then
    echo "   ✅ Coturn is running on :3478"
else
    echo "   ❌ Coturn NOT running"
fi

# ============================
# 4. Nginx HLS endpoint (standalone)
# ============================
echo ">>> Configuring Nginx HLS endpoint..."
mkdir -p /var/www/hls

if [[ ! -f /etc/nginx/conf.d/stream-hls.conf ]]; then
    cat > /etc/nginx/conf.d/stream-hls.conf <<NGINXSTR
server {
    listen 8081;
    server_name localhost;

    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, OPTIONS';

    location /hls {
        types {
            application/vnd.apple.mpegurl m3u8;
            video/mp2t ts;
        }
        alias /var/www/hls;
        add_header Cache-Control no-cache;
    }
}
NGINXSTR
    nginx -t 2>/dev/null && systemctl reload nginx && echo "   ✅ Nginx HLS endpoint on :8081/hls"
fi

# ============================
# 5. Firewall
# ============================
echo ">>> Opening firewall ports..."
for port in 1935 3478 7880 7881 8080 8081 50000:60000; do
    ufw allow "$port" 2>/dev/null || true
done
echo "   ✅ Firewall ports opened"

# ============================
# 6. Update .env
# ============================
cd /home/anwar/Dropbox/messagesing_system
cat >> .env <<ENVEOF

# Media Server (Local)
LIVEKIT_HOST=http://${PUBLIC_IP}:7880
LIVEKIT_WS_URL=ws://${PUBLIC_IP}:7880
LIVEKIT_API_KEY=API7Kf8AKuvgHmD
LIVEKIT_API_SECRET=Kv8MFQZL1lRiTISvXX14nkJHUDYblkQjfjaxxOmdbtE
RTMP_SERVER=rtmp://${PUBLIC_IP}
HLS_SERVER=http://${PUBLIC_IP}:8081/hls
TURN_SERVER=${PUBLIC_IP}
TURN_SECRET=AyXzSfFo5cJyFGNnFmyjZHqYTq9sYVvDc4rBTrBqsCnDGzFzsD
ENVEOF
echo "   ✅ .env updated with media server settings"

# ============================
# Summary
# ============================
echo ""
echo "═══════════════════════════════════════════════════"
echo "      Media Server — Local Setup Complete"
echo "═══════════════════════════════════════════════════"
echo ""
echo "  LiveKit:  http://${PUBLIC_IP}:7880"
echo "  RTMP:     rtmp://${PUBLIC_IP}/live/{key}"
echo "  HLS:      http://${PUBLIC_IP}:8081/hls/{key}.m3u8"
echo "  TURN:     ${PUBLIC_IP}:3478"
echo ""
echo "  Test LiveKit:  curl http://127.0.0.1:7880/rtc"
echo "  Test SRS:      curl http://127.0.0.1:1985/api/v1/versions"
echo "  Test Coturn:   ss -tlnp | grep 3478"
echo ""
echo "  Check logs:"
echo "    journalctl -u livekit -n 20 --no-pager"
echo "    journalctl -u srs -n 20 --no-pager"
echo "    tail -f /var/log/turnserver.log"
echo "═══════════════════════════════════════════════════"
