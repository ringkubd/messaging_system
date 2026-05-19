import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { relativeTime } from './common';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

const TYPE_TABS = [
    { key: 'all', label: 'All' },
    { key: 'users', label: 'Users' },
    { key: 'posts', label: 'Posts' },
    { key: 'groups', label: 'Groups' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'resources', label: 'Resources' },
];

const TYPE_ICONS = {
    user: '👤',
    post: '📝',
    group: '🏘️',
    job: '💼',
    resource: '📄',
};

function ResultItem({ item }) {
    const icon = TYPE_ICONS[item.type] || '📌';
    const subtitle = item.type === 'post' && item.created_at
        ? relativeTime(item.created_at)
        : item.subtitle;

    return (
        <Link to={item.url} className="search-result-item">
            <div className="search-result-icon">{icon}</div>
            <div className="search-result-content">
                <div className="search-result-title">{item.title}</div>
                {subtitle && <div className="search-result-subtitle">{subtitle}</div>}
                {item.snippet && <div className="search-result-snippet">{item.snippet}</div>}
            </div>
        </Link>
    );
}

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const qFromUrl = searchParams.get('q') || '';
    const typeFromUrl = searchParams.get('type') || 'all';
    const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);

    const [searchInput, setSearchInput] = React.useState(qFromUrl);
    const [debouncedQuery, setDebouncedQuery] = React.useState(qFromUrl);
    const [type, setType] = React.useState(typeFromUrl);
    const [page, setPage] = React.useState(pageFromUrl);
    const [results, setResults] = React.useState([]);
    const [typeCounts, setTypeCounts] = React.useState({});
    const [total, setTotal] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchInput);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    React.useEffect(() => {
        if (debouncedQuery !== qFromUrl || type !== typeFromUrl || page !== pageFromUrl) {
            const params = { q: debouncedQuery };
            if (type !== 'all') params.type = type;
            if (page > 1) params.page = String(page);
            setSearchParams(params, { replace: true });
        }
    }, [debouncedQuery, type, page]);

    React.useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults([]);
            setTypeCounts({});
            setTotal(0);
            setLoading(false);
            setError(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ q: debouncedQuery });
        if (type !== 'all') params.set('type', type);
        params.set('page', String(page));

        window.axios.get('/api/v1/search?' + params.toString())
            .then((res) => {
                if (cancelled) return;
                setResults(res.data.results || []);
                setTypeCounts(res.data.types || {});
                setTotal(res.data.total || 0);
                setLoading(false);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err?.response?.data?.message || 'Search failed.');
                setLoading(false);
            });

        return () => { cancelled = true; };
    }, [debouncedQuery, type, page]);

    function handleSearchChange(value) {
        setSearchInput(value);
        setPage(1);
    }

    function handleTypeChange(newType) {
        setType(newType);
        setPage(1);
    }

    function handlePageChange(newPage) {
        setPage(newPage);
    }

    const totalPages = Math.max(1, Math.ceil(total / 20));

    return (
        <div className="search-page">
            <div className="search-page-header">
                <h1>Search</h1>
                <p>Find people, posts, communities, jobs, and resources.</p>
            </div>

            <div className="search-input-wrap">
                <span className="search-input-icon">🔎</span>
                <input
                    className="form-input search-input"
                    type="text"
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search anything..."
                    autoFocus
                />
                {searchInput && (
                    <button
                        className="search-input-clear"
                        onClick={() => { handleSearchChange(''); setDebouncedQuery(''); }}
                        type="button"
                    >
                        ✕
                    </button>
                )}
            </div>

            {debouncedQuery.trim() && (
                <div className="tabs search-tabs">
                    {TYPE_TABS.map((t) => (
                        <button
                            key={t.key}
                            className={`tab ${type === t.key ? 'active' : ''}`}
                            onClick={() => handleTypeChange(t.key)}
                            type="button"
                        >
                            {t.label}
                            {typeCounts[t.key] > 0 && (
                                <span className="search-tab-count">{typeCounts[t.key]}</span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {loading && (
                <div className="search-loading">
                    <Spinner />
                </div>
            )}

            {error && (
                <EmptyState icon="⚠️">{error}</EmptyState>
            )}

            {!loading && !error && debouncedQuery.trim() && results.length === 0 && (
                <EmptyState icon="🔎" sub="Try a different search term.">
                    No results found
                </EmptyState>
            )}

            {!loading && !error && results.length > 0 && (
                <>
                    <div className="search-results-count">
                        Found {total} result{total !== 1 ? 's' : ''}
                    </div>
                    <div className="search-results-list">
                        {results.map((item, idx) => (
                            <ResultItem key={item.type + '-' + item.id + '-' + idx} item={item} />
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <Pagination
                            current={page}
                            last={totalPages}
                            onChange={handlePageChange}
                        />
                    )}
                </>
            )}

            {!debouncedQuery.trim() && (
                <div className="search-empty-state">
                    <EmptyState icon="🔎" sub="Search across users, posts, communities, jobs, and resources.">
                        Start typing to search
                    </EmptyState>
                </div>
            )}
        </div>
    );
}
