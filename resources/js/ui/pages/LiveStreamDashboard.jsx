import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SectionState, useApiData, relativeTime } from './common';
import Badge from '../components/Badge';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
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
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function StreamRow({ stream, onCopy, onStart, onEnd, actionBusy, actionId }) {
    return (
        <tr>
            <td><strong>{stream.title}</strong></td>
            <td>
                <Badge variant={STATUS_VARIANTS[stream.status] || 'default'}>
                    {stream.status === 'live' && <span className="live-dot" style={{ marginRight: 4 }} />}
                    {stream.status === 'live' ? 'LIVE' : stream.status.charAt(0).toUpperCase() + stream.status.slice(1)}
                </Badge>
            </td>
            <td className="text-sm text-muted">
                {stream.scheduled_at ? formatDate(stream.scheduled_at) : '-'}
            </td>
            <td className="text-sm text-muted">
                {stream.started_at ? formatDate(stream.started_at) : '-'}
            </td>
            <td className="text-sm text-muted">
                {stream.ended_at ? formatDate(stream.ended_at) : '-'}
            </td>
            <td>
                <div className="admin-actions">
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => onCopy(stream.stream_key)}
                        type="button"
                    >
                        Copy Key
                    </button>
                    {stream.status === 'scheduled' && (
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onStart(stream.id)}
                            disabled={actionBusy}
                            type="button"
                        >
                            {actionBusy && actionId === stream.id ? '...' : 'Start'}
                        </button>
                    )}
                    {stream.status === 'live' && (
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={() => onEnd(stream.id)}
                            disabled={actionBusy}
                            type="button"
                        >
                            {actionBusy && actionId === stream.id ? '...' : 'End'}
                        </button>
                    )}
                    <Link className="btn btn-ghost btn-sm" to={`/live-streams/${stream.id}`}>
                        View
                    </Link>
                </div>
            </td>
        </tr>
    );
}

export default function LiveStreamDashboard() {
    const navigate = useNavigate();
    const toast = useToast();
    const [actionBusy, setActionBusy] = React.useState(false);
    const [actionId, setActionId] = React.useState(null);
    const [createModal, setCreateModal] = React.useState(false);
    const [form, setForm] = React.useState({ title: '', description: '', scheduled_at: '', max_viewers: '', event_id: '' });
    const [busy, setBusy] = React.useState(false);

    const {
        loading,
        error,
        data,
        unauthorized,
        reload,
        update,
    } = useApiData('/api/v1/my/streams');

    const eventsHook = useApiData('/api/v1/events?per_page=100');
    const events = Array.isArray(eventsHook.data) ? eventsHook.data : [];

    const streams = Array.isArray(data) ? data : [];

    function resetForm() {
        setForm({ title: '', description: '', scheduled_at: '', max_viewers: '', event_id: '' });
    }

    async function copyKey(key) {
        try {
            await navigator.clipboard.writeText(key);
            toast.success('Stream key copied!');
        } catch {
            toast.error('Could not copy.');
        }
    }

    async function handleStart(streamId) {
        setActionId(streamId);
        setActionBusy(true);
        try {
            await window.axios.post(`/api/v1/live-streams/${streamId}/start`);
            update(streamId, { status: 'live', started_at: new Date().toISOString() });
            toast.success('Stream started!');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not start.');
        } finally {
            setActionBusy(false);
            setActionId(null);
        }
    }

    async function handleEnd(streamId) {
        setActionId(streamId);
        setActionBusy(true);
        try {
            await window.axios.post(`/api/v1/live-streams/${streamId}/end`);
            update(streamId, { status: 'ended', ended_at: new Date().toISOString() });
            toast.success('Stream ended.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not end.');
        } finally {
            setActionBusy(false);
            setActionId(null);
        }
    }

    async function handleCreate() {
        if (!form.title.trim()) return;
        setBusy(true);
        try {
            const payload = { title: form.title, description: form.description };
            if (form.scheduled_at) payload.scheduled_at = form.scheduled_at;
            if (form.max_viewers) payload.max_viewers = parseInt(form.max_viewers, 10);
            if (form.event_id) payload.event_id = parseInt(form.event_id, 10);
            const res = await window.axios.post('/api/v1/live-streams', payload);
            toast.success('Stream created!');
            setCreateModal(false);
            resetForm();
            reload();
            navigate(`/live-streams/${res.data.id}`);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not create stream.');
        } finally {
            setBusy(false);
        }
    }

    if (loading || error || unauthorized) {
        return (
            <div className="stream-dashboard-page">
                <SectionState loading={loading} error={error} unauthorized={unauthorized} emptyLabel="" />
            </div>
        );
    }

    return (
        <div className="stream-dashboard-page">
            <div className="page-header">
                <div>
                    <h1>My Streams</h1>
                    <p>Manage your live streams and broadcasting settings.</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setCreateModal(true); }} type="button">
                    New Stream
                </button>
            </div>

            {streams.length === 0 ? (
                <EmptyState icon="📺" sub="Create your first live stream to get started.">
                    No streams yet
                </EmptyState>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Scheduled</th>
                                <th>Started</th>
                                <th>Ended</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {streams.map((stream) => (
                                <StreamRow
                                    key={stream.id}
                                    stream={stream}
                                    onCopy={copyKey}
                                    onStart={handleStart}
                                    onEnd={handleEnd}
                                    actionBusy={actionBusy}
                                    actionId={actionId}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {createModal && (
                <Modal title="Create New Stream" onClose={() => { setCreateModal(false); resetForm(); }}
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
                    <div className="form-group">
                        <label className="form-label">Link to Event (optional)</label>
                        <select className="form-input" value={form.event_id}
                            onChange={(e) => setForm((p) => ({ ...p, event_id: e.target.value }))}>
                            <option value="">None</option>
                            {events.map((ev) => (
                                <option key={ev.id} value={ev.id}>{ev.title}</option>
                            ))}
                        </select>
                    </div>
                </Modal>
            )}
        </div>
    );
}
