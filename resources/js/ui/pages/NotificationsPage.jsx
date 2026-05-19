import React from 'react';
import { SectionState, useApiData, relativeTime } from './common';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';

function notificationText(notification) {
    const d = notification.data || {};
    const actor = d.actor_name || d.actor || 'Someone';
    const kind = d.kind || 'Activity';

    const kindMap = {
        like: `${actor} liked your post`,
        comment: `${actor} commented on your post`,
        reply: `${actor} replied to your comment`,
        message: `${actor} sent you a message`,
        follow: `${actor} started following you`,
        friend_request: `${actor} sent you a friend request`,
        friend_accepted: `${actor} accepted your friend request`,
        mention: `${actor} mentioned you`,
        post: `${actor} posted in your community`,
        community_join: `${actor} joined your community`,
    };

    return kindMap[kind] || d.body_preview || d.message || `${actor} ${kind}`;
}

function notificationIcon(kind) {
    const map = {
        like: '❤️',
        comment: '💬',
        reply: '↩️',
        message: '✉️',
        follow: '➕',
        friend_request: '🤝',
        friend_accepted: '✅',
        mention: '@️',
        post: '📝',
        community_join: '🏘️',
    };
    return map[kind] || '🔔';
}

export default function NotificationsPage() {
    const { loading, error, data, unauthorized, reload, update } = useApiData('/api/v1/notifications');
    const [busyIds, setBusyIds] = React.useState(new Set());

    async function markAllRead() {
        try {
            await window.axios.post('/api/v1/notifications/read-all');
            reload();
        } catch {
            /* ignore */
        }
    }

    async function markOneRead(notification) {
        if (notification.read_at || busyIds.has(notification.id)) return;
        setBusyIds((prev) => new Set(prev).add(notification.id));
        try {
            await window.axios.post(`/api/v1/notifications/${notification.id}/read`);
            update(notification.id, { read_at: new Date().toISOString() });
        } catch {
            /* ignore */
        } finally {
            setBusyIds((prev) => {
                const next = new Set(prev);
                next.delete(notification.id);
                return next;
            });
        }
    }

    const list = Array.isArray(data) ? data : [];
    const unreadCount = list.filter((n) => !n.read_at).length;

    return (
        <div>
            <div className="page-header page-header-actions">
                <div>
                    <h1>Notifications</h1>
                    <p>Stay updated with community activity.</p>
                </div>
                {list.length > 0 && (
                    <button className="btn btn-secondary" onClick={markAllRead} type="button">
                        Mark all read
                    </button>
                )}
            </div>

            {loading || error || unauthorized ? (
                <SectionState loading={loading} error={error} unauthorized={unauthorized} emptyLabel="" />
            ) : list.length === 0 ? (
                <EmptyState icon="🔔" sub="You'll see notifications here when someone interacts with you.">No notifications yet</EmptyState>
            ) : (
                <div className="stack">
                    {unreadCount > 0 && (
                        <div className="notification-section-label">Unread ({unreadCount})</div>
                    )}
                    {list.map((notification) => {
                        const isUnread = !notification.read_at;
                        const actorName = notification.data?.actor_name || notification.data?.actor || 'System';
                        return (
                            <Card
                                key={notification.id}
                                hover
                                className={isUnread ? 'notification-unread' : 'notification-read'}
                                onClick={() => markOneRead(notification)}
                                role="button"
                            >
                                <div className="notification-item">
                                    <div className="notification-icon">{notificationIcon(notification.data?.kind)}</div>
                                    <div className="notification-body">
                                        <div className="notification-header">
                                            <span className="notification-text">{notificationText(notification)}</span>
                                            {isUnread && <span className="notification-dot" />}
                                        </div>
                                        <div className="notification-meta">
                                            <span className="text-muted">{relativeTime(notification.created_at)}</span>
                                            {notification.data?.url && (
                                                <a
                                                    href={notification.data.url}
                                                    className="notification-link"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    View →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
