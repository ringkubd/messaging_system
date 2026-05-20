#!/usr/bin/env bash
# Run: sudo bash fix-media-local.sh
set -euo pipefail

PUBLIC_IP=$(curl -4 -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo "========================================"
echo "  Fixing Media Services on ${PUBLIC_IP}"
echo "========================================"

# ============================
# 1. LIVEKIT — systemd service
# ============================
echo ""
echo "[1/4] Fixing LiveKit..."
mkdir -p /opt/media-server

cat > /etc/systemd/system/livekit.service <<LIVEKITSVC
[Unit]
Description=LiveKit Server (WebRTC SFU)
After=network.target redis-server.service

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
systemctl enable --now livekit
sleep 2

if systemctl is-active livekit > /dev/null 2>&1; then
    echo "   ✅ LiveKit running on port 7880"
else
    echo "   ❌ LiveKit failed. Logs:"
    journalctl -u livekit -n 10 --no-pager
fi

# ============================
# 2. SRS — compile from source
# ============================
echo ""
echo "[2/4] Installing SRS Media Server..."

if [[ -f /usr/local/srs/objs/srs ]] && /usr/local/srs/objs/srs -v 2>/dev/null; then
    echo "   ✅ SRS already installed"
else
    apt update -qq
    apt install -y -qq automake autoconf libtool patch build-essential curl

    cd /tmp
    rm -rf srs-src 2>/dev/null || true
    git clone --depth 1 -b v5.0-r3 https://github.com/ossrs/srs.git srs-src 2>&1

    cd srs-src/trunk
    ./configure --prefix=/usr/local/srs --disable-all --with-ssl --with-hls \
        --with-http-server --with-http-callback --with-http-api
    make -j$(nproc)
    make install
    cd / && rm -rf /tmp/srs-src
    echo "   ✅ SRS compiled and installed"
fi

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
systemctl enable --now srs
sleep 2

if curl -sf http://127.0.0.1:1985/api/v1/versions > /dev/null 2>&1; then
    echo "   ✅ SRS running — RTMP :1935, HLS :8080, API :1985"
else
    echo "   ⚠️  SRS might not be running. Logs:"
    journalctl -u srs -n 10 --no-pager
fi

# ============================
# 3. COTURN — fix bind address
# ============================
echo ""
echo "[3/4] Fixing Coturn..."
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

if ss -tlnp 2>/dev/null | grep -q "0.0.0.0:3478"; then
    echo "   ✅ Coturn listening on 0.0.0.0:3478"
else
    echo "   ⚠️  Coturn may still be on Docker IP. Check: ss -tlnp | grep 3478"
fi

# ============================
# 4. NGINX HLS endpoint
# ============================
echo ""
echo "[4/4] Configuring Nginx HLS..."
mkdir -p /var/www/hls

cat > /etc/nginx/conf.d/stream-hls.conf <<NGINXEOF
server {
    listen 8081;
    server_name localhost;
    add_header Access-Control-Allow-Origin *;
    location /hls {
        types {
            application/vnd.apple.mpegurl m3u8;
            video/mp2t ts;
        }
        alias /var/www/hls;
        add_header Cache-Control no-cache;
    }
}
NGINXEOF

nginx -t 2>/dev/null && systemctl reload nginx && echo "   ✅ Nginx HLS on :8081/hls" || echo "   ⚠️  Nginx reload failed"

# Firewall
echo ""
echo "Opening firewall ports..."
for port in 1935 3478 7880 7881 8080 8081 50000:60000; do
    ufw allow "$port" 2>/dev/null || true
done

# ============================
# SUMMARY
# ============================
echo ""
echo "========================================"
echo "  Media Server Status"
echo "========================================"
echo ""
for svc in livekit srs coturn; do
    STATUS=$(systemctl is-active "$svc" 2>/dev/null || echo "not found")
    echo "  $svc: $STATUS"
done

echo ""
echo "  Port checks:"
for port in 7880 1935 1985 3478 8081; do
    if ss -tlnp 2>/dev/null | grep -q ":$port "; then
        echo "    :$port — ✅"
    else
        echo "    :$port — ❌"
    fi
done

echo ""
echo "  .env values to add:"
echo "    LIVEKIT_HOST=http://${PUBLIC_IP}:7880"
echo "    LIVEKIT_WS_URL=ws://${PUBLIC_IP}:7880"
echo "    LIVEKIT_API_KEY=API7Kf8AKuvgHmD"
echo "    LIVEKIT_API_SECRET=Kv8MFQZL1lRiTISvXX14nkJHUDYblkQjfjaxxOmdbtE"
echo "    RTMP_SERVER=rtmp://${PUBLIC_IP}"
echo "    HLS_SERVER=http://${PUBLIC_IP}:8081/hls"
echo "    TURN_SERVER=${PUBLIC_IP}"
echo "    TURN_SECRET=AyXzSfFo5cJyFGNnFmyjZHqYTq9sYVvDc4rBTrBqsCnDGzFzsD"
echo ""
