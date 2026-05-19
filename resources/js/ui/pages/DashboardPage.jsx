import React from 'react';
import { useApiData, relativeTime } from './common';
import Badge from '../components/Badge';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import Avatar from '../components/Avatar';
import Spinner from '../components/Spinner';

function QuickStat({ label, value, icon, href }) {
    const content = (
        <div className="quick-stat">
            <div className="quick-stat-icon">{icon}</div>
            <div className="quick-stat-value">{value ?? 0}</div>
            <div className="quick-stat-label">{label}</div>
        </div>
    );
    if (href) {
        return <a href={href} className="quick-stat-link">{content}</a>;
    }
    return content;
}

function BatchmateCard({ member }) {
    return (
        <div className="batchmate-card">
            <Avatar name={member.name} size="md" />
            <div className="batchmate-info">
                <div className="batchmate-name">{member.name}</div>
                <div className="batchmate-detail">
                    {member.round && <span>Round {member.round}</span>}
                    {member.batch && <span> Batch {member.batch}</span>}
                </div>
            </div>
            <a href={`/chats`} className="btn btn-secondary btn-sm">Message</a>
        </div>
    );
}

function ActivityItem({ type, title, time, meta }) {
    return (
        <div className="activity-item">
            <div className="activity-dot activity-dot-{type}" />
            <div className="activity-body">
                <div className="activity-title">{title}</div>
                <div className="activity-meta">{meta} · {relativeTime(time)}</div>
            </div>
        </div>
    );
}

