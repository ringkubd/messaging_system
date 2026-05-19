import React from 'react';

export default function EmptyState({ icon = '📭', children, sub }) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">{icon}</div>
            <div className="empty-state-text">{children}</div>
            {sub && <div className="empty-state-sub">{sub}</div>}
        </div>
    );
}
