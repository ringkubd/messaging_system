import React from 'react';

export default function Pagination({ current, last, onChange }) {
    if (!last || last <= 1) return null;

    const pages = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(last, current + 2);

    if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) pages.push(i);

    if (end < last) {
        if (end < last - 1) pages.push('...');
        pages.push(last);
    }

    return (
        <div className="pagination">
            <button
                className="page-btn"
                disabled={current === 1}
                onClick={() => onChange(current - 1)}
                type="button"
            >
                &larr;
            </button>
            {pages.map((p, i) =>
                p === '...' ? (
                    <span key={`e${i}`} className="page-btn" style={{ border: 'none', cursor: 'default' }}>...</span>
                ) : (
                    <button
                        key={p}
                        className={`page-btn ${p === current ? 'active' : ''}`}
                        onClick={() => onChange(p)}
                        type="button"
                    >
                        {p}
                    </button>
                )
            )}
            <button
                className="page-btn"
                disabled={current === last}
                onClick={() => onChange(current + 1)}
                type="button"
            >
                &rarr;
            </button>
        </div>
    );
}
