import React from 'react';
import { useApiData, relativeTime } from './common';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Tabs from '../components/Tabs';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import SearchInput from '../components/SearchInput';
import Pagination from '../components/Pagination';
import { useToast } from '../components/Toast';
import AdminEventDetail from './AdminEventDetail';
import AdminAttendance from './AdminAttendance';

const ADMIN_TABS = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'events', label: 'Events' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'placements', label: 'Placements' },
    { key: 'moderation', label: 'Moderation' },
    { key: 'reports', label: 'Reports' },
    { key: 'users', label: 'Users' },
    { key: 'announcements', label: 'Announcements' },
    { key: 'stories', label: 'Success Stories' },
    { key: 'skill-gaps', label: 'Skill Gaps' },
    { key: 'audit', label: 'Audit Log' },
];

function AdminDashboard() {
    const [state, setState] = React.useState({ loading: true, error: null, data: null });
    const [chartData, setChartData] = React.useState([]);
    const [chartLoading, setChartLoading] = React.useState(true);

    React.useEffect(() => {
        let cancelled = false;
        async function run() {
            try {
                const res = await window.axios.get('/api/v1/admin/dashboard');
                if (!cancelled) setState({ loading: false, error: null, data: res.data });
            } catch (err) {
                if (!cancelled) setState({ loading: false, error: 'Could not load dashboard.', data: null });
            }
        }
        run();
        return () => { cancelled = true; };
    }, []);

    React.useEffect(() => {
        let cancelled = false;
        async function run() {
            try {
                const res = await window.axios.get('/api/v1/admin/dashboard/charts');
                if (!cancelled) setChartData(res.data);
            } catch (e) {
                if (!cancelled) setChartData([]);
            } finally {
                if (!cancelled) setChartLoading(false);
            }
        }
        run();
        return () => { cancelled = true; };
    }, []);

    if (state.loading) return <Spinner />;
    if (state.error) return <EmptyState icon="⚠️">{state.error}</EmptyState>;

    const d = state.data || {};
    const users = d.users || {};
    const engagement = d.engagement || {};
    const events = d.events || {};
    const scholarships = d.scholarships || {};
    const recentActivity = d.recent_activity || [];
    const activity = chartData.length > 0 ? chartData : (d.activity || []);
    const maxVal = activity.reduce((max, item) => Math.max(max, item.posts, item.comments, item.registrations), 0) || 1;

    const roleColors = { super_admin: 'admin', moderator: 'admin', user: 'student', alumni: 'alumni' };

    return (
        <div>
            <div className="admin-metrics">
                <div className="admin-metric-card">
                    <div className="stat-card-icon">👥</div>
                    <div className="admin-metric-value">{users.total ?? '-'}</div>
                    <div className="admin-metric-label">Total Users</div>
                    <div className="admin-metric-trend">{users.new_today > 0 ? `+${users.new_today} today` : 'No new today'}</div>
                </div>
                <div className="admin-metric-card">
                    <div className="stat-card-icon">⚡</div>
                    <div className="admin-metric-value">{users.active_users ?? '-'}</div>
                    <div className="admin-metric-label">Active Users (7d)</div>
                </div>
                <div className="admin-metric-card">
                    <div className="stat-card-icon">📝</div>
                    <div className="admin-metric-value">{engagement.posts ?? '-'}</div>
                    <div className="admin-metric-label">Total Posts</div>
                    <div className="admin-metric-trend">{engagement.posts_today > 0 ? `+${engagement.posts_today} today` : 'No posts today'}</div>
                </div>
                <div className="admin-metric-card">
                    <div className="stat-card-icon">📅</div>
                    <div className="admin-metric-value">{events.upcoming ?? '-'}</div>
                    <div className="admin-metric-label">Upcoming Events</div>
                </div>
                <div className="admin-metric-card">
                    <div className="stat-card-icon">🎯</div>
                    <div className="admin-metric-value">{events.attendance_rate ?? '-'}%</div>
                    <div className="admin-metric-label">Attendance Rate</div>
                </div>
            </div>

            <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                <Card>
                    <div className="card-header">
                        <span className="card-title">Users by Role</span>
                    </div>
                    <div className="stack-sm">
                        {Object.keys(users.by_role || {}).length === 0 ? (
                            <div className="text-muted text-sm">No data</div>
                        ) : (
                            Object.entries(users.by_role).map(([role, count]) => (
                                <div key={role} className="flex flex-between flex-center" style={{ padding: '0.35rem 0' }}>
                                    <Badge variant={roleColors[role] || 'default'}>{role}</Badge>
                                    <span className="font-display" style={{ fontWeight: 700, fontSize: '1.1rem' }}>{count}</span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
                <Card>
                    <div className="card-header">
                        <span className="card-title">Engagement</span>
                    </div>
                    <div className="stack-sm">
                        <div className="flex flex-between flex-center" style={{ padding: '0.35rem 0' }}>
                            <span className="text-sm">Posts</span>
                            <strong>{engagement.posts ?? 0}</strong>
                        </div>
                        <div className="flex flex-between flex-center" style={{ padding: '0.35rem 0' }}>
                            <span className="text-sm">Comments</span>
                            <strong>{engagement.comments ?? 0}</strong>
                        </div>
                        <div className="flex flex-between flex-center" style={{ padding: '0.35rem 0' }}>
                            <span className="text-sm">Reactions</span>
                            <strong>{engagement.reactions ?? 0}</strong>
                        </div>
                        <div className="flex flex-between flex-center" style={{ padding: '0.35rem 0' }}>
                            <span className="text-sm">Messages</span>
                            <strong>{engagement.messages ?? 0}</strong>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="card-header">
                        <span className="card-title">Events</span>
                    </div>
                    <div className="stack-sm">
                        <div className="flex flex-between flex-center" style={{ padding: '0.35rem 0' }}>
                            <span className="text-sm">Total Events</span>
                            <strong>{events.total ?? 0}</strong>
                        </div>
                        <div className="flex flex-between flex-center" style={{ padding: '0.35rem 0' }}>
                            <span className="text-sm">Registrations</span>
                            <strong>{events.registrations ?? 0}</strong>
                        </div>
                        <div className="flex flex-between flex-center" style={{ padding: '0.35rem 0' }}>
                            <span className="text-sm">Attended</span>
                            <strong>{events.attended ?? 0}</strong>
                        </div>
                        <div className="flex flex-between flex-center" style={{ padding: '0.35rem 0' }}>
                            <span className="text-sm">Scholarships</span>
                            <strong>{scholarships.total ?? 0}</strong>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="mb-4">
                <div className="card-header">
                    <span className="card-title">Daily Activity (Last 30 Days)</span>
                </div>
                {chartLoading ? (
                    <Spinner size="sm" />
                ) : activity.length === 0 ? (
                    <EmptyState icon="📊" sub="No activity data available yet.">No data</EmptyState>
                ) : (
                    <div>
                        <div className="activity-chart-wrap">
                            {activity.map((d) => {
                                const pctPosts = (d.posts / maxVal) * 100;
                                const pctComments = (d.comments / maxVal) * 100;
                                const pctRegs = (d.registrations / maxVal) * 100;
                                const day = parseInt(d.date.split('-')[2], 10);
                                const showLabel = day % 5 === 0 || d.date === activity[activity.length - 1]?.date;
                                return (
                                    <div key={d.date} className="activity-bar-col" title={`${d.date}\n${d.posts} posts · ${d.comments} comments · ${d.registrations} registrations`}>
                                        <div className="activity-bars-stack">
                                            {pctRegs > 0 && <div className="activity-bar activity-bar-registrations" style={{ height: `${pctRegs}%` }} />}
                                            {pctComments > 0 && <div className="activity-bar activity-bar-comments" style={{ height: `${pctComments}%` }} />}
                                            {pctPosts > 0 && <div className="activity-bar activity-bar-posts" style={{ height: `${pctPosts}%` }} />}
                                        </div>
                                        <div className="activity-bar-label" style={{ opacity: showLabel ? 1 : 0 }}>
                                            {d.date.split('-').slice(1).join('/')}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="activity-legend">
                            <span className="activity-legend-item">
                                <span className="activity-legend-dot activity-legend-posts" /> Posts
                            </span>
                            <span className="activity-legend-item">
                                <span className="activity-legend-dot activity-legend-comments" /> Comments
                            </span>
                            <span className="activity-legend-item">
                                <span className="activity-legend-dot activity-legend-registrations" /> Registrations
                            </span>
                        </div>
                    </div>
                )}
            </Card>

            <Card>
                <div className="card-header">
                    <span className="card-title">Recent Activity</span>
                </div>
                {recentActivity.length === 0 ? (
                    <EmptyState icon="🕐" sub="No recent activity across the platform.">No activity</EmptyState>
                ) : (
                    <div className="activity-list">
                        {recentActivity.map((item, idx) => (
                            <div key={idx} className="activity-item">
                                <div className={`activity-dot activity-dot-${item.type}`} />
                                <div className="activity-body">
                                    <div className="activity-title">{item.description}</div>
                                    <div className="activity-meta">{relativeTime(item.created_at)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}

function AdminModeration() {
    const [typeFilter, setTypeFilter] = React.useState('');
    const { loading, error, data, unauthorized, reload } = useApiData(`/api/v1/admin/moderation?type=${typeFilter}`);
    const statsHook = useApiData('/api/v1/admin/moderation/stats');
    const [actionId, setActionId] = React.useState(null);
    const [actionBusy, setActionBusy] = React.useState(false);
    const [rejectModal, setRejectModal] = React.useState(null);
    const [rejectReason, setRejectReason] = React.useState('');
    const [removedIds, setRemovedIds] = React.useState(new Set());
    const toast = useToast();
    const list = Array.isArray(data) ? data : [];
    const stats = statsHook.data || {};

    async function handleApprove(item) {
        const key = `${item.type}-${item.id}`;
        setActionId(key);
        setActionBusy(true);
        try {
            await window.axios.post(`/api/v1/admin/moderation/${item.id}/approve`, { type: item.type });
            setRemovedIds((prev) => new Set([...prev, key]));
            toast.success('Content approved.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Action failed.');
        } finally {
            setActionBusy(false);
            setActionId(null);
        }
    }

    async function handleReject(item) {
        if (!rejectReason.trim()) return;
        const key = `${item.type}-${item.id}`;
        setActionId(key);
        setActionBusy(true);
        try {
            await window.axios.post(`/api/v1/admin/moderation/${item.id}/reject`, { reason: rejectReason, type: item.type });
            setRemovedIds((prev) => new Set([...prev, key]));
            toast.success('Content rejected.');
            setRejectModal(null);
            setRejectReason('');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Action failed.');
        } finally {
            setActionBusy(false);
            setActionId(null);
        }
    }

    if (loading) return <Spinner />;
    if (error) return <EmptyState icon="⚠️">{error}</EmptyState>;
    if (unauthorized) return <EmptyState icon="🔒">Admin access required.</EmptyState>;

    const filtered = list.filter((item) => !removedIds.has(`${item.type}-${item.id}`));

    return (
        <div>
            <div className="admin-metrics" style={{ marginBottom: '1rem' }}>
                <div className="admin-metric-card">
                    <div className="stat-card-icon">📋</div>
                    <div className="admin-metric-value">{stats.total_reviewed_today ?? '-'}</div>
                    <div className="admin-metric-label">Reviewed Today</div>
                </div>
                <div className="admin-metric-card">
                    <div className="stat-card-icon">🚩</div>
                    <div className="admin-metric-value">{stats.total_flagged ?? '-'}</div>
                    <div className="admin-metric-label">Total Flagged</div>
                </div>
                <div className="admin-metric-card">
                    <div className="stat-card-icon">📊</div>
                    <div className="admin-metric-value">{stats.flag_rate ?? '-'}%</div>
                    <div className="admin-metric-label">Flag Rate</div>
                </div>
            </div>

            <div className="admin-action-bar">
                <button className={`btn btn-sm ${typeFilter === '' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => setTypeFilter('')}>All Flagged</button>
                <button className={`btn btn-sm ${typeFilter === 'posts' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => setTypeFilter('posts')}>Flagged Posts ({stats.flagged_posts ?? 0})</button>
                <button className={`btn btn-sm ${typeFilter === 'comments' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => setTypeFilter('comments')}>Flagged Comments ({stats.flagged_comments ?? 0})</button>
            </div>

            {filtered.length === 0 ? (
                <EmptyState icon="✅" sub="All content has been reviewed.">No flagged content</EmptyState>
            ) : (
                <div className="stack" style={{ marginTop: '1rem' }}>
                    {filtered.map((item) => (
                        <div key={`${item.type}-${item.id}`} className="report-card">
                            <div className="report-card-header">
                                <div className="report-card-reason">{item.reason || 'Flagged by AI'}</div>
                                <Badge variant={item.type === 'post' ? 'default' : 'pending'}>{item.type}</Badge>
                            </div>
                            <div className="report-card-detail" style={{ whiteSpace: 'pre-wrap' }}>
                                {item.body ? (item.body.length > 200 ? item.body.slice(0, 200) + '...' : item.body) : '(No text content)'}
                            </div>
                            <div className="report-card-meta">
                                <span>By: {item.author?.name || `User #${item.author?.id || '?'}`}</span>
                                <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</span>
                            </div>
                            <div className="admin-actions">
                                <button
                                    className="btn btn-primary btn-sm"
                                    disabled={actionBusy}
                                    onClick={() => handleApprove(item)}
                                    type="button"
                                >
                                    {actionBusy && actionId === `${item.type}-${item.id}` ? '...' : 'Approve'}
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    disabled={actionBusy}
                                    onClick={() => setRejectModal(item)}
                                    type="button"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {rejectModal && (
                <Modal title="Reject Content" onClose={() => { setRejectModal(null); setRejectReason(''); }}
                    footer={[
                        <button key="cancel" className="btn btn-secondary" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</button>,
                        <button key="reject" className="btn btn-danger" disabled={actionBusy || !rejectReason.trim()} onClick={() => handleReject(rejectModal)}>
                            {actionBusy ? 'Rejecting...' : 'Reject'}
                        </button>,
                    ]}>
                    <div className="form-group">
                        <label className="form-label">Rejection reason</label>
                        <textarea className="form-input" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Explain why this content was rejected..." />
                    </div>
                </Modal>
            )}
        </div>
    );
}

function AdminReports() {
    const { loading, error, data, unauthorized, reload, update } = useApiData('/api/v1/admin/reports');
    const [actionId, setActionId] = React.useState(null);
    const [actionBusy, setActionBusy] = React.useState(false);
    const toast = useToast();
    const list = Array.isArray(data) ? data : [];

    async function handleResolve(reportId, status) {
        setActionBusy(true);
        try {
            await window.axios.patch(`/api/v1/admin/reports/${reportId}/resolve`, { status });
            update(reportId, { status, reviewed_at: new Date().toISOString() });
            toast.success(`Report ${status} successfully.`);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Action failed.');
        } finally {
            setActionBusy(false);
            setActionId(null);
        }
    }

    if (loading) return <Spinner />;
    if (error) return <EmptyState icon="⚠️">{error}</EmptyState>;
    if (unauthorized) return <EmptyState icon="🔒">Admin access required.</EmptyState>;

    return (
        <div>
            {list.length === 0 ? (
                <EmptyState icon="✅" sub="All reports have been processed.">No pending reports</EmptyState>
            ) : (
                <div className="stack">
                    {list.map((report) => (
                        <div key={report.id} className="report-card">
                            <div className="report-card-header">
                                <div className="report-card-reason">{report.reason}</div>
                                <Badge variant={report.status === 'pending' ? 'pending' : report.status === 'reviewed' ? 'resolved' : 'rejected'}>
                                    {report.status}
                                </Badge>
                            </div>
                            <div className="report-card-detail">{report.details || 'No details provided.'}</div>
                            <div className="report-card-meta">
                                <span>Reported by: {report.reporter?.name || `User #${report.reporter_id}`}</span>
                                <span>Target: {report.target_type} #{report.target_id}</span>
                                <span>{report.created_at ? new Date(report.created_at).toLocaleDateString() : ''}</span>
                            </div>
                            {report.status === 'pending' && (
                                <div className="admin-actions">
                                    <button
                                        className="btn btn-primary btn-sm"
                                        disabled={actionBusy}
                                        onClick={() => handleResolve(report.id, 'reviewed')}
                                        type="button"
                                    >
                                        {actionBusy ? 'Processing...' : 'Resolve'}
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        disabled={actionBusy}
                                        onClick={() => handleResolve(report.id, 'rejected')}
                                        type="button"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function AdminUsers() {
    const [search, setSearch] = React.useState('');
    const params = new URLSearchParams();
    if (search) params.set('search', search);

    const { loading, error, data, unauthorized, reload, update } = useApiData(`/api/v1/admin/users?${params.toString()}`);
    const [suspendModal, setSuspendModal] = React.useState(null);
    const [warnModal, setWarnModal] = React.useState(null);
    const [roleModal, setRoleModal] = React.useState(null);
    const [reason, setReason] = React.useState('');
    const [duration, setDuration] = React.useState(24);
    const [newRole, setNewRole] = React.useState('user');
    const [busy, setBusy] = React.useState(false);
    const toast = useToast();

    const list = Array.isArray(data) ? data : [];

    async function handleWarn() {
        if (!reason.trim()) return;
        setBusy(true);
        try {
            await window.axios.post(`/api/v1/admin/users/${warnModal}/warn`, { reason });
            toast.success('User warned successfully.');
            setWarnModal(null);
            setReason('');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed.');
        } finally { setBusy(false); }
    }

    async function handleSuspend() {
        if (!reason.trim()) return;
        setBusy(true);
        try {
            await window.axios.post(`/api/v1/admin/users/${suspendModal}/suspend`, { reason, duration_hours: duration });
            update(suspendModal, { suspended_until: new Date(Date.now() + duration * 3600000).toISOString() });
            toast.success('User suspended.');
            setSuspendModal(null);
            setReason('');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed.');
        } finally { setBusy(false); }
    }

    async function handleUnsuspend(userId) {
        setBusy(true);
        try {
            await window.axios.post(`/api/v1/admin/users/${userId}/unsuspend`);
            update(userId, { suspended_until: null });
            toast.success('User unsuspended.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed.');
        } finally { setBusy(false); }
    }

    async function handleRole() {
        setBusy(true);
        try {
            await window.axios.patch(`/api/v1/admin/users/${roleModal}/role`, { role: newRole });
            update(roleModal, { role: newRole });
            toast.success('Role updated.');
            setRoleModal(null);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed.');
        } finally { setBusy(false); }
    }

    if (loading) return <Spinner />;
    if (error) return <EmptyState icon="⚠️">{error}</EmptyState>;
    if (unauthorized) return <EmptyState icon="🔒">Admin access required.</EmptyState>;

    return (
        <div>
            <div className="admin-action-bar">
                <SearchInput value={search} onChange={setSearch} placeholder="Search name or email..." />
            </div>

            {warnModal && (
                <Modal title="Warn User" onClose={() => { setWarnModal(null); setReason(''); }}
                    footer={[
                        <button key="cancel" className="btn btn-secondary" onClick={() => { setWarnModal(null); setReason(''); }}>Cancel</button>,
                        <button key="warn" className="btn btn-primary" disabled={busy || !reason.trim()} onClick={handleWarn}>
                            {busy ? 'Sending...' : 'Send Warning'}
                        </button>,
                    ]}>
                    <div className="form-group">
                        <label className="form-label">Warning reason</label>
                        <textarea className="form-input" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
                    </div>
                </Modal>
            )}

            {suspendModal && (
                <Modal title="Suspend User" onClose={() => { setSuspendModal(null); setReason(''); }}
                    footer={[
                        <button key="cancel" className="btn btn-secondary" onClick={() => { setSuspendModal(null); setReason(''); }}>Cancel</button>,
                        <button key="suspend" className="btn btn-danger" disabled={busy || !reason.trim()} onClick={handleSuspend}>
                            {busy ? 'Suspending...' : 'Suspend User'}
                        </button>,
                    ]}>
                    <div className="form-group">
                        <label className="form-label">Reason</label>
                        <textarea className="form-input" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Duration (hours)</label>
                        <input className="form-input" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={1} max={8760} />
                    </div>
                </Modal>
            )}

            {roleModal && (
                <Modal title="Change User Role" onClose={() => setRoleModal(null)}
                    footer={[
                        <button key="cancel" className="btn btn-secondary" onClick={() => setRoleModal(null)}>Cancel</button>,
                        <button key="save" className="btn btn-primary" disabled={busy} onClick={handleRole}>
                            {busy ? 'Saving...' : 'Save'}
                        </button>,
                    ]}>
                    <div className="form-group">
                        <label className="form-label">New role</label>
                        <select className="form-input" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            <option value="super_admin">Super Admin</option>
                        </select>
                    </div>
                </Modal>
            )}

            {list.length === 0 ? (
                <EmptyState icon="🔍" sub="Try a different search.">No users found</EmptyState>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Batch</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((u) => (
                                <tr key={u.id}>
                                    <td><strong>{u.name}</strong></td>
                                    <td className="text-muted font-mono text-xs">{u.email}</td>
                                    <td className="text-sm">{u.round && `R${u.round}`}{u.batch && ` B${u.batch}`}</td>
                                    <td>
                                        <Badge variant={u.role === 'user' ? 'student' : 'admin'}>{u.role}</Badge>
                                    </td>
                                    <td>
                                        {u.suspended_until ? (
                                            <Badge variant="suspended">Suspended</Badge>
                                        ) : (
                                            <Badge variant="active">Active</Badge>
                                        )}
                                    </td>
                                    <td>
                                        <div className="admin-actions">
                                            <button className="btn btn-ghost btn-sm" onClick={() => { setWarnModal(u.id); setReason(''); }} type="button">Warn</button>
                                            {u.suspended_until ? (
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleUnsuspend(u.id)} disabled={busy} type="button">Unsuspend</button>
                                            ) : (
                                                <button className="btn btn-ghost btn-sm" onClick={() => { setSuspendModal(u.id); setReason(''); }} type="button">Suspend</button>
                                            )}
                                            <button className="btn btn-ghost btn-sm" onClick={() => { setRoleModal(u.id); setNewRole(u.role); }} type="button">Role</button>
                                        </div>
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

function AdminAnnouncements() {
    const [search, setSearch] = React.useState('');
    const [typeFilter, setTypeFilter] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('');
    const [page, setPage] = React.useState(1);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (typeFilter) params.set('type', typeFilter);
    if (statusFilter) params.set('status', statusFilter);
    params.set('page', String(page));

    const { loading, error, data, unauthorized, reload, update, remove, pagination } = useApiData(`/api/v1/admin/announcements?${params.toString()}`);
    const [createModal, setCreateModal] = React.useState(false);
    const [editModal, setEditModal] = React.useState(null);
    const [deleteModal, setDeleteModal] = React.useState(null);
    const [form, setForm] = React.useState({ title: '', body: '', type: 'announcement', audience: 'all', is_pinned: false, publish_now: false });
    const [busy, setBusy] = React.useState(false);
    const toast = useToast();

    const list = Array.isArray(data) ? data : [];

    function resetForm() {
        setForm({ title: '', body: '', type: 'announcement', audience: 'all', is_pinned: false, publish_now: false });
    }

    function openCreate() {
        resetForm();
        setCreateModal(true);
    }

    function openEdit(a) {
        setForm({ title: a.title, body: a.body, type: a.type, audience: a.audience, is_pinned: a.is_pinned, publish_now: false });
        setEditModal(a);
    }

    async function handleCreate() {
        if (!form.title.trim() || !form.body.trim()) return;
        setBusy(true);
        try {
            const res = await window.axios.post('/api/v1/admin/announcements', form);
            reload();
            toast.success('Announcement created.');
            setCreateModal(false);
            resetForm();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to create.');
        } finally { setBusy(false); }
    }

    async function handleEdit() {
        if (!form.title.trim() || !form.body.trim()) return;
        setBusy(true);
        try {
            await window.axios.put(`/api/v1/admin/announcements/${editModal.id}`, form);
            update(editModal.id, form);
            toast.success('Announcement updated.');
            setEditModal(null);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update.');
        } finally { setBusy(false); }
    }

    async function handleDelete() {
        setBusy(true);
        try {
            await window.axios.delete(`/api/v1/admin/announcements/${deleteModal.id}`);
            remove(deleteModal.id);
            toast.success('Announcement deleted.');
            setDeleteModal(null);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to delete.');
        } finally { setBusy(false); }
    }

    async function handleTogglePin(a) {
        try {
            const res = await window.axios.post(`/api/v1/admin/announcements/${a.id}/pin`);
            update(a.id, { is_pinned: res.data.is_pinned });
            toast.success(res.data.is_pinned ? 'Announcement pinned.' : 'Announcement unpinned.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed.');
        }
    }

    async function handlePublish(a) {
        try {
            const res = await window.axios.post(`/api/v1/admin/announcements/${a.id}/publish`);
            const updated = res.data.announcement || res.data;
            if (updated.id) {
                update(a.id, updated);
            } else {
                reload();
            }
            toast.success(res.data.message || 'Toggled publish status.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed.');
        }
    }

    const typeBadgeVariant = (type) => {
        const map = { notice: 'pending', announcement: 'default', news: 'admin', event_banner: 'active' };
        return map[type] || 'default';
    };

    const typeLabel = (type) => {
        const map = { notice: 'Notice', announcement: 'Announcement', news: 'News', event_banner: 'Event' };
        return map[type] || type;
    };

    if (loading) return <Spinner />;
    if (error) return <EmptyState icon="⚠️">{error}</EmptyState>;
    if (unauthorized) return <EmptyState icon="🔒">Admin access required.</EmptyState>;

    return (
        <div>
            <div className="admin-action-bar">
                <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by title..." />
                <div className="form-group">
                    <select className="form-input" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
                        <option value="">All types</option>
                        <option value="notice">Notice</option>
                        <option value="announcement">Announcement</option>
                        <option value="news">News</option>
                        <option value="event_banner">Event Banner</option>
                    </select>
                </div>
                <div className="form-group">
                    <select className="form-input" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                        <option value="">All status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
                <button className="btn btn-primary btn-sm" onClick={openCreate} type="button">+ New Announcement</button>
            </div>

            {createModal && (
                <Modal title="Create Announcement" onClose={() => { setCreateModal(false); resetForm(); }}
                    footer={[
                        <button key="cancel" className="btn btn-secondary" onClick={() => { setCreateModal(false); resetForm(); }}>Cancel</button>,
                        <button key="save" className="btn btn-primary" disabled={busy || !form.title.trim() || !form.body.trim()} onClick={handleCreate}>
                            {busy ? 'Creating...' : 'Create'}
                        </button>,
                    ]}>
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input className="form-input" type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Body</label>
                        <textarea className="form-input" value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} rows={4} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Type</label>
                        <select className="form-input" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                            <option value="notice">Notice</option>
                            <option value="announcement">Announcement</option>
                            <option value="news">News</option>
                            <option value="event_banner">Event Banner</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Audience</label>
                        <select className="form-input" value={form.audience} onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value }))}>
                            <option value="all">Everyone</option>
                            <option value="students">Students</option>
                            <option value="alumni">Alumni</option>
                            <option value="trainers">Trainers</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-checkbox-label">
                            <input type="checkbox" checked={form.is_pinned} onChange={(e) => setForm((p) => ({ ...p, is_pinned: e.target.checked }))} />
                            <span>Pin this announcement</span>
                        </label>
                    </div>
                    <div className="form-group">
                        <label className="form-checkbox-label">
                            <input type="checkbox" checked={form.publish_now} onChange={(e) => setForm((p) => ({ ...p, publish_now: e.target.checked }))} />
                            <span>Publish immediately</span>
                        </label>
                    </div>
                </Modal>
            )}

            {editModal && (
                <Modal title="Edit Announcement" onClose={() => setEditModal(null)}
                    footer={[
                        <button key="cancel" className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>,
                        <button key="save" className="btn btn-primary" disabled={busy || !form.title.trim() || !form.body.trim()} onClick={handleEdit}>
                            {busy ? 'Saving...' : 'Save'}
                        </button>,
                    ]}>
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input className="form-input" type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Body</label>
                        <textarea className="form-input" value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} rows={4} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Type</label>
                        <select className="form-input" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                            <option value="notice">Notice</option>
                            <option value="announcement">Announcement</option>
                            <option value="news">News</option>
                            <option value="event_banner">Event Banner</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Audience</label>
                        <select className="form-input" value={form.audience} onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value }))}>
                            <option value="all">Everyone</option>
                            <option value="students">Students</option>
                            <option value="alumni">Alumni</option>
                            <option value="trainers">Trainers</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-checkbox-label">
                            <input type="checkbox" checked={form.is_pinned} onChange={(e) => setForm((p) => ({ ...p, is_pinned: e.target.checked }))} />
                            <span>Pin this announcement</span>
                        </label>
                    </div>
                </Modal>
            )}

            {deleteModal && (
                <Modal title="Delete Announcement" onClose={() => setDeleteModal(null)}
                    footer={[
                        <button key="cancel" className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>,
                        <button key="delete" className="btn btn-danger" disabled={busy} onClick={handleDelete}>
                            {busy ? 'Deleting...' : 'Delete'}
                        </button>,
                    ]}>
                    <p>Are you sure you want to delete <strong>{deleteModal.title}</strong>? This action cannot be undone.</p>
                </Modal>
            )}

            {list.length === 0 ? (
                <EmptyState icon="📢" sub="Create your first announcement to get started.">No announcements found</EmptyState>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Pinned</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((a) => (
                                <tr key={a.id}>
                                    <td><strong>{a.title}</strong></td>
                                    <td><Badge variant={typeBadgeVariant(a.type)}>{typeLabel(a.type)}</Badge></td>
                                    <td>
                                        {a.published_at ? (
                                            <Badge variant="active">Published</Badge>
                                        ) : (
                                            <Badge variant="suspended">Draft</Badge>
                                        )}
                                    </td>
                                    <td>{a.is_pinned ? <span>📌 Yes</span> : <span className="text-muted">No</span>}</td>
                                    <td className="text-sm text-muted">{a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</td>
                                    <td>
                                        <div className="admin-actions">
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)} type="button">Edit</button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => handleTogglePin(a)} type="button">
                                                {a.is_pinned ? 'Unpin' : 'Pin'}
                                            </button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => handlePublish(a)} type="button">
                                                {a.published_at ? 'Unpublish' : 'Publish'}
                                            </button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteModal(a)} type="button">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {pagination && pagination.last > 1 && (
                        <div style={{ padding: '0.75rem' }}>
                            <Pagination current={pagination.current} last={pagination.last} onChange={setPage} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function AdminAuditLog() {
    const [filters, setFilters] = React.useState({ action: '', user_id: '' });
    const params = new URLSearchParams();
    if (filters.action) params.set('action', filters.action);
    if (filters.user_id) params.set('user_id', filters.user_id);

    const { loading, error, data, unauthorized } = useApiData(`/api/v1/admin/audit-logs?${params.toString()}&per_page=30`);
    const list = Array.isArray(data) ? data : [];

    if (loading) return <Spinner />;
    if (error) return <EmptyState icon="⚠️">{error}</EmptyState>;
    if (unauthorized) return <EmptyState icon="🔒">Admin access required.</EmptyState>;

    return (
        <div>
            <div className="admin-action-bar">
                <div className="form-group">
                    <input className="form-input" type="text" placeholder="Filter by action (e.g. user.suspended)"
                        value={filters.action} onChange={(e) => setFilters((p) => ({ ...p, action: e.target.value }))} />
                </div>
                <div className="form-group">
                    <input className="form-input" type="text" placeholder="Filter by user ID"
                        value={filters.user_id} onChange={(e) => setFilters((p) => ({ ...p, user_id: e.target.value }))} />
                </div>
            </div>

            {list.length === 0 ? (
                <EmptyState icon="📋" sub="No audit log entries match your filters.">No entries found</EmptyState>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>Actor</th>
                                <th>Resource</th>
                                <th>Details</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((log) => (
                                <tr key={log.id}>
                                    <td><code className="font-mono text-sm">{log.action}</code></td>
                                    <td className="text-sm">{log.user?.name || `User #${log.user_id}`}</td>
                                    <td className="text-xs text-muted">
                                        {log.resource_type && `${log.resource_type} #${log.resource_id}`}
                                    </td>
                                    <td className="text-xs text-muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {log.metadata ? JSON.stringify(log.metadata).slice(0, 60) : '-'}
                                    </td>
                                    <td className="text-xs font-mono text-muted">
                                        {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
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

const STATUS_VARIANTS = {
    published: 'default',
    draft: 'student',
    cancelled: 'danger',
    completed: 'admin',
};

function formatDateShort(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function AdminEvents() {
    const [page, setPage] = React.useState(1);
    const [search, setSearch] = React.useState('');
    const [selectedEvent, setSelectedEvent] = React.useState(null);
    const [createModal, setCreateModal] = React.useState(false);
    const [form, setForm] = React.useState({
        title: '', description: '', event_type: 'workshop', location: '',
        online_url: '', start_date: '', end_date: '', max_participants: '', status: 'draft',
    });
    const [busy, setBusy] = React.useState(false);
    const toast = useToast();

    const params = new URLSearchParams();
    params.set('page', String(page));
    if (search) params.set('search', search);
    params.set('status', 'all');

    const { loading, error, data, unauthorized, reload, pagination } = useApiData(`/api/v1/events?${params.toString()}`);
    const events = Array.isArray(data) ? data : [];

    function resetForm() {
        setForm({
            title: '', description: '', event_type: 'workshop', location: '',
            online_url: '', start_date: '', end_date: '', max_participants: '', status: 'draft',
        });
    }

    function handleFormChange(e) {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    }

    async function handleCreate() {
        if (!form.title.trim() || !form.description.trim() || !form.start_date || !form.end_date) return;
        setBusy(true);
        try {
            await window.axios.post('/api/v1/events', form);
            toast.success('Event created.');
            setCreateModal(false);
            resetForm();
            reload();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to create event.');
        } finally {
            setBusy(false);
        }
    }

    if (selectedEvent) {
        return <AdminEventDetail event={selectedEvent} onBack={() => setSelectedEvent(null)} />;
    }

    if (loading) return <Spinner />;
    if (error) return <EmptyState icon="⚠️">{error}</EmptyState>;
    if (unauthorized) return <EmptyState icon="🔒">Admin access required.</EmptyState>;

    return (
        <div>
            <div className="admin-action-bar">
                <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search events..." />
                <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setCreateModal(true); }} type="button">
                    + New Event
                </button>
            </div>

            {createModal && (
                <Modal title="Create Event" onClose={() => { setCreateModal(false); resetForm(); }}
                    footer={[
                        <button key="cancel" className="btn btn-secondary" onClick={() => { setCreateModal(false); resetForm(); }}>Cancel</button>,
                        <button key="save" className="btn btn-primary" disabled={busy || !form.title.trim() || !form.start_date || !form.end_date} onClick={handleCreate}>
                            {busy ? 'Creating...' : 'Create'}
                        </button>,
                    ]}>
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input className="form-input" name="title" value={form.title} onChange={handleFormChange} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-input" name="description" value={form.description} onChange={handleFormChange} rows={3} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Type</label>
                        <select className="form-input" name="event_type" value={form.event_type} onChange={handleFormChange}>
                            <option value="workshop">Workshop</option>
                            <option value="seminar">Seminar</option>
                            <option value="hackathon">Hackathon</option>
                            <option value="career_fair">Career Fair</option>
                            <option value="training">Training</option>
                            <option value="alumni_meetup">Alumni Meetup</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Location</label>
                        <input className="form-input" name="location" value={form.location} onChange={handleFormChange} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Online URL</label>
                        <input className="form-input" name="online_url" value={form.online_url} onChange={handleFormChange} />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Start Date</label>
                            <input className="form-input" type="datetime-local" name="start_date" value={form.start_date} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">End Date</label>
                            <input className="form-input" type="datetime-local" name="end_date" value={form.end_date} onChange={handleFormChange} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Max Participants (optional)</label>
                        <input className="form-input" type="number" name="max_participants" value={form.max_participants} onChange={handleFormChange} min={0} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-input" name="status" value={form.status} onChange={handleFormChange}>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>
                </Modal>
            )}

            {events.length === 0 ? (
                <EmptyState icon="📅" sub="Create an event to get started.">No events found</EmptyState>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Registered</th>
                                <th>Attended</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((ev) => (
                                <tr key={ev.id} onClick={() => setSelectedEvent(ev)} style={{ cursor: 'pointer' }}>
                                    <td><strong>{ev.title}</strong></td>
                                    <td className="text-sm">{ev.event_type?.replace('_', ' ')}</td>
                                    <td><Badge variant={STATUS_VARIANTS[ev.status] || 'default'}>{ev.status}</Badge></td>
                                    <td className="text-sm text-muted">{formatDateShort(ev.start_date)}</td>
                                    <td className="text-sm">{ev.registrations_count ?? 0}</td>
                                    <td className="text-sm">{ev.attended_count ?? 0}</td>
                                    <td>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                                            type="button"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {pagination && pagination.last > 1 && (
                        <div style={{ padding: '0.75rem' }}>
                            <Pagination current={pagination.current} last={pagination.last} onChange={setPage} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function AdminSuccessStories() {
    const [filter, setFilter] = React.useState('');
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);

    const { loading, error, data, unauthorized, reload, update } = useApiData(`/api/v1/admin/success-stories?${params.toString()}`);
    const [actionId, setActionId] = React.useState(null);
    const [actionBusy, setActionBusy] = React.useState(false);
    const toast = useToast();
    const list = Array.isArray(data) ? data : [];

    async function handleApprove(storyId, approve) {
        setActionId(storyId);
        setActionBusy(true);
        try {
            await window.axios.patch(`/api/v1/admin/success-stories/${storyId}/approve`, { is_approved: approve });
            update(storyId, { is_approved: approve, published_at: approve ? new Date().toISOString() : null });
            toast.success(approve ? 'Story approved!' : 'Story rejected.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Action failed.');
        } finally {
            setActionBusy(false);
            setActionId(null);
        }
    }

    if (loading) return <Spinner />;
    if (error) return <EmptyState icon="⚠️">{error}</EmptyState>;
    if (unauthorized) return <EmptyState icon="🔒">Admin access required.</EmptyState>;

    return (
        <div>
            <div className="admin-action-bar">
                <button className={`btn btn-sm ${filter === '' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => setFilter('')}>All</button>
                <button className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => setFilter('pending')}>Pending</button>
                <button className={`btn btn-sm ${filter === 'approved' ? 'btn-primary' : 'btn-secondary'}`} type="button" onClick={() => setFilter('approved')}>Approved</button>
            </div>

            {list.length === 0 ? (
                <EmptyState icon="📭" sub="No success stories found.">No stories</EmptyState>
            ) : (
                <div className="admin-table-wrap" style={{ marginTop: '1rem' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Author</th>
                                <th>Title</th>
                                <th>Company</th>
                                <th>Submitted</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((story) => (
                                <tr key={story.id}>
                                    <td>
                                        <div className="flex-center" style={{ gap: '0.5rem' }}>
                                            <Avatar name={story.user?.name} size="sm" />
                                            <span>{story.user?.name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{story.title}</td>
                                    <td>{story.company || '—'}</td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                                        {story.created_at ? new Date(story.created_at).toLocaleDateString() : '—'}
                                    </td>
                                    <td>
                                        <Badge variant={story.is_approved ? 'active' : 'pending'}>
                                            {story.is_approved ? 'Approved' : 'Pending'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="admin-actions">
                                            {!story.is_approved && (
                                                <button className="btn btn-primary btn-sm" type="button"
                                                    disabled={actionBusy}
                                                    onClick={() => handleApprove(story.id, true)}>
                                                    {actionBusy && actionId === story.id ? '...' : 'Approve'}
                                                </button>
                                            )}
                                            {story.is_approved && (
                                                <button className="btn btn-danger btn-sm" type="button"
                                                    disabled={actionBusy}
                                                    onClick={() => handleApprove(story.id, false)}>
                                                    {actionBusy && actionId === story.id ? '...' : 'Reject'}
                                                </button>
                                            )}
                                        </div>
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

const PLACEMENT_STATUS_VARIANTS = {
    placed: 'active',
    offer_received: 'pending',
    interviewing: 'admin',
    not_placed: 'suspended',
};

const STATUS_LABELS = {
    placed: 'Placed',
    offer_received: 'Offer Received',
    interviewing: 'Interviewing',
    not_placed: 'Not Placed',
};

function AdminPlacements() {
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('');
    const [companyFilter, setCompanyFilter] = React.useState('');
    const [batchFilter, setBatchFilter] = React.useState('');
    const [dateFrom, setDateFrom] = React.useState('');
    const [dateTo, setDateTo] = React.useState('');
    const [page, setPage] = React.useState(1);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (companyFilter) params.set('company_id', companyFilter);
    if (batchFilter) params.set('batch', batchFilter);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    params.set('page', String(page));

    const { loading, error, data, unauthorized, reload, update, remove, pagination } = useApiData(`/api/v1/admin/placements?${params.toString()}`);
    const statsHook = useApiData('/api/v1/admin/placements/stats');
    const companiesHook = useApiData('/api/v1/companies');

    const [createModal, setCreateModal] = React.useState(false);
    const [editModal, setEditModal] = React.useState(null);
    const [deleteModal, setDeleteModal] = React.useState(null);
    const [bulkModal, setBulkModal] = React.useState(false);
    const [form, setForm] = React.useState({ user_id: '', company_id: '', position: '', offer_date: '', joining_date: '', salary: '', status: 'placed', notes: '' });
    const [bulkJson, setBulkJson] = React.useState('');
    const [userSearch, setUserSearch] = React.useState('');
    const [userResults, setUserResults] = React.useState([]);
    const [selectedUser, setSelectedUser] = React.useState(null);
    const [busy, setBusy] = React.useState(false);
    const toast = useToast();

    const list = Array.isArray(data) ? data : [];
    const stats = statsHook.data || {};
    const companies = Array.isArray(companiesHook.data) ? companiesHook.data : [];

    const byBatchChart = Array.isArray(stats.by_batch) ? stats.by_batch : [];
    const byCompanyList = Array.isArray(stats.by_company) ? stats.by_company : [];
    const maxBatchPlaced = byBatchChart.length > 0 ? Math.max(...byBatchChart.map(b => b.placed_count || b.total)) : 1;

    async function searchUsers(query) {
        if (!query.trim()) { setUserResults([]); return; }
        try {
            const res = await window.axios.get(`/api/v1/users?search=${encodeURIComponent(query)}&per_page=10`);
            setUserResults(Array.isArray(res.data) ? res.data : (res.data.data || []));
        } catch { setUserResults([]); }
    }

    function resetForm() {
        setForm({ user_id: '', company_id: '', position: '', offer_date: '', joining_date: '', salary: '', status: 'placed', notes: '' });
        setSelectedUser(null);
        setUserSearch('');
        setUserResults([]);
    }

    function openCreate() { resetForm(); setCreateModal(true); }

    function openEdit(p) {
        setForm({
            user_id: p.user_id,
            company_id: p.company_id,
            position: p.position,
            offer_date: p.offer_date ? p.offer_date.split('T')[0] : '',
            joining_date: p.joining_date ? p.joining_date.split('T')[0] : '',
            salary: p.salary || '',
            status: p.status,
            notes: p.notes || '',
        });
        setSelectedUser(p.user);
        setUserSearch(p.user?.name || '');
        setEditModal(p);
    }

    async function handleCreate() {
        if (!form.user_id || !form.company_id || !form.position || !form.offer_date) return;
        setBusy(true);
        try {
            const res = await window.axios.post('/api/v1/admin/placements', form);
            reload();
            toast.success('Placement created.');
            setCreateModal(false);
            resetForm();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to create.');
        } finally { setBusy(false); }
    }

    async function handleEdit() {
        if (!form.position || !form.offer_date) return;
        setBusy(true);
        try {
            const res = await window.axios.put(`/api/v1/admin/placements/${editModal.id}`, form);
            update(editModal.id, res.data);
            toast.success('Placement updated.');
            setEditModal(null);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update.');
        } finally { setBusy(false); }
    }

    async function handleDelete() {
        setBusy(true);
        try {
            await window.axios.delete(`/api/v1/admin/placements/${deleteModal.id}`);
            remove(deleteModal.id);
            toast.success('Placement deleted.');
            setDeleteModal(null);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to delete.');
        } finally { setBusy(false); }
    }

    async function handleBulkImport() {
        let parsed;
        try { parsed = JSON.parse(bulkJson); } catch { toast.error('Invalid JSON format.'); return; }
        const placements = Array.isArray(parsed) ? parsed : (parsed.placements || []);
        if (placements.length === 0) { toast.error('No placements found in JSON.'); return; }
        setBusy(true);
        try {
            await window.axios.post('/api/v1/admin/placements/bulk-import', { placements });
            toast.success(`${placements.length} placements imported.`);
            setBulkModal(false);
            setBulkJson('');
            reload();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Import failed.');
        } finally { setBusy(false); }
    }

    if (loading) return <Spinner />;
    if (error) return <EmptyState icon="⚠️">{error}</EmptyState>;
    if (unauthorized) return <EmptyState icon="🔒">Admin access required.</EmptyState>;

    return (
        <div>
            <div className="admin-metrics">
                <div className="admin-metric-card">
                    <div className="stat-card-icon">🎯</div>
                    <div className="admin-metric-value">{stats.total_placed ?? '-'}</div>
                    <div className="admin-metric-label">Total Placed</div>
                </div>
                <div className="admin-metric-card">
                    <div className="stat-card-icon">📊</div>
                    <div className="admin-metric-value">{stats.placement_rate ?? '-'}%</div>
                    <div className="admin-metric-label">Placement Rate</div>
                </div>
                <div className="admin-metric-card">
                    <div className="stat-card-icon">📋</div>
                    <div className="admin-metric-value">{stats.total_offer_received ?? '-'}</div>
                    <div className="admin-metric-label">Offer Received</div>
                </div>
                <div className="admin-metric-card">
                    <div className="stat-card-icon">👥</div>
                    <div className="admin-metric-value">{stats.total_students ?? '-'}</div>
                    <div className="admin-metric-label">Total Students</div>
                </div>
            </div>

            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Placements by Batch</span>
                    </div>
                    {byBatchChart.length === 0 ? (
                        <div className="text-muted text-sm" style={{ padding: '1rem' }}>No data yet.</div>
                    ) : (
                        <div style={{ padding: '1rem' }}>
                            {byBatchChart.map((b, i) => {
                                const label = `${b.round_label ? `R${b.round_label} ` : ''}${b.batch_label ? `B${b.batch_label}` : ''}`;
                                const pct = Math.max(3, (b.placed_count / maxBatchPlaced) * 100);
                                return (
                                    <div key={i} style={{ marginBottom: '0.5rem' }}>
                                        <div className="flex flex-between" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                            <span>{label || 'Unknown'}</span>
                                            <span>{b.placed_count}/{b.total}</span>
                                        </div>
                                        <div className="activity-chart-wrap" style={{ height: '20px', background: 'var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: 'var(--radius-sm)', transition: 'width 0.3s ease' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Placed vs Not Placed</span>
                    </div>
                    <div style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{
                            width: '160px', height: '160px', borderRadius: '50%',
                            margin: '0 auto 1rem',
                            background: `conic-gradient(var(--primary) 0deg ${(stats.total_placed / Math.max(stats.total_placements, 1)) * 360}deg, var(--danger) ${(stats.total_placed / Math.max(stats.total_placements, 1)) * 360}deg 360deg)`,
                            boxShadow: 'var(--card-shadow)',
                        }} />
                        <div className="stack-sm">
                            <div className="flex flex-center" style={{ gap: '0.5rem' }}>
                                <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--primary)', display: 'inline-block' }} />
                                <span className="text-sm">Placed: {stats.total_placed ?? 0}</span>
                            </div>
                            <div className="flex flex-center" style={{ gap: '0.5rem' }}>
                                <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--danger)', display: 'inline-block' }} />
                                <span className="text-sm">Not Placed: {(stats.total_placements ?? 0) - (stats.total_placed ?? 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {byCompanyList.length > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="card-header">
                        <span className="card-title">Top Hiring Companies</span>
                    </div>
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>Total Placements</th>
                                    <th>Placed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {byCompanyList.slice(0, 10).map((c, i) => (
                                    <tr key={i}>
                                        <td><strong>{c.company_name}</strong></td>
                                        <td>{c.total}</td>
                                        <td><Badge variant="active">{c.placed_count}</Badge></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="admin-action-bar">
                <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search user, company, position..." />
                <div className="form-group">
                    <select className="form-input" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                        <option value="">All status</option>
                        <option value="placed">Placed</option>
                        <option value="offer_received">Offer Received</option>
                        <option value="interviewing">Interviewing</option>
                        <option value="not_placed">Not Placed</option>
                    </select>
                </div>
                <div className="form-group">
                    <select className="form-input" value={companyFilter} onChange={(e) => { setCompanyFilter(e.target.value); setPage(1); }}>
                        <option value="">All companies</option>
                        {companies.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <select className="form-input" value={batchFilter} onChange={(e) => { setBatchFilter(e.target.value); setPage(1); }}>
                        <option value="">All batches</option>
                        {byBatchChart.map((b, i) => {
                            const label = `${b.round_label ? `R${b.round_label} ` : ''}${b.batch_label ? `B${b.batch_label}` : ''}`;
                            return label ? <option key={i} value={b.batch_label}>{label}</option> : null;
                        })}
                    </select>
                </div>
                <div className="form-group">
                    <input className="form-input" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} placeholder="From date" style={{ maxWidth: 150 }} />
                </div>
                <div className="form-group">
                    <input className="form-input" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} placeholder="To date" style={{ maxWidth: 150 }} />
                </div>
                <button className="btn btn-primary btn-sm" onClick={openCreate} type="button">+ New Placement</button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setBulkModal(true); setBulkJson(''); }} type="button">Bulk Import</button>
            </div>

            {createModal && (
                <Modal title="Create Placement" onClose={() => { setCreateModal(false); resetForm(); }}
                    footer={[
                        <button key="cancel" className="btn btn-secondary" onClick={() => { setCreateModal(false); resetForm(); }}>Cancel</button>,
                        <button key="save" className="btn btn-primary" disabled={busy || !form.user_id || !form.company_id || !form.position || !form.offer_date} onClick={handleCreate}>
                            {busy ? 'Creating...' : 'Create'}
                        </button>,
                    ]}>
                    <div className="form-group">
                        <label className="form-label">User</label>
                        <input className="form-input" type="text" value={userSearch}
                            onChange={(e) => { setUserSearch(e.target.value); searchUsers(e.target.value); setSelectedUser(null); setForm(p => ({ ...p, user_id: '' })); }}
                            placeholder="Search user by name..." />
                        {userResults.length > 0 && !selectedUser && (
                            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', maxHeight: 150, overflowY: 'auto', marginTop: '0.25rem' }}>
                                {userResults.map((u) => (
                                    <div key={u.id} className="flex flex-center" style={{ padding: '0.4rem 0.5rem', cursor: 'pointer', gap: '0.5rem' }}
                                        onClick={() => { setSelectedUser(u); setForm(p => ({ ...p, user_id: u.id })); setUserSearch(u.name); setUserResults([]); }}>
                                        <span style={{ fontSize: '0.9rem' }}>{u.name}</span>
                                        <span className="text-muted text-xs">{u.email}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {selectedUser && (
                            <div className="flex flex-center" style={{ gap: '0.5rem', marginTop: '0.25rem', padding: '0.4rem 0.5rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)' }}>
                                <span style={{ fontSize: '0.9rem' }}>{selectedUser.name}</span>
                                <span className="text-muted text-xs">{selectedUser.email}</span>
                                <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedUser(null); setUserSearch(''); setForm(p => ({ ...p, user_id: '' })); }} type="button">✕</button>
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Company</label>
                        <select className="form-input" value={form.company_id} onChange={(e) => setForm(p => ({ ...p, company_id: Number(e.target.value) }))}>
                            <option value="">Select company</option>
                            {companies.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Position</label>
                        <input className="form-input" type="text" value={form.position} onChange={(e) => setForm(p => ({ ...p, position: e.target.value }))} />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Offer Date</label>
                            <input className="form-input" type="date" value={form.offer_date} onChange={(e) => setForm(p => ({ ...p, offer_date: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Joining Date (optional)</label>
                            <input className="form-input" type="date" value={form.joining_date} onChange={(e) => setForm(p => ({ ...p, joining_date: e.target.value }))} />
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Salary (optional)</label>
                            <input className="form-input" type="text" value={form.salary} onChange={(e) => setForm(p => ({ ...p, salary: e.target.value }))} placeholder="e.g. 30,000 BDT" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-input" value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}>
                                <option value="placed">Placed</option>
                                <option value="offer_received">Offer Received</option>
                                <option value="interviewing">Interviewing</option>
                                <option value="not_placed">Not Placed</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Notes (optional)</label>
                        <textarea className="form-input" value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} />
                    </div>
                </Modal>
            )}

            {editModal && (
                <Modal title="Edit Placement" onClose={() => setEditModal(null)}
                    footer={[
                        <button key="cancel" className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>,
                        <button key="save" className="btn btn-primary" disabled={busy || !form.position || !form.offer_date} onClick={handleEdit}>
                            {busy ? 'Saving...' : 'Save'}
                        </button>,
                    ]}>
                    <div className="form-group">
                        <label className="form-label">User</label>
                        <input className="form-input" type="text" value={selectedUser?.name || 'User #' + form.user_id} disabled />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Company</label>
                        <select className="form-input" value={form.company_id} onChange={(e) => setForm(p => ({ ...p, company_id: Number(e.target.value) }))}>
                            <option value="">Select company</option>
                            {companies.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Position</label>
                        <input className="form-input" type="text" value={form.position} onChange={(e) => setForm(p => ({ ...p, position: e.target.value }))} />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Offer Date</label>
                            <input className="form-input" type="date" value={form.offer_date} onChange={(e) => setForm(p => ({ ...p, offer_date: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Joining Date (optional)</label>
                            <input className="form-input" type="date" value={form.joining_date} onChange={(e) => setForm(p => ({ ...p, joining_date: e.target.value }))} />
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Salary (optional)</label>
                            <input className="form-input" type="text" value={form.salary} onChange={(e) => setForm(p => ({ ...p, salary: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-input" value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}>
                                <option value="placed">Placed</option>
                                <option value="offer_received">Offer Received</option>
                                <option value="interviewing">Interviewing</option>
                                <option value="not_placed">Not Placed</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Notes (optional)</label>
                        <textarea className="form-input" value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} />
                    </div>
                </Modal>
            )}

            {deleteModal && (
                <Modal title="Delete Placement" onClose={() => setDeleteModal(null)}
                    footer={[
                        <button key="cancel" className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>,
                        <button key="delete" className="btn btn-danger" disabled={busy} onClick={handleDelete}>
                            {busy ? 'Deleting...' : 'Delete'}
                        </button>,
                    ]}>
                    <p>Are you sure you want to delete the placement for <strong>{deleteModal.user?.name}</strong> at <strong>{deleteModal.company?.name}</strong>?</p>
                </Modal>
            )}

            {bulkModal && (
                <Modal title="Bulk Import Placements" onClose={() => setBulkModal(false)}
                    footer={[
                        <button key="cancel" className="btn btn-secondary" onClick={() => setBulkModal(false)}>Cancel</button>,
                        <button key="import" className="btn btn-primary" disabled={busy || !bulkJson.trim()} onClick={handleBulkImport}>
                            {busy ? 'Importing...' : 'Import'}
                        </button>,
                    ]}>
                    <div className="form-group">
                        <label className="form-label">JSON Array of Placements</label>
                        <textarea className="form-input font-mono" value={bulkJson} onChange={(e) => setBulkJson(e.target.value)}
                            rows={10} placeholder={JSON.stringify([{ user_id: 1, company_id: 1, position: 'Software Engineer', offer_date: '2026-05-19', status: 'placed' }], null, 2)} />
                    </div>
                </Modal>
            )}

            {list.length === 0 ? (
                <EmptyState icon="🎯" sub="Create your first placement record to get started.">No placements found</EmptyState>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Batch</th>
                                <th>Course</th>
                                <th>Company</th>
                                <th>Position</th>
                                <th>Offer Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((p) => (
                                <tr key={p.id}>
                                    <td><strong>{p.user?.name || 'Unknown'}</strong></td>
                                    <td className="text-sm text-muted">{p.user?.round ? `R${p.user.round} ` : ''}{p.user?.batch ? `B${p.user.batch}` : ''}</td>
                                    <td className="text-sm text-muted">{p.user?.course || '-'}</td>
                                    <td>{p.company?.name || '-'}</td>
                                    <td>{p.position}</td>
                                    <td className="text-sm text-muted">{p.offer_date ? new Date(p.offer_date).toLocaleDateString() : '-'}</td>
                                    <td><Badge variant={STATUS_VARIANTS[p.status] || 'default'}>{STATUS_LABELS[p.status] || p.status}</Badge></td>
                                    <td>
                                        <div className="admin-actions">
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} type="button">Edit</button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteModal(p)} type="button">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {pagination && pagination.last > 1 && (
                        <div style={{ padding: '0.75rem' }}>
                            <Pagination current={pagination.current} last={pagination.last} onChange={setPage} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function AdminAITags() {
    const { loading, error, data, unauthorized, reload, update } = useApiData('/api/v1/admin/ai/tag-suggestions');
    const [actionId, setActionId] = React.useState(null);
    const [actionBusy, setActionBusy] = React.useState(false);
    const toast = useToast();
    const list = Array.isArray(data) ? data : (data?.data ?? []);

    async function handleApprove(resourceId, approved) {
        setActionId(resourceId);
        setActionBusy(true);
        try {
            await window.axios.patch(`/api/v1/admin/ai/resources/${resourceId}/approve-category`, { approved });
            if (approved) {
                update(resourceId, { ai_category_approved: true });
            } else {
                update(resourceId, { ai_category_approved: false, ai_category: null });
            }
            toast.success(approved ? 'Category approved.' : 'Category rejected.');
            reload();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Action failed.');
        } finally {
            setActionBusy(false);
            setActionId(null);
        }
    }

    if (loading) return <Spinner />;
    if (error) return <EmptyState icon="⚠️">{error}</EmptyState>;
    if (unauthorized) return <EmptyState icon="🔒">Admin access required.</EmptyState>;

    return (
        <div>
            <div className="page-subheader">
                <h3>Resources Awaiting AI Category Approval</h3>
                <p className="text-muted text-sm">Review and approve AI-suggested categories for resources.</p>
            </div>
            {list.length === 0 ? (
                <EmptyState icon="✅" sub="All AI category suggestions have been reviewed.">No pending suggestions</EmptyState>
            ) : (
                <div className="admin-table-wrap" style={{ marginTop: '1rem' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Uploaded by</th>
                                <th>Type</th>
                                <th>Current Category</th>
                                <th>AI Suggestion</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((r) => (
                                <tr key={r.id}>
                                    <td><strong>{r.title}</strong></td>
                                    <td className="text-sm">{r.user?.name || 'Unknown'}</td>
                                    <td><Badge variant="default">{r.type?.replace('_', ' ')}</Badge></td>
                                    <td className="text-sm">{r.category?.name || 'None'}</td>
                                    <td><Badge variant="admin">{r.ai_category}</Badge></td>
                                    <td>
                                        <div className="admin-actions">
                                            <button
                                                className="btn btn-primary btn-sm"
                                                type="button"
                                                disabled={actionBusy}
                                                onClick={() => handleApprove(r.id, true)}
                                            >
                                                {actionBusy && actionId === r.id ? '...' : 'Approve'}
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                type="button"
                                                disabled={actionBusy}
                                                onClick={() => handleApprove(r.id, false)}
                                            >
                                                {actionBusy && actionId === r.id ? '...' : 'Reject'}
                                            </button>
                                        </div>
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

function AdminSkillGaps() {
    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        let cancelled = false;
        async function run() {
            try {
                const res = await window.axios.get('/api/v1/admin/analytics/skill-gaps');
                if (!cancelled) setData(res.data);
            } catch (err) {
                if (!cancelled) setError('Could not load skill gaps.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        run();
        return () => { cancelled = true; };
    }, []);

    if (loading) return <Spinner />;
    if (error) return <EmptyState icon="⚠️">{error}</EmptyState>;
    if (!data) return <EmptyState icon="📊" sub="No data available yet.">No data</EmptyState>;

    const gaps = data.skill_gaps ?? [];
    const inDemand = data.top_in_demand ?? [];
    const available = data.top_available ?? [];
    const maxGap = gaps.length > 0 ? Math.max(...gaps.map(g => g.gap)) : 1;

    return (
        <div>
            <div className="page-subheader">
                <h3>Skill Gap Analysis</h3>
                <p className="text-muted text-sm">Skills in demand by employers vs. skills available among students.</p>
            </div>

            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                <Card>
                    <div className="card-header">
                        <span className="card-title">Top Skills in Demand</span>
                    </div>
                    {inDemand.length === 0 ? (
                        <div className="text-muted text-sm" style={{ padding: '1rem' }}>No job data yet.</div>
                    ) : (
                        <div style={{ padding: '0.75rem' }}>
                            {inDemand.slice(0, 15).map((item, i) => {
                                const maxCount = inDemand[0]?.count || 1;
                                const pct = Math.max(5, (item.count / maxCount) * 100);
                                return (
                                    <div key={i} style={{ marginBottom: '0.5rem' }}>
                                        <div className="flex flex-between" style={{ fontSize: '0.85rem', marginBottom: '0.15rem' }}>
                                            <span>{item.skill}</span>
                                            <span className="text-muted">{item.count} jobs</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px', transition: 'width 0.3s ease' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>

                <Card>
                    <div className="card-header">
                        <span className="card-title">Top Student Skills</span>
                    </div>
                    {available.length === 0 ? (
                        <div className="text-muted text-sm" style={{ padding: '1rem' }}>No student skill data yet.</div>
                    ) : (
                        <div style={{ padding: '0.75rem' }}>
                            {available.slice(0, 15).map((item, i) => {
                                const maxCount = available[0]?.count || 1;
                                const pct = Math.max(5, (item.count / maxCount) * 100);
                                return (
                                    <div key={i} style={{ marginBottom: '0.5rem' }}>
                                        <div className="flex flex-between" style={{ fontSize: '0.85rem', marginBottom: '0.15rem' }}>
                                            <span>{item.skill}</span>
                                            <span className="text-muted">{item.count} students</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: '#22c55e', borderRadius: '4px', transition: 'width 0.3s ease' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>

            <Card>
                <div className="card-header">
                    <span className="card-title">Skill Gaps (Demand - Supply)</span>
                </div>
                {gaps.length === 0 ? (
                    <EmptyState icon="✅" sub="No skill gaps identified.">All skills in balance</EmptyState>
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Skill</th>
                                    <th>Demand (Job Listings)</th>
                                    <th>Supply (Students)</th>
                                    <th>Gap</th>
                                    <th>Bar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gaps.map((item, i) => {
                                    const pct = Math.max(3, (item.gap / maxGap) * 100);
                                    const barColor = item.gap > 10 ? '#ef4444' : item.gap > 5 ? '#f97316' : '#eab308';
                                    return (
                                        <tr key={i}>
                                            <td><strong>{item.skill}</strong></td>
                                            <td>{item.demand}</td>
                                            <td>{item.supply}</td>
                                            <td style={{ color: barColor, fontWeight: 600 }}>{item.gap > 0 ? `+${item.gap}` : item.gap}</td>
                                            <td style={{ minWidth: 120 }}>
                                                <div style={{ height: '12px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 0.3s ease' }} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default function AdminPage({ user }) {
    const [tab, setTab] = React.useState('dashboard');
    const isAdminUser = user?.role === 'super_admin' || user?.role === 'moderator';

    if (!isAdminUser) {
        return (
            <div className="admin-page">
                <div className="page-header">
                    <h1>Admin Panel</h1>
                    <p>Restricted area.</p>
                </div>
                <EmptyState icon="🔒" sub="This area is restricted to administrators and moderators.">
                    Admin access required
                </EmptyState>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1>Admin Panel</h1>
                <p>Reports, user management, and community oversight.</p>
            </div>

            <Tabs tabs={ADMIN_TABS} active={tab} onChange={setTab} />

            {tab === 'dashboard' && <AdminDashboard />}
            {tab === 'events' && <AdminEvents />}
            {tab === 'attendance' && <AdminAttendance />}
            {tab === 'moderation' && <AdminModeration />}
            {tab === 'reports' && <AdminReports />}
            {tab === 'users' && <AdminUsers />}
            {tab === 'announcements' && <AdminAnnouncements />}
            {tab === 'stories' && <AdminSuccessStories />}
            {tab === 'ai-tags' && <AdminAITags />}
            {tab === 'skill-gaps' && <AdminSkillGaps />}
            {tab === 'audit' && <AdminAuditLog />}
            {tab === 'placements' && <AdminPlacements />}
        </div>
    );
}
