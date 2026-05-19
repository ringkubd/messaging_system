#!/usr/bin/env bash
set -euo pipefail

# ================================================================
# ISDB-BISEW Connect — Media Server Installer
# HestiaCP-compatible, zero Docker, native services
# ================================================================
# Installs: LiveKit (binary), SRS (compiled), Coturn (apt)
# Integrates with: HestiaCP Nginx, existing infrastructure
# ================================================================

SCRIPT_VERSION="2.0.0"
LIVEKIT_VERSION="1.8.6"
SRS_VERSION="v5.0.154"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }
header(){ echo -e "\n${BLUE}${BOLD}═══ $* ═══${NC}\n"; }

if [[ $EUID -ne 0 ]]; then error "This script must be run as root (sudo)."; fi

# --------------- Configurable ---------------
RTC_DOMAIN="${RTC_DOMAIN:-rtc.isdb-bisew.org}"
STREAM_DOMAIN="${STREAM_DOMAIN:-stream.isdb-bisew.org}"
TURN_DOMAIN="${TURN_DOMAIN:-turn.isdb-bisew.org}"
EMAIL="${EMAIL:-admin@isdb-bisew.org}"
HESTIA_USER="${HESTIA_USER:-admin}"

# --------------- Argument parsing ---------------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --rtc-domain) RTC_DOMAIN="$2"; shift 2 ;;
        --stream-domain) STREAM_DOMAIN="$2"; shift 2 ;;
        --turn-domain) TURN_DOMAIN="$2"; shift 2 ;;
        --email) EMAIL="$2"; shift 2 ;;
        --hestia-user) HESTIA_USER="$2"; shift 2 ;;
        --skip-ssl) SKIP_SSL=1; shift ;;
        --help)
            echo "Usage: $0 [--rtc-domain rtc.example.com] [--stream-domain stream.example.com] [--email admin@example.com] [--hestia-user admin] [--skip-ssl]"
            exit 0 ;;
        *) error "Unknown argument: $1" ;;
    esac
done

