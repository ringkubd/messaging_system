import { useCallback, useEffect, useState } from 'react';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

export function useApiData(url) {
    const [state, setState] = useState({
        loading: true,
        error: null,
        data: [],
        unauthorized: false,
        pagination: null,
    });
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function run() {
            try {
                const response = await window.axios.get(url);
                const payload = response.data;
                let normalized;
                let pagination = null;

                if (Array.isArray(payload)) {
                    normalized = payload;
                } else if (payload?.data !== undefined) {
                    normalized = payload.data;
                    if (payload.meta) {
                        pagination = {
                            current: payload.meta.current_page,
                            last: payload.meta.last_page,
                            total: payload.meta.total,
                        };
                    }
                } else if (typeof payload === 'object' && payload !== null && payload.id !== undefined) {
                    normalized = payload;
                } else {
                    normalized = [];
                }

                if (!cancelled) {
                    setState({ loading: false, error: null, data: normalized, unauthorized: false, pagination });
                }
            } catch (error) {
                const unauthorized = error?.response?.status === 401;
                if (!cancelled) {
                    setState({
                        loading: false,
                        error: unauthorized ? null : 'Could not load data.',
                        data: [],
                        unauthorized,
                        pagination: null,
                    });
                }
            }
        }

        run();

        return () => { cancelled = true; };
    }, [url, reloadKey]);

    const reload = useCallback(() => setReloadKey((v) => v + 1), []);

    const prepend = useCallback((item) => {
        setState((prev) => ({ ...prev, data: [item, ...(prev.data ?? [])] }));
    }, []);

    const append = useCallback((item) => {
        setState((prev) => ({ ...prev, data: [...(prev.data ?? []), item] }));
    }, []);

    const update = useCallback((id, updates) => {
        setState((prev) => ({
            ...prev,
            data: (prev.data ?? []).map((item) =>
                item.id === id
                    ? (typeof updates === 'function'
                        ? updates(item)
                        : { ...item, ...updates })
                    : item
            ),
        }));
    }, []);

    const remove = useCallback((id) => {
        setState((prev) => ({
            ...prev,
            data: (prev.data ?? []).filter((item) => item.id !== id),
        }));
    }, []);

    const patch = useCallback((updates) => {
        setState((prev) => {
            const current = prev.data;
            if (Array.isArray(current)) {
                return { ...prev, data: current.map((item) => ({ ...item, ...updates })) };
            }
            if (current && typeof current === 'object') {
                return { ...prev, data: { ...current, ...updates } };
            }
            return prev;
        });
    }, []);

    return { ...state, reload, prepend, append, update, remove, patch };
}

export function relativeTime(dateValue) {
    if (!dateValue) return '';
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;

    const years = Math.floor(days / 365);
    return `${years}y ago`;
}

export function SectionState({ loading, error, unauthorized, emptyLabel, icon }) {
    if (loading) return <Spinner />;
    if (unauthorized) return <EmptyState icon="🔒">Please log in first.</EmptyState>;
    if (error) return <EmptyState icon="⚠️">{error}</EmptyState>;
    return <EmptyState icon={icon || '📭'}>{emptyLabel || 'Nothing here yet.'}</EmptyState>;
}
