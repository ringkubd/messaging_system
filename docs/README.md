# Documentation

## Media Server Setup

For live streaming and video/audio calls, see:

- [live-streaming-server-setup.md](live-streaming-server-setup.md) — Comprehensive guide with architecture, manual setup steps, troubleshooting
- [install-media-server.sh](install-media-server.sh) — One-click installer for the media server (HestiaCP-compatible, no Docker)

### Quick Install

```bash
sudo bash install-media-server.sh \
    --rtc-domain rtc.yourdomain.com \
    --stream-domain stream.yourdomain.com \
    --email admin@yourdomain.com \
    --hestia-user admin
```

### What gets installed

| Service | Purpose |
|---------|---------|
| **LiveKit** | WebRTC SFU for 1-on-1 and group audio/video calls |
| **SRS** | RTMP ingest server + HLS transcoding for live streaming |
| **Coturn** | TURN/STUN relay for NAT traversal during WebRTC calls |