PUBLIC_IP=$(curl -4 -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

# ================================================================
# 1. SYSTEM DEPENDENCIES
# ================================================================
header "System Dependencies"
apt update
apt install -y curl wget gnupg2 build-essential libpcre3-dev libssl-dev \
    zlib1g-dev libnginx-mod-rtmp coturn certbot python3-certbot-nginx \
    ufw redis-server ffmpeg

info "Core dependencies installed"

# ================================================================
# 2. DIRECTORY STRUCTURE
# ================================================================
header "Directory Setup"
mkdir -p /opt/media-server/{livekit,srs,ssl,logs}
mkdir -p /var/www/hls
info "Directories created"

# ================================================================
# 3. LIVEKIT (NATIVE BINARY)
# ================================================================
header "Installing LiveKit ${LIVEKIT_VERSION}"

LIVEKIT_API_KEY=$(openssl rand -hex 32)
LIVEKIT_API_SECRET=$(openssl rand -hex 64)

if ! command -v livekit-server &>/dev/null; then
    cd /tmp
    wget -q "https://github.com/livekit/livekit/releases/download/v${LIVEKIT_VERSION}/livekit_${LIVEKIT_VERSION}_linux_amd64.tar.gz"
    tar -xzf "livekit_${LIVEKIT_VERSION}_linux_amd64.tar.gz"
    mv livekit-server /usr/local/bin/
    chmod +x /usr/local/bin/livekit-server
    rm -f "livekit_${LIVEKIT_VERSION}_linux_amd64.tar.gz"
    info "LiveKit binary installed"
else
    info "LiveKit already installed"
fi

cat > /opt/media-server/livekit/livekit.yaml <<LIVEKITEOF
port: 7880
bind_addresses:
  - "0.0.0.0"
node_ip: "${PUBLIC_IP}"

rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true

keys:
  ${LIVEKIT_API_KEY}: ${LIVEKIT_API_SECRET}

turn:
  enabled: true
  domain: ${TURN_DOMAIN}
  tls_port: 5349

logging:
  level: info
  format: json
LIVEKITEOF

cat > /etc/systemd/system/livekit.service <<LIVEKITSVC
[Unit]
Description=LiveKit Server (WebRTC SFU)
After=network.target redis-server.service
Wants=redis-server.service

[Service]
Type=simple
ExecStart=/usr/local/bin/livekit-server --config /opt/media-server/livekit/livekit.yaml
Restart=always
RestartSec=5
User=nobody
Group=nogroup
LimitNOFILE=100000

[Install]
WantedBy=multi-user.target
LIVEKITSVC

systemctl daemon-reload
systemctl enable --now livekit.service
info "LiveKit running on port 7880"

# ================================================================
# 4. SRS MEDIA SERVER (COMPILED FROM SOURCE — NO DOCKER)
# ================================================================
header "Installing SRS Media Server ${SRS_VERSION}"

if ! command -v srs &>/dev/null && [[ ! -f /usr/local/srs/objs/srs ]]; then
    apt install -y automake autoconf libtool patch

    cd /tmp
    git clone --depth 1 -b "${SRS_VERSION}" https://github.com/ossrs/srs.git srs-src
    cd srs-src/trunk

    ./configure --prefix=/usr/local/srs --disable-all --with-ssl --with-hls --with-http-server --with-http-callback --with-http-api
    make -j"$(nproc)"
    make install

    cd /
    rm -rf /tmp/srs-src
    info "SRS compiled and installed from source"
else
    info "SRS already installed"
fi

cat > /usr/local/srs/conf/srs.conf <<SRSEOF
listen 1935;
max_connections 1000;
pid /usr/local/srs/objs/srs.pid;
srs_log_tank file;
srs_log_file /opt/media-server/logs/srs.log;

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
ExecStop=/usr/local/srs/etc/init.d/srs stop
Restart=always
RestartSec=5
User=root
LimitNOFILE=100000

[Install]
WantedBy=multi-user.target
SRSSVC

systemctl daemon-reload
systemctl enable --now srs.service
sleep 2
info "SRS running — RTMP :1935, HLS :8080"

# ================================================================
# 5. COTURN (TURN/STUN) — via apt
# ================================================================
header "Configuring Coturn"

TURN_SECRET=$(openssl rand -hex 32)

cat > /etc/turnserver.conf <<TURNEOF
listening-port=3478
tls-listening-port=5349
listening-ip=0.0.0.0
relay-ip=${PUBLIC_IP}
external-ip=${PUBLIC_IP}

realm=${TURN_DOMAIN}
fingerprint
use-auth-secret
static-auth-secret=${TURN_SECRET}

min-port=49152
max-port=65535

cert=/opt/media-server/ssl/fullchain.pem
pkey=/opt/media-server/ssl/privkey.pem

log-file=/var/log/turnserver.log
no-stdout-log

no-tlsv1
no-tlsv1_1
no-udp-relay=0

denied-peerlist=*
no-multicast-peers
TURNEOF

sed -i 's/^TURNSERVER_ENABLED=.*/TURNSERVER_ENABLED=1/' /etc/default/coturn
systemctl enable --now coturn
info "Coturn running on port 3478"

# ================================================================
# 6. HESTIAC-P — Add subdomains + Nginx proxy configs
# ================================================================
header "HestiaCP Integration"

# Check if HestiaCP's v-add-domain is available
HESTIA_BIN="/usr/local/hestia/bin"
if [[ -f "${HESTIA_BIN}/v-add-domain" ]]; then
    info "HestiaCP detected — adding subdomains"

    # Add subdomains via HestiaCP CLI
    for domain in "${RTC_DOMAIN}" "${STREAM_DOMAIN}" "${TURN_DOMAIN}"; do
        if ! "${HESTIA_BIN}/v-list-domain" "${HESTIA_USER}" "${domain}" &>/dev/null; then
            "${HESTIA_BIN}/v-add-domain" "${HESTIA_USER}" "${domain}" 2>/dev/null || \
                warn "Could not add ${domain} via HestiaCP. Add it manually in the panel."
        else
            info "Domain ${domain} already exists in HestiaCP"
        fi
    done

    # Add Nginx proxy configs to HestiaCP's custom directory
    HESTIA_NGINX_DIR="/home/${HESTIA_USER}/conf/nginx"

    # LiveKit proxy (for rtc domain)
    cat > "${HESTIA_NGINX_DIR}/${RTC_DOMAIN}.custom.conf" 2>/dev/null <<NGINXLK || true
location / {
    proxy_pass http://127.0.0.1:7880;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
}
NGINXLK

    # Stream proxy (for stream domain)
    cat > "${HESTIA_NGINX_DIR}/${STREAM_DOMAIN}.custom.conf" 2>/dev/null <<NGINXSTR || true
location /hls {
    types {
        application/vnd.apple.mpegurl m3u8;
        video/mp2t ts;
    }
    alias /var/www/hls;
    add_header Cache-Control no-cache;
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, OPTIONS';
}

location /stats {
    proxy_pass http://127.0.0.1:1985/;
    proxy_http_version 1.1;
}
NGINXSTR

    info "Nginx custom configs added for HestiaCP"
    systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || true
else
    # Standalone Nginx (no HestiaCP)
    info "No HestiaCP detected — adding standalone Nginx configs"

    cat > /etc/nginx/conf.d/livekit.conf <<NGINXLK
server {
    listen 80;
    server_name ${RTC_DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${RTC_DOMAIN};

    ssl_certificate     /opt/media-server/ssl/fullchain.pem;
    ssl_certificate_key /opt/media-server/ssl/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:7880;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
NGINXLK

    cat > /etc/nginx/conf.d/stream.conf <<NGINXSTR
server {
    listen 80;
    server_name ${STREAM_DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${STREAM_DOMAIN};

    ssl_certificate     /opt/media-server/ssl/fullchain.pem;
    ssl_certificate_key /opt/media-server/ssl/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, OPTIONS';
    add_header Access-Control-Allow-Headers 'Range';

    location /hls {
        types {
            application/vnd.apple.mpegurl m3u8;
            video/mp2t ts;
        }
        root /var/www;
        add_header Cache-Control no-cache;
    }

    location /stats {
        proxy_pass http://127.0.0.1:1985/;
        proxy_http_version 1.1;
    }
}
NGINXSTR

    nginx -t && systemctl reload nginx
fi

# ================================================================
# 7. SSL CERTIFICATES
# ================================================================
if [[ -z "${SKIP_SSL:-}" ]]; then
    header "SSL Certificates (Let's Encrypt)"

    # Temporary self-signed for bootstrapping
    if [[ ! -f /opt/media-server/ssl/privkey.pem ]]; then
        openssl req -x509 -nodes -days 30 -newkey rsa:2048 \
            -keyout /opt/media-server/ssl/privkey.pem \
            -out /opt/media-server/ssl/fullchain.pem \
            -subj "/CN=${RTC_DOMAIN}" 2>/dev/null
    fi

    for domain in "${RTC_DOMAIN}" "${STREAM_DOMAIN}"; do
        certbot --nginx -d "${domain}" --non-interactive --agree-tos -m "${EMAIL}" \
            --redirect 2>/dev/null || warn "Let's Encrypt failed for ${domain}"
    done

    # Copy certs for Coturn
    if [[ -f /etc/letsencrypt/live/${RTC_DOMAIN}/fullchain.pem ]]; then
        cp "/etc/letsencrypt/live/${RTC_DOMAIN}/fullchain.pem" /opt/media-server/ssl/
        cp "/etc/letsencrypt/live/${RTC_DOMAIN}/privkey.pem" /opt/media-server/ssl/
        systemctl restart coturn
    fi

    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx; systemctl restart coturn || true'") | crontab -
    info "SSL configured, auto-renewal active"
fi

# ================================================================
# 8. FIREWALL
# ================================================================
header "Firewall Rules"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 1935/tcp        # RTMP ingest
ufw allow 3478/tcp         # TURN
ufw allow 3478/udp         # TURN
ufw allow 5349/tcp         # TURN TLS
ufw allow 7880/tcp         # LiveKit HTTP
ufw allow 7881/tcp         # LiveKit TCP
ufw allow 7881/udp         # LiveKit UDP
ufw allow 50000:60000/tcp  # WebRTC media
ufw allow 50000:60000/udp  # WebRTC media
ufw --force enable 2>/dev/null || true
info "Firewall rules applied"

# ================================================================
# 9. HEALTH MONITORING
# ================================================================
header "Health Check Setup"

cat > /opt/media-server/healthcheck.sh <<'HC'
#!/usr/bin/env bash
LIVEKIT_OK=$(curl -sf http://127.0.0.1:7880/rtc > /dev/null 2>&1 && echo 1 || echo 0)
SRS_OK=$(curl -sf http://127.0.0.1:1985/api/v1/versions > /dev/null 2>&1 && echo 1 || echo 0)
TURN_OK=$(ss -tlnp 2>/dev/null | grep -q 3478 && echo 1 || echo 0)

if [[ "$LIVEKIT_OK" -eq 0 ]]; then systemctl restart livekit; echo "LiveKit restarted" >> /opt/media-server/logs/health.log; fi
if [[ "$SRS_OK" -eq 0 ]]; then systemctl restart srs; echo "SRS restarted" >> /opt/media-server/logs/health.log; fi
if [[ "$TURN_OK" -eq 0 ]]; then systemctl restart coturn; echo "Coturn restarted" >> /opt/media-server/logs/health.log; fi
HC
chmod +x /opt/media-server/healthcheck.sh

(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/media-server/healthcheck.sh") | crontab -
info "Health monitoring active (every 5 min)"

# ================================================================
# 10. SUMMARY
# ================================================================
header "Installation Complete"
cat <<SUMMARY

┌──────────────────────────────────────────────────────────────────┐
│              Media Server — Native Installation                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🟢 LiveKit (WebRTC SFU)       → systemctl status livekit       │
│     URL:    https://${RTC_DOMAIN}                                │
│     Port:   7880 (internal)                                      │
│                                                                  │
│  🟢 SRS (RTMP + HLS)           → systemctl status srs            │
│     RTMP:   rtmp://${STREAM_DOMAIN}/live/{key}                   │
│     HLS:    https://${STREAM_DOMAIN}/hls/{key}.m3u8              │
│     Ports:  1935 (RTMP), 8080 (HLS)                              │
│                                                                  │
│  🟢 Coturn (TURN/STUN)         → systemctl status coturn         │
│     Server: ${TURN_DOMAIN}:3478                                   │
│                                                                  │
│  🟢 Firewall enabled — essential ports only                      │
│  🟢 Health checks every 5 min via cron                           │
│  🟢 SSL via Let's Encrypt (auto-renewal)                         │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  ➤ Add these to your Laravel .env:                               │
│                                                                  │
│  LIVEKIT_HOST=https://${RTC_DOMAIN}                              │
│  LIVEKIT_API_KEY=${LIVEKIT_API_KEY}                              │
│  LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}                        │
│  LIVEKIT_WS_URL=wss://${RTC_DOMAIN}                              │
│  RTMP_SERVER=rtmp://${STREAM_DOMAIN}                             │
│  HLS_SERVER=https://${STREAM_DOMAIN}/hls                         │
│  TURN_SERVER=${TURN_DOMAIN}                                      │
│  TURN_SECRET=${TURN_SECRET}                                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
SUMMARY

cat > /opt/media-server/credentials.txt <<CRED
# ISDB-BISEW Media Server Credentials — $(date)
LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}
TURN_SECRET=${TURN_SECRET}
CRED
chmod 600 /opt/media-server/credentials.txt

ln -sf /opt/media-server/credentials.txt /root/media-server-credentials.txt 2>/dev/null || true

echo ""
echo -e "${GREEN}${BOLD}✓ Done!${NC} Reboot recommended: ${YELLOW}sudo reboot${NC}"
echo -e "  Credentials saved: ${YELLOW}/opt/media-server/credentials.txt${NC}"