function NoticeBoard({ pinned, announcements }) {
    const [expanded, setExpanded] = React.useState(null);

    const typeBadgeVariant = (type) => {
        const map = { notice: 'pending', announcement: 'default', news: 'admin', event_banner: 'active' };
        return map[type] || 'default';
    };

    const typeLabel = (type) => {
        const map = { notice: 'Notice', announcement: 'Announcement', news: 'News', event_banner: 'Event' };
        return map[type] || type;
    };

    return (
        <Card className="notice-board">
            <div className="card-title">Notice Board</div>
            {pinned && pinned.length > 0 && (
                <div className="notice-pinned">
                    {pinned.map((a) => (
                        <div key={a.id} className="notice-card notice-card-pinned" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                            <div className="notice-card-header">
                                <div className="notice-card-title-row">
                                    <span className="notice-pin-icon">📌</span>
                                    <span className="notice-card-title">{a.title}</span>
                                    <Badge variant={typeBadgeVariant(a.type)}>{typeLabel(a.type)}</Badge>
                                </div>
                                <span className="notice-card-date">{a.published_at ? relativeTime(a.published_at) : ''}</span>
                            </div>
                            <div className={`notice-card-body ${expanded === a.id ? 'notice-card-body-expanded' : ''}`}>
                                {a.body.length > 150 && expanded !== a.id
                                    ? a.body.slice(0, 150) + '...'
                                    : a.body}
                            </div>
                            {a.body.length > 150 && (
                                <button className="notice-expand-btn" onClick={(e) => { e.stopPropagation(); setExpanded(expanded === a.id ? null : a.id); }} type="button">
                                    {expanded === a.id ? 'Show less' : 'Read more'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {announcements && announcements.length > 0 && (
                <div className="notice-list">
                    <div className="notice-list-title">Recent Announcements</div>
                    {announcements.map((a) => (
                        <div key={a.id} className="notice-item" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                            <div className="notice-item-header">
                                <span className="notice-item-title">{a.title}</span>
                                <Badge variant={typeBadgeVariant(a.type)}>{typeLabel(a.type)}</Badge>
                            </div>
                            <div className="notice-item-body">
                                {a.body.length > (expanded === a.id ? 10000 : 100)
                                    ? (expanded === a.id ? a.body : a.body.slice(0, 100) + '...')
                                    : a.body}
                            </div>
                            <div className="notice-item-meta">
                                {relativeTime(a.published_at || a.created_at)}
                                {a.is_pinned && <span className="notice-pinned-indicator">📌 Pinned</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {(!pinned || pinned.length === 0) && (!announcements || announcements.length === 0) && (
                <EmptyState icon="📢" sub="No announcements yet.">Notice Board</EmptyState>
            )}
        </Card>
    );
}

export default function DashboardPage({ user }) {
    const { loading, error, data: stats } = useApiData('/api/v1/me/stats');
    const { data: pinnedData } = useApiData('/api/v1/announcements/featured');
    const { data: announcementsData } = useApiData('/api/v1/announcements?per_page=5');
    const batchParams = React.useMemo(() => {
        const p = new URLSearchParams();
        if (user?.round) p.set('round', user.round);
        if (user?.batch) p.set('batch', user.batch);
        p.set('per_page', '6');
        return p.toString();
    }, [user?.round, user?.batch]);
    const { loading: batchLoading, data: batchmates } = useApiData(`/api/v1/users?${batchParams}`);

    const isStudent = user?.role === 'user';
    const userBadge = user?.role === 'super_admin' || user?.role === 'moderator' ? 'admin' : 'student';

    const hasBatch = user?.round || user?.batch;
    const batchList = Array.isArray(batchmates) ? batchmates.filter((m) => m.id !== user?.id).slice(0, 5) : [];

    const pinned = Array.isArray(pinnedData) ? pinnedData : [];
    const announcements = Array.isArray(announcementsData) ? announcementsData : [];

    const recentPosts = stats?.recent_posts ?? [];
    const recentComments = stats?.recent_comments ?? [];
    const allActivity = [
        ...recentPosts.map((p) => ({ type: 'post', id: `p-${p.id}`, title: p.body, time: p.created_at, meta: p.community ? `in ${p.community.name}` : 'Post' })),
        ...recentComments.map((c) => ({ type: 'comment', id: `c-${c.id}`, title: c.body, time: c.created_at, meta: c.post?.body ? `on "${c.post.body}"` : 'Comment' })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);

    return (
        <div className="dashboard-page">
            <div className="welcome-banner">
                <h2>Welcome back, {user?.name}</h2>
                <p>IsDB-BISEW IT Scholarship Community — Connect with fellow scholars, alumni, and batchmates.</p>
                <div className="welcome-banner-badges">
                    <Badge variant={userBadge}>{user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'moderator' ? 'Moderator' : 'Student'}</Badge>
                    {user?.round && <Badge variant="default">Round {user.round}</Badge>}
                    {user?.batch && <Badge variant="default">Batch {user.batch}</Badge>}
                    {user?.course && <Badge variant="default">{user.course}</Badge>}
                </div>
            </div>

            <NoticeBoard pinned={pinned} announcements={announcements} />

            <div className="quick-stats-row">
                <QuickStat label="Posts" value={stats?.posts_count} icon="📝" href="/feed" />
                <QuickStat label="Comments" value={stats?.comments_count} icon="💬" href="/feed" />
                <QuickStat label="Messages" value={stats?.unread_messages_count} icon="✉️" href="/chats" />
                <QuickStat label="Notifications" value={stats?.unread_notifications_count} icon="🔔" href="/notifications" />
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-main">
                    {hasBatch && (
                        <Card>
                            <div className="card-title">Your Batch</div>
                            <p className="text-sm text-muted" style={{ marginBottom: '0.75rem' }}>
                                Scholars in Round {user?.round} Batch {user?.batch}
                            </p>
                            {batchLoading ? (
                                <Spinner />
                            ) : batchList.length === 0 ? (
                                <EmptyState icon="👋" sub="No batchmates found yet. Invite friends to join!">No batchmates</EmptyState>
                            ) : (
                                <div className="batchmate-list">
                                    {batchList.map((member) => (
                                        <BatchmateCard key={member.id} member={member} />
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}

                    <Card>
                        <div className="card-title">Recent Activity</div>
                        {loading ? (
                            <Spinner />
                        ) : allActivity.length === 0 ? (
                            <EmptyState icon="📭" sub="Your posts and comments will appear here.">No activity yet</EmptyState>
                        ) : (
                            <div className="activity-list">
                                {allActivity.map((item) => (
                                    <ActivityItem key={item.id} type={item.type} title={item.title} time={item.time} meta={item.meta} />
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                <div className="dashboard-side">
                    <Card>
                        <div className="card-title">Quick Actions</div>
                        <div className="stack stack-sm">
                            <a href="/feed" className="btn btn-secondary btn-sm" style={{ textAlign: 'left' }}>
                                📝 Create a post
                            </a>
                            <a href="/directory" className="btn btn-secondary btn-sm" style={{ textAlign: 'left' }}>
                                🔍 Find batchmates
                            </a>
                            <a href="/chats" className="btn btn-secondary btn-sm" style={{ textAlign: 'left' }}>
                                💬 Start a conversation
                            </a>
                            <a href="/communities" className="btn btn-secondary btn-sm" style={{ textAlign: 'left' }}>
                                🏘️ Browse communities
                            </a>
                        </div>
                    </Card>

                    <Card>
                        <div className="card-title">Your Info</div>
                        <div className="stack stack-sm text-sm">
                            <div><span className="text-muted">Name:</span> {user?.name}</div>
                            <div><span className="text-muted">Email:</span> {user?.email}</div>
                            {user?.round && <div><span className="text-muted">Round:</span> {user.round}</div>}
                            {user?.batch && <div><span className="text-muted">Batch:</span> {user.batch}</div>}
                            {user?.course && <div><span className="text-muted">Course:</span> {user.course}</div>}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
