import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SectionState, useApiData, relativeTime } from './common';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Tabs from '../components/Tabs';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

const STATUS_TABS = [
    { key: '', label: 'Live Now' },
    { key: 'scheduled', label: 'Upcoming' },
    { key: 'ended', label: 'Ended' },
];

const STATUS_VARIANTS = {
    scheduled: 'student',
    live: 'danger',
    ended: 'admin',
    archived: 'default',
};

const STATUS_LABELS = {
    scheduled: 'Scheduled',
    live: 'LIVE',
    ended: 'Ended',
    archived: 'Archived',
};

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function LiveStreamCard({ stream }) {
    const isLive = stream.status === 'live';

    return (
        <Card hover>
            {stream.thumbnail_url && (
                <div className="event-card-image" style={{ position: 'relative' }}>
                    <img src={stream.thumbnail_url} alt={stream.title} />
                    {isLive && (
                        <div className="live-badge-overlay">
                            <span className="live-dot" />
                            LIVE
                        </div>
                    )}
                </div>
            )}
            <div className="event-card-body">
                <div className="event-card-header">
                    <Badge variant={STATUS_VARIANTS[stream.status] || 'default'}>
                        {isLive && <span className="live-dot" style={{ marginRight: 4 }} />}
                        {STATUS_LABELS[stream.status] || stream.status}
                    </Badge>
                </div>
                <h3 className="event-card-title">{stream.title}</h3>
                <div className="event-card-meta">
                    {stream.scheduled_at && (
                        <span>
                            {stream.status === 'ended' && stream.ended_at
                                ? 'Ended ' + relativeTime(stream.ended_at)
                                : stream.status === 'live' && stream.started_at
                                    ? 'Started ' + relativeTime(stream.started_at)
                                    : formatDate(stream.scheduled_at)}
                        </span>
                    )}
                </div>
                <p className="event-card-description">
                    {stream.description?.length > 150
                        ? stream.description.slice(0, 150) + '...'
                        : stream.description}
                </p>
                <div className="event-card-footer">
                    <span className="text-muted text-sm">
                        {stream.creator?.name || 'Unknown'}
                    </span>
                    <Link className="btn btn-primary btn-sm" to={`/live-streams/${stream.id}`}>
                        {isLive ? 'Watch Live' : stream.status === 'ended' ? 'Replay' : 'Details'}
                    </Link>
                </div>
            </div>
        </Card>
    );
}

export default function LiveStreamsPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [statusTab, setStatusTab] = React.useState('');
    const [createModal, setCreateModal] = React.useState(false);
    const [form, setForm] = React.useState({ title: '', description: '', scheduled_at: '', max_viewers: '' });
    const [busy, setBusy] = React.useState(false);

    const statusParam = statusTab ? `&status=${encodeURIComponent(statusTab)}` : '';
    const {
        loading,
        error,
        data,
        unauthorized,
        reload,
    } = useApiData(`/api/v1/live-streams?${statusParam}`);

    const streams = Array.isArray(data) ? data : [];

    function resetForm() {
        setForm({ title: '', description: '', scheduled_at: '', max_viewers: '' });
    }

    async function handleCreate() {
        if (!form.title.trim()) return;
        setBusy(true);
        try {
            const payload = { title: form.title, description: form.description };
            if (form.scheduled_at) payload.scheduled_at = form.scheduled_at;
            if (form.max_viewers) payload.max_viewers = parseInt(form.max_viewers, 10);
            const res = await window.axios.post('/api/v1/live-streams', payload);
            toast.success('Stream created!');
            setCreateModal(false);
            resetForm();
            navigate(`/live-streams/${res.data.id}`);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not create stream.');
        } finally {
            setBusy(false);
        }
    }

    const liveStreams = streams.filter((s) => s.status === 'live');
    const nonLiveStreams = streams.filter((s) => s.status !== 'live');

    return (
        <div className="live-streams-page">
            <div className="page-header">
                <div>
                    <h1>Live Streams</h1>
                    <p>Watch live events, webinars, and community streams.</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setCreateModal(true); }} type="button">
                    Go Live
                </button>
            </div>

            <Tabs tabs={STATUS_TABS} active={statusTab} onChange={setStatusTab} />

            {loading || error || unauthorized ? (
                <SectionState loading={loading} error={error} unauthorized={unauthorized} emptyLabel="" />
            ) : streams.length === 0 ? (
                <EmptyState icon="📺" sub="No streams found in this category.">
                    No streams
                </EmptyState>
            ) : (
                <div>
                    {!statusTab && liveStreams.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 className="section-title" style={{ marginBottom: '0.75rem' }}>
                                <span className="live-dot" style={{ marginRight: 6 }} />
                                Live Now
                            </h3>
                            <div className="events-grid">
                                {liveStreams.map((stream) => (
                                    <LiveStreamCard key={stream.id} stream={stream} />
                                ))}
                            </div>
                        </div>
                    )}
                    {nonLiveStreams.length > 0 && (
                        <div className="events-grid">
                            {nonLiveStreams.map((stream) => (
                                <LiveStreamCard key={stream.id} stream={stream} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {createModal && (
                <Modal title="Create a Live Stream" onClose={() => { setCreateModal(false); resetForm(); }}
                    footer={[
                        <button key="cancel" className="btn btn-secondary" onClick={() => { setCreateModal(false); resetForm(); }}>Cancel</button>,
                        <button key="create" className="btn btn-primary" disabled={busy || !form.title.trim()} onClick={handleCreate}>
                            {busy ? 'Creating...' : 'Create Stream'}
                        </button>,
                    ]}>
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input className="form-input" type="text" value={form.title}
                            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                            placeholder="e.g. Web Development Workshop" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description (optional)</label>
                        <textarea className="form-input" value={form.description}
                            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                            rows={3} placeholder="Tell viewers what this stream is about..." />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Schedule (optional)</label>
                        <input className="form-input" type="datetime-local" value={form.scheduled_at}
                            onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Max Viewers (optional)</label>
                        <input className="form-input" type="number" value={form.max_viewers}
                            onChange={(e) => setForm((p) => ({ ...p, max_viewers: e.target.value }))}
                            min={0} placeholder="Leave empty for unlimited" />
                    </div>
                </Modal>
            )}
        </div>
    );
}
