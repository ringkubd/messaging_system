import React from 'react';

export default function Spinner({ size, className = '' }) {
    const cls = `spinner ${size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : ''} ${className}`;

    return (
        <div className="spinner-wrap">
            <div className={cls} />
        </div>
    );
}
