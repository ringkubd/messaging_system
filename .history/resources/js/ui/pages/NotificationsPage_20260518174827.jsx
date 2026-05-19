import React from 'react';
import { SectionState, useApiData } from './common';

function NotificationsPage() {
    const { loading, error, data, unauthorized } = useApiData('/api/v1/notifications');

    async function markAllRead() {
        try {
            await window.axios.post('/api/v1/notifications/read-all');
            window.location.reload();
        } catch {
            // Ignore in this starter shell.
        }
    }

    return (
        <section>
            <div className="section-head section-head-action">
                <div>
                    <h2>Notifications</h2>
                    <p>In-app updates for chats, feed activity, and moderation.</p>
                </div>
                <button className="action-btn" onClick={markAllRead} type="button">
                    Mark all read
                </button>
            </div>

            {loading || error || unauthorized ? (
                <SectionState
                    loading={loading}
                    error={error}
                    unauthorized={unauthorized}
                    emptyLabel=""
                />
            ) : data.length === 0 ? (
                <SectionState emptyLabel="No notifications yet." />
            ) : (
                <div className="stack">
                    {data.map((notification) => (
                        <article className="tile" key={notification.id}>
                            <div className="tile-head">
                                <strong>{notification.data?.kind || 'Activity'}</strong>
                                <span className="tag">
                                    {notification.read_at ? 'read' : 'unread'}
                                </span>
                            </div>
                            <p>{notification.data?.body_preview || 'Open detail for full payload.'}</p>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

export default NotificationsPage;
