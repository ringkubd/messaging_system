import React from 'react';
import { useApiData } from './common';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

function formatDateShort(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatCard({ value, label }) {
    return (
        <div className="admin-metric-card">
            <div className="admin-metric-value">{value ?? '-'}</div>
            <div className="admin-metric-label">{label}</div>
        </div>
    );
}

export default function AdminAttendance() {
    const { loading, error, data, unauthorized } = useApiData('/api/v1/admin/attendance/stats');
    const s = data || {};

    if (loading) return <Spinner />;
    if (error) return <EmptyState icon="⚠️">{error}</EmptyState>;
    if (unauthorized) return <EmptyState icon="🔒">Admin access required.</EmptyState>;

    const topEvents = Array.isArray(s.top_events) ? s.top_events : [];
    const byBatch = Array.isArray(s.by_batch) ? s.by_batch : [];
    const maxBatchCount = byBatch.length > 0 ? Math.max(...byBatch.map((b) => b.total)) : 0;

    return (
        <div>
            <div className="admin-metrics">
                <StatCard value={s.total_events} label="Total Events Held" />
                <StatCard value={s.total_registrations} label="Total Registrations" />
                <StatCard value={s.total_attendance} label="Total Attendance" />
                <StatCard value={`${s.attendance_rate ?? 0}%`} label="Attendance Rate" />
            </div>

            <div className="grid-2">
                <div className="card">
                    <div className="card-title" style={{ marginBottom: '0.75rem' }}>Top 5 Events by Attendance</div>
                    {topEvents.length === 0 ? (
                        <div className="text-muted text-sm">No event data yet.</div>
                    ) : (
                        <div className="stack">
                            {topEvents.map((ev, i) => {
                                const maxCount = topEvents[0]?.attended_count || 1;
                                const pct = Math.max(2, (ev.attended_count / maxCount) * 100);
                                return (
                                    <div key={ev.id}>
                                        <div className="flex flex-center flex-between" style={{ marginBottom: '0.25rem' }}>
                                            <span className="text-sm font-mono" style={{ fontWeight: 600 }}>
                                                {i + 1}. {ev.title}
                                            </span>
                                            <span className="text-sm text-muted">
                                                {ev.attended_count} attended
                                            </span>
                                        </div>
                                        <div style={{
                                            height: 8,
                                            background: 'var(--border-light)',
                                            borderRadius: 4,
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                width: `${pct}%`,
                                                height: '100%',
                                                background: 'var(--primary)',
                                                borderRadius: 4,
                                                transition: 'width 300ms ease',
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="card">
                    <div className="card-title" style={{ marginBottom: '0.75rem' }}>Attendance by Batch</div>
                    {byBatch.length === 0 ? (
                        <div className="text-muted text-sm">No batch data yet.</div>
                    ) : (
                        <div className="stack">
                            {byBatch.map((b) => {
                                const pct = maxBatchCount > 0 ? Math.max(2, (b.total / maxBatchCount) * 100) : 2;
                                return (
                                    <div key={b.batch}>
                                        <div className="flex flex-center flex-between" style={{ marginBottom: '0.25rem' }}>
                                            <span className="text-sm font-mono" style={{ fontWeight: 600 }}>
                                                Batch {b.batch}
                                            </span>
                                            <span className="text-sm text-muted">{b.total}</span>
                                        </div>
                                        <div style={{
                                            height: 8,
                                            background: 'var(--border-light)',
                                            borderRadius: 4,
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                width: `${pct}%`,
                                                height: '100%',
                                                background: 'var(--accent)',
                                                borderRadius: 4,
                                                transition: 'width 300ms ease',
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
