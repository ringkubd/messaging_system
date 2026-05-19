import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SectionState, useApiData, relativeTime } from './common';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import { useToast } from '../components/Toast';

const STATUS_VARIANTS = {
    scheduled: 'student',
    live: 'danger',
    ended: 'admin',
    archived: 'default',
};

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function HlsPlayer({ hlsUrl, poster }) {
    const videoRef = React.useRef(null);
    const [playerError, setPlayerError] = React.useState(false);

    React.useEffect(() => {
        let hls = null;
        const video = videoRef.current;
        if (!video) return;

        async function initPlayer() {
            try {
                const Hls = (await import('hls.js')).default;
                if (Hls.isSupported()) {
                    hls = new Hls();
                    hls.loadSource(hlsUrl);
                    hls.attachMedia(video);
                    hls.on(Hls.Events.ERROR, (event, data) => {
                        if (data.fatal) {
                            setPlayerError(true);
                        }
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = hlsUrl;
                } else {
                    setPlayerError(true);
                }
            } catch {
                setPlayerError(true);
            }
        }

        initPlayer();

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [hlsUrl]);

    if (playerError) {
        return (
            <div className="stream-player-placeholder">
                <div className="empty-state">
                    <div className="empty-state-icon">📺</div>
                    <div className="empty-state-text">Player unavailable</div>
                    <div className="empty-state-sub">Try opening the stream URL directly in a video player.</div>
                </div>
                <div className="stream-direct-link">
                    <a href={hlsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                        Open HLS URL
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="stream-player-wrap">
            <video
                ref={videoRef}
                className="stream-video"
                controls
                poster={poster}
                autoPlay
                playsInline
            />
        </div>
    );
}

function StreamerPanel({ stream, onStart, onEnd, actionBusy }) {
    const [copied, setCopied] = React.useState(false);

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard may not be available */
        }
    }

    return (
        <Card className="streamer-panel">
            <div className="card-header">
                <span className="card-title">Streamer Controls</span>
            </div>
            <div className="stack-sm">
                <div className="form-group">
                    <label className="form-label">Stream Key</label>
                    <div className="stream-copy-row">
                        <code className="stream-key-text">{stream.stream_key}</code>
                        <button className="btn btn-ghost btn-sm" onClick={() => copyToClipboard(stream.stream_key)} type="button">
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">RTMP URL</label>
                    <div className="stream-copy-row">
                        <code className="stream-key-text">{stream.rtmp_url}</code>
                        <button className="btn btn-ghost btn-sm" onClick={() => copyToClipboard(stream.rtmp_url)} type="button">
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">HLS URL</label>
                    <div className="stream-copy-row">
                        <code className="stream-key-text">{stream.hls_url}</code>
                        <button className="btn btn-ghost btn-sm" onClick={() => copyToClipboard(stream.hls_url)} type="button">
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                <div className="obs-instructions">
                    <p className="text-sm" style={{ fontWeight: 600, marginBottom: 4 }}>OBS Configuration:</p>
                    <ul className="text-sm text-muted" style={{ margin: 0, paddingLeft: '1.25rem' }}>
                        <li>Open OBS Studio</li>
                        <li>Go to Settings → Stream</li>
                        <li>Service: Custom...</li>
                        <li>Server: <code className="font-mono">{stream.rtmp_url}</code></li>
                        <li>Stream Key: <code className="font-mono">{stream.stream_key}</code></li>
                        <li>Click Apply &amp; Start Streaming</li>
                    </ul>
                </div>

                <div className="stream-actions" style={{ marginTop: '0.5rem' }}>
                    {stream.status === 'scheduled' && (
                        <button
                            className="btn btn-primary"
                            onClick={onStart}
                            disabled={actionBusy}
                            type="button"
                        >
                            {actionBusy ? 'Starting...' : 'Start Stream'}
                        </button>
                    )}
                    {stream.status === 'live' && (
                        <button
                            className="btn btn-danger"
                            onClick={onEnd}
                            disabled={actionBusy}
                            type="button"
                        >
                            {actionBusy ? 'Ending...' : 'End Stream'}
                        </button>
                    )}
                </div>
            </div>
        </Card>
    );
}

function CountdownTimer({ targetDate }) {
    const [remaining, setRemaining] = React.useState('');

    React.useEffect(() => {
        function tick() {
            const diff = new Date(targetDate) - new Date();
            if (diff <= 0) {
                setRemaining('Starting soon...');
                return;
            }
            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const parts = [];
            if (days > 0) parts.push(`${days}d`);
            if (hours > 0) parts.push(`${hours}h`);
            parts.push(`${minutes}m`);
            setRemaining(parts.join(' '));
        }
        tick();
        const id = setInterval(tick, 60000);
        return () => clearInterval(id);
    }, [targetDate]);

    return <span>{remaining}</span>;
}

export default function LiveStreamWatchPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [actionBusy, setActionBusy] = React.useState(false);
    const [user, setUser] = React.useState(null);

    const {
        loading,
        error,
        data: stream,
        unauthorized,
        reload,
    } = useApiData(`/api/v1/live-streams/${id}`);

    React.useEffect(() => {
        async function fetchUser() {
            try {
                const res = await window.axios.get('/api/v1/me');
                setUser(res.data);
            } catch {
                /* not authenticated */
            }
        }
        fetchUser();
    }, []);

    const isStreamer = user && stream && user.id === stream.created_by;

    async function handleStart() {
        setActionBusy(true);
        try {
            await window.axios.post(`/api/v1/live-streams/${id}/start`);
            toast.success('Stream is now live!');
            reload();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not start stream.');
        } finally {
            setActionBusy(false);
        }
    }

    async function handleEnd() {
        setActionBusy(true);
        try {
            await window.axios.post(`/api/v1/live-streams/${id}/end`);
            toast.success('Stream ended.');
            reload();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not end stream.');
        } finally {
            setActionBusy(false);
        }
    }

    const [pollStatus, setPollStatus] = React.useState(null);

    React.useEffect(() => {
        if (!stream || stream.status !== 'live') return;
        const id = setInterval(async () => {
            try {
                const res = await window.axios.get(`/api/v1/live-streams/${stream.id}/status`);
                setPollStatus(res.data);
                if (res.data.status === 'ended') {
                    reload();
                }
            } catch {
                /* ignore polling errors */
            }
        }, 10000);
        return () => clearInterval(id);
    }, [stream, reload]);

    if (loading || error || unauthorized) {
        return (
            <div className="stream-detail-page">
                <SectionState loading={loading} error={error} unauthorized={unauthorized} emptyLabel="" />
            </div>
        );
    }

    if (!stream) {
        return (
            <div className="stream-detail-page">
                <div className="empty-state">
                    <div className="empty-state-icon">📺</div>
                    <div className="empty-state-text">Stream not found.</div>
                </div>
            </div>
        );
    }

    const currentStatus = pollStatus?.status || stream.status;

    return (
        <div className="stream-detail-page">
            <div className="stream-detail-header">
                {currentStatus === 'live' && (
                    <div className="stream-player-section">
                        <HlsPlayer hlsUrl={stream.hls_url} poster={stream.thumbnail_url} />
                    </div>
                )}
                {currentStatus === 'ended' && (
                    <div className="stream-ended-message">
                        <div className="empty-state">
                            <div className="empty-state-icon">📺</div>
                            <div className="empty-state-text">This stream has ended</div>
                            {stream.ended_at && (
                                <div className="empty-state-sub">
                                    Ended {relativeTime(stream.ended_at)}
                                </div>
                            )}
                        </div>
                        {stream.thumbnail_url && (
                            <div className="stream-thumbnail-preview">
                                <img src={stream.thumbnail_url} alt={stream.title} />
                            </div>
                        )}
                    </div>
                )}
                {currentStatus === 'scheduled' && (
                    <div className="stream-scheduled-message">
                        <div className="empty-state">
                            <div className="empty-state-icon">📅</div>
                            <div className="empty-state-text">Stream Scheduled</div>
                            {stream.scheduled_at && (
                                <div className="empty-state-sub">
                                    Starts {formatDate(stream.scheduled_at)}
                                    <br />
                                    <strong>
                                        <CountdownTimer targetDate={stream.scheduled_at} />
                                    </strong>
                                </div>
                            )}
                        </div>
                        {stream.thumbnail_url && (
                            <div className="stream-thumbnail-preview">
                                <img src={stream.thumbnail_url} alt={stream.title} />
                            </div>
                        )}
                    </div>
                )}

                <div className="stream-info-section">
                    <div className="stream-info-badges">
                        <Badge variant={STATUS_VARIANTS[currentStatus] || 'default'}>
                            {currentStatus === 'live' && <span className="live-dot" style={{ marginRight: 4 }} />}
                            {currentStatus === 'live' ? 'LIVE' : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                        </Badge>
                        {stream.event && (
                            <Badge variant="default">{stream.event.title}</Badge>
                        )}
                    </div>
                    <h1>{stream.title}</h1>

                    <div className="stream-meta">
                        {stream.creator && (
                            <div className="stream-meta-item">
                                <span className="stream-meta-label">Streamer</span>
                                <span>{stream.creator.name}</span>
                            </div>
                        )}
                        {stream.scheduled_at && (
                            <div className="stream-meta-item">
                                <span className="stream-meta-label">Scheduled</span>
                                <span>{formatDate(stream.scheduled_at)}</span>
                            </div>
                        )}
                        {stream.started_at && (
                            <div className="stream-meta-item">
                                <span className="stream-meta-label">Started</span>
                                <span>{relativeTime(stream.started_at)}</span>
                            </div>
                        )}
                        {stream.max_viewers && (
                            <div className="stream-meta-item">
                                <span className="stream-meta-label">Max Viewers</span>
                                <span>{stream.max_viewers}</span>
                            </div>
                        )}
                    </div>

                    {stream.description && (
                        <Card>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{stream.description}</p>
                        </Card>
                    )}

                    <div className="stream-actions" style={{ marginTop: '1rem' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate('/live-streams')}
                            type="button"
                        >
                            ← Back to Streams
                        </button>
                    </div>

                    {isStreamer && (
                        <StreamerPanel
                            stream={stream}
                            onStart={handleStart}
                            onEnd={handleEnd}
                            actionBusy={actionBusy}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
