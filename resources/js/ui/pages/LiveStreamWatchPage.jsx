import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SectionState, useApiData, relativeTime } from './common';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
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
        weekday: 'long', month: 'long', day: 'numeric',
        year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

function LiveKitPlayer({ token, wsUrl, isPublisher, onStreamReady }) {
    const videoRef = React.useRef(null);
    const [status, setStatus] = React.useState('connecting');
    const roomRef = React.useRef(null);

    React.useEffect(() => {
        let room = null;
        let mounted = true;

        async function start() {
            const { Room, RoomEvent, VideoPresets } = await import('livekit-client');
            room = new Room({
                adaptiveStream: true,
                dynacast: true,
                videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
            });
            roomRef.current = room;

            room.on(RoomEvent.Disconnected, () => {
                if (mounted) setStatus('disconnected');
            });

            room.on(RoomEvent.MediaDevicesError, () => {
                if (mounted) setStatus('error');
            });

            try {
                await room.connect(wsUrl, token);

                if (isPublisher) {
                    // Streamer: publish camera + mic
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true,
                    });
                    stream.getTracks().forEach(track => {
                        room.localParticipant.publishTrack(track, { simulcast: true });
                    });
                    if (mounted) {
                        setStatus('live');
                        if (onStreamReady) onStreamReady();
                    }
                } else {
                    // Viewer: wait for remote tracks
                    room.on(RoomEvent.TrackSubscribed, (track, participant) => {
                        if (!mounted || !videoRef.current) return;
                        if (track.kind === 'video' || track.kind === 'audio') {
                            const el = track.attach();
                            videoRef.current.innerHTML = '';
                            videoRef.current.appendChild(el);
                            if (mounted) setStatus('playing');
                        }
                    });

                    room.on(RoomEvent.ParticipantDisconnected, () => {
                        if (mounted) setStatus('disconnected');
                    });

                    // If no remote participant after 15s, show waiting
                    setTimeout(() => {
                        if (mounted && room.remoteParticipants.size === 0) {
                            setStatus('waiting');
                        }
                    }, 15000);

                    if (mounted) setStatus('watching');
                }
            } catch (err) {
                console.error('LiveKit error:', err);
                if (mounted) setStatus('error');
            }
        }

        start();

        return () => {
            mounted = false;
            if (room) {
                room.disconnect();
                roomRef.current = null;
            }
        };
    }, [token, wsUrl, isPublisher, onStreamReady]);

    if (status === 'connecting') {
        return (
            <div className="stream-player-placeholder">
                <div className="spinner-wrap"><div className="spinner" /></div>
                <div className="empty-state">
                    <div className="empty-state-text">Connecting...</div>
                </div>
            </div>
        );
    }

    if (status === 'waiting' || status === 'disconnected') {
        return (
            <div className="stream-player-placeholder">
                <div className="empty-state">
                    <div className="empty-state-icon" style={{ fontSize: '2rem' }}>⏳</div>
                    <div className="empty-state-text">Waiting for streamer...</div>
                    <div className="empty-state-sub">The broadcaster hasn't started yet. The video will appear automatically.</div>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="stream-player-placeholder">
                <div className="empty-state">
                    <div className="empty-state-icon">📺</div>
                    <div className="empty-state-text">Stream offline</div>
                    <div className="empty-state-sub">Could not connect to the stream. The broadcaster may have ended the stream.</div>
                </div>
            </div>
        );
    }

    if (isPublisher && status === 'live') {
        return (
            <div className="stream-publishing-indicator">
                <div className="stream-player-wrap" style={{ background: '#000', minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', color: '#22c55e' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 8 }}>🔴</div>
                        <div style={{ fontWeight: 600 }}>You are live</div>
                        <div className="text-sm text-muted">Broadcasting to viewers...</div>
                    </div>
                    <video ref={videoRef} style={{ display: 'none' }} />
                </div>
            </div>
        );
    }

    return (
        <div className="stream-player-wrap" style={{ background: '#000' }}>
            <div ref={videoRef} className="stream-video" style={{ width: '100%', minHeight: 360 }} />
        </div>
    );
}

function GoLiveModal({ stream, onClose }) {
    const toast = useToast();
    const [step, setStep] = React.useState('confirm');
    const [token, setToken] = React.useState(null);
    const [wsUrl, setWsUrl] = React.useState(null);

    async function handleGoLive() {
        setStep('starting');
        try {
            // Start stream on backend
            await window.axios.post(`/api/v1/live-streams/${stream.id}/start`);

            // Get LiveKit token
            const tokenRes = await window.axios.get(`/api/v1/live-streams/${stream.id}/token`);
            setToken(tokenRes.data.token);
            setWsUrl(tokenRes.data.ws_url);
            setStep('live');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to start stream');
            setStep('confirm');
        }
    }

    return (
        <Modal onClose={onClose} title="Go Live" width="560px">
            {step === 'confirm' && (
                <div className="stack-md">
                    <p>Your camera and microphone will be used to broadcast live.</p>
                    <p className="text-sm text-muted">Ensure you have a stable internet connection. Recommended upload speed: 3+ Mbps.</p>
                    <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleGoLive}>
                            Go Live Now
                        </button>
                    </div>
                </div>
            )}
            {step === 'starting' && (
                <div className="stack-md" style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner-wrap"><div className="spinner" /></div>
                    <p>Starting your stream...</p>
                </div>
            )}
            {step === 'live' && (
                <div className="stack-md">
                    <LiveKitPlayer
                        token={token}
                        wsUrl={wsUrl}
                        isPublisher={true}
                    />
                    <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-danger" onClick={async () => {
                            await window.axios.post(`/api/v1/live-streams/${stream.id}/end`);
                            onClose();
                        }}>
                            End Stream
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

export default function LiveStreamWatchPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [showGoLive, setShowGoLive] = React.useState(false);
    const [user, setUser] = React.useState(null);
    const [token, setToken] = React.useState(null);
    const [wsUrl, setWsUrl] = React.useState(null);

    const { loading, error, data: stream, unauthorized, reload } = useApiData(`/api/v1/live-streams/${id}`);

    React.useEffect(() => {
        async function fetchUser() {
            try {
                const res = await window.axios.get('/api/v1/me');
                setUser(res.data);
            } catch {}
        }
        fetchUser();
    }, []);

    const isStreamer = user && stream && user.id === stream.created_by;

    // Auto-fetch LiveKit token for viewers when stream is live
    React.useEffect(() => {
        if (!stream || stream.status !== 'live') return;
        // Fetch viewer token
        window.axios.get(`/api/v1/live-streams/${stream.id}/token?mode=subscribe`)
            .then(res => {
                setToken(res.data.token);
                setWsUrl(res.data.ws_url);
            })
            .catch(() => {});
    }, [stream]);

    const [pollStatus, setPollStatus] = React.useState(null);
    React.useEffect(() => {
        if (!stream || stream.status !== 'live') return;
        const interval = setInterval(async () => {
            try {
                const res = await window.axios.get(`/api/v1/live-streams/${stream.id}/status`);
                setPollStatus(res.data);
                if (res.data.status === 'ended') reload();
            } catch {}
        }, 15000);
        return () => clearInterval(interval);
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
                <div className="stream-player-section">
                    {currentStatus === 'live' && token && wsUrl && (
                        <LiveKitPlayer token={token} wsUrl={wsUrl} isPublisher={false} />
                    )}
                    {currentStatus === 'live' && !token && (
                        <div className="stream-player-placeholder">
                            <div className="spinner-wrap"><div className="spinner" /></div>
                            <div className="empty-state-text">Connecting to stream...</div>
                        </div>
                    )}
                    {currentStatus === 'ended' && (
                        <div className="stream-ended-message">
                            <div className="empty-state">
                                <div className="empty-state-icon">📺</div>
                                <div className="empty-state-text">This stream has ended</div>
                                {stream.ended_at && (
                                    <div className="empty-state-sub">Ended {relativeTime(stream.ended_at)}</div>
                                )}
                            </div>
                        </div>
                    )}
                    {currentStatus === 'scheduled' && (
                        <div className="stream-scheduled-message">
                            <div className="empty-state">
                                <div className="empty-state-icon">📅</div>
                                <div className="empty-state-text">Stream Scheduled</div>
                                {stream.scheduled_at && (
                                    <div className="empty-state-sub">Starts {formatDate(stream.scheduled_at)}</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="stream-info-section">
                    <div className="stream-info-badges">
                        <Badge variant={STATUS_VARIANTS[currentStatus] || 'default'}>
                            {currentStatus === 'live' && <span className="live-dot" style={{ marginRight: 4 }} />}
                            {currentStatus === 'live' ? 'LIVE' : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                        </Badge>
                        {stream.event && <Badge variant="default">{stream.event.title}</Badge>}
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
                    </div>

                    {stream.description && (
                        <Card><p style={{ whiteSpace: 'pre-wrap' }}>{stream.description}</p></Card>
                    )}

                    <div className="stream-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" onClick={() => navigate('/live-streams')} type="button">
                            ← Back to Streams
                        </button>

                        {isStreamer && currentStatus === 'scheduled' && (
                            <button className="btn btn-primary" onClick={() => setShowGoLive(true)} type="button">
                                Go Live
                            </button>
                        )}
                        {isStreamer && currentStatus === 'live' && (
                            <button className="btn btn-danger" onClick={async () => {
                                await window.axios.post(`/api/v1/live-streams/${id}/end`);
                                toast.success('Stream ended');
                                reload();
                            }} type="button">
                                End Stream
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showGoLive && (
                <GoLiveModal
                    stream={stream}
                    onClose={() => { setShowGoLive(false); reload(); }}
                />
            )}
        </div>
    );
}
