import { useEffect, useState } from 'react';

export function useApiData(url) {
    const [state, setState] = useState({
        loading: true,
        error: null,
        data: [],
        unauthorized: false,
    });

    useEffect(() => {
        let cancelled = false;

        async function run() {
            try {
                const response = await window.axios.get(url);
                const payload = response.data;
                const normalized = Array.isArray(payload) ? payload : payload?.data ?? [];

                if (!cancelled) {
                    setState({ loading: false, error: null, data: normalized, unauthorized: false });
                }
            } catch (error) {
                const unauthorized = error?.response?.status === 401;
                if (!cancelled) {
                    setState({
                        loading: false,
                        error: unauthorized ? null : 'Could not load data for this section.',
                        data: [],
                        unauthorized,
                    });
                }
            }
        }

        run();

        return () => {
            cancelled = true;
        };
    }, [url]);

    return state;
}

export function SectionState({ loading, error, unauthorized, emptyLabel }) {
    if (loading) {
        return <div className="helper loading">Loading...</div>;
    }

    if (unauthorized) {
        return <div className="helper warn">Please log in first to load this data.</div>;
    }

    if (error) {
        return <div className="helper error">{error}</div>;
    }

    return <div className="helper">{emptyLabel}</div>;
}
