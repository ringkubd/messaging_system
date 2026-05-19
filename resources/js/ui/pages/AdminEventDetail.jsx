import React from 'react';
import { useApiData } from './common';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';

const STATUS_VARIANTS = {
    published: 'default',
    draft: 'student',
    cancelled: 'danger',
    completed: 'admin',
};

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

function formatDateShort(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

export default function AdminEventDetail({ event, onBack }) {
    const toast = useToast();
    const [qrValue, setQrValue] = React.useState('');
    const [checkinBusy, setCheckinBusy] = React.useState(false);
    const [batchFilter, setBatchFilter] = React.useState('');
    const [roundFilter, setRoundFilter] = React.useState('');

    const params = new URLSearchParams();
    if (batchFilter) params.set('batch', batchFilter);
    if (roundFilter) params.set('round', roundFilter);
    const qs = params.toString();

    const {
        loading,
        error,
        data: report,
        unauthorized,
        reload,
    } = useApiData(`/api/v1/admin/events/${event.id}/attendance-report${qs ? `?${qs}` : ''}`);

    async function handleCheckin() {
        if (!qrValue.trim()) return;
        setCheckinBusy(true);
        try {
            await window.axios.post(`/api/v1/admin/events/${event.id}/checkin`, { qr_code: qrValue.trim() });
            toast.success('Check-in successful.');
            setQrValue('');
            reload();
        } catch (err) {
            const msg = err?.response?.data?.message || 'Check-in failed.';
            toast.error(msg);
        } finally {
            setCheckinBusy(false);
        }
    }

    const attended = report?.total_attended ?? 0;
    const registered = report?.total_registered ?? 0;
    const rate = report?.attendance_rate ?? 0;
    const attendees = Array.isArray(report?.attendees) ? report.attendees : [];

    return (
        <div>
            <div className="flex flex-center gap-4" style={{ marginBottom: '1rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={onBack} type="button">
                    &larr; Back to Events
                </button>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{event.title}</h2>
                <Badge variant={STATUS_VARIANTS[event.status] || 'default'}>{event.status}</Badge>
            </div>

            <div className="grid-4" style={{ marginBottom: '1rem' }}>
                <div className="admin-metric-card">
                    <div className="admin-metric-value">{registered}</div>
                    <div className="admin-metric-label">Total Registered</div>
                </div>
                <div className="admin-metric-card">
                    <div className="admin-metric-value">{attended}</div>
                    <div className="admin-metric-label">Attended</div>
                </div>
                <div className="admin-metric-card">
                    <div className="admin-metric-value">{rate}%</div>
                    <div className="admin-metric-label">Attendance Rate</div>
                </div>
                <div className="admin-metric-card">
                    <div className="admin-metric-value">
                        {event.event_type?.replace('_', ' ')}
                    </div>
                    <div className="admin-metric-label">{formatDateShort(event.start_date)}</div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="card-header">
                    <div className="card-title">QR Check-in</div>
                </div>
                <div className="flex flex-center gap-2">
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <input
                            className="form-input"
                            type="text"
                            value={qrValue}
                            onChange={(e) => setQrValue(e.target.value)}
                            placeholder="Paste or type QR code token here..."
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCheckin(); }}
                        />
                    </div>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleCheckin}
                        disabled={checkinBusy || !qrValue.trim()}
                        type="button"
                    >
                        {checkinBusy ? 'Checking...' : 'Check In'}
                    </button>
                </div>
            </div>

            <div className="admin-action-bar">
                <div className="form-group">
                    <input
                        className="form-input"
                        type="text"
                        placeholder="Filter by batch"
                        value={batchFilter}
                        onChange={(e) => setBatchFilter(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <input
                        className="form-input"
                        type="text"
                        placeholder="Filter by round"
                        value={roundFilter}
                        onChange={(e) => setRoundFilter(e.target.value)}
                    />
                </div>
                <button className="btn btn-ghost btn-sm" onClick={reload} type="button">
                    Reload
                </button>
            </div>

            {loading ? (
                <Spinner />
            ) : error || unauthorized ? (
                <EmptyState icon="⚠️">{error || (unauthorized ? 'Admin access required.' : '')}</EmptyState>
            ) : attendees.length === 0 ? (
                <EmptyState icon="📋" sub="No one has registered for this event yet.">No registrations</EmptyState>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Batch</th>
                                <th>Round</th>
                                <th>Status</th>
                                <th>Check-in</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendees.map((reg) => (
                                <tr key={reg.id}>
                                    <td><strong>{reg.user?.name || 'Unknown'}</strong></td>
                                    <td className="text-muted font-mono text-xs">{reg.user?.email || '-'}</td>
                                    <td className="text-sm">{reg.user?.batch || '-'}</td>
                                    <td className="text-sm">{reg.user?.round || '-'}</td>
                                    <td>
                                        <Badge variant={reg.status === 'attended' ? 'active' : reg.status === 'cancelled' ? 'suspended' : 'pending'}>
                                            {reg.status}
                                        </Badge>
                                    </td>
                                    <td className="text-sm text-muted">
                                        {reg.checked_in_at ? formatDate(reg.checked_in_at) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
