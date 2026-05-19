import React from 'react';
import { useApiData } from './common';
import Avatar from '../components/Avatar';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const PERIOD_TABS = [
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'all', label: 'All Time' },
];

function RankBadge({ rank }) {
    if (rank === 1) {
        return <span className="leaderboard-rank leaderboard-rank-gold" style={{ fontSize: '1.5rem' }}>🥇</span>;
    }
    if (rank === 2) {
        return <span className="leaderboard-rank leaderboard-rank-silver" style={{ fontSize: '1.5rem' }}>🥈</span>;
    }
    if (rank === 3) {
        return <span className="leaderboard-rank leaderboard-rank-bronze" style={{ fontSize: '1.5rem' }}>🥉</span>;
    }
    return <span className="leaderboard-rank" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{rank}</span>;
}

export default function LeaderboardPage({ user }) {
    const [period, setPeriod] = React.useState('weekly');
    const [page, setPage] = React.useState(1);
    const { loading, data: leaderboard } = useApiData(`/api/v1/leaderboard?period=${period}&limit=50`);

    const entries = Array.isArray(leaderboard) ? leaderboard : [];
    const itemsPerPage = 20;
    const totalPages = Math.ceil(entries.length / itemsPerPage);
    const paginatedEntries = entries.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    function getPeriodLabel(key) {
        const tab = PERIOD_TABS.find((t) => t.key === key);
        return tab ? tab.label : 'All Time';
    }

    return (
        <div className="leaderboard-page">
            <div className="page-header">
                <h1>Leaderboard</h1>
            </div>

            <div className="tabs" style={{ marginBottom: '1.5rem' }}>
                {PERIOD_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        className={`tab ${period === tab.key ? 'tab-active' : ''}`}
                        onClick={() => { setPeriod(tab.key); setPage(1); }}
                        type="button"
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <Spinner />
            ) : paginatedEntries.length === 0 ? (
                <EmptyState icon="🏆" sub="Be the first to earn points and claim the top spot!">
                    No leaderboard data yet
                </EmptyState>
            ) : (
                <div className="leaderboard-list">
                    {paginatedEntries.map((entry, index) => {
                        const rank = (page - 1) * itemsPerPage + index + 1;
                        const isCurrentUser = user && entry.id === user.id;
                        const isTop3 = rank <= 3;

                        return (
                            <div
                                key={entry.id}
                                className={`leaderboard-item ${isCurrentUser ? 'leaderboard-item-current' : ''} ${isTop3 ? 'leaderboard-item-top' : ''}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: isCurrentUser ? 'var(--bg-secondary)' : undefined,
                                    border: isCurrentUser ? '2px solid var(--primary)' : undefined,
                                    marginBottom: '0.25rem',
                                }}
                            >
                                <div style={{ width: '2.5rem', textAlign: 'center' }}>
                                    <RankBadge rank={rank} />
                                </div>

                                <Avatar name={entry.name} size="md" src={entry.avatar} />

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                        {entry.name}
                                        {isCurrentUser && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginLeft: '0.5rem' }}>(you)</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {entry.batch ? `Batch ${entry.batch}` : ''}
                                        {entry.round ? ` · Round ${entry.round}` : ''}
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>
                                        {period === 'all' ? entry.points : period === 'weekly' ? entry.weekly_points : entry.monthly_points}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        pts · {entry.badges_count ?? 0} badges
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {totalPages > 1 && (
                <Pagination current={page} last={totalPages} onChange={setPage} />
            )}
        </div>
    );
}
