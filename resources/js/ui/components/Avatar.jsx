import React from 'react';

const COLORS = [
    '#1a6b4c', '#c9772e', '#2563eb', '#7c3aed', '#db2777',
    '#0891b2', '#65a30d', '#ca8a04', '#dc2626', '#0d9488',
];

function getColor(name) {
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export default function Avatar({ name, size, className = '', src }) {
    const sz = size === 'sm' ? 32 : size === 'lg' ? 56 : size === 'xl' ? 80 : 40;
    const cls = `avatar ${size ? `avatar-${size}` : ''} ${className}`;

    if (src) {
        return (
            <img
                className={cls}
                src={src}
                alt={name}
                style={{ width: sz, height: sz, objectFit: 'cover', borderRadius: '50%' }}
                title={name}
            />
        );
    }

    return (
        <div
            className={cls}
            style={{ backgroundColor: getColor(name), width: sz, height: sz, fontSize: sz * 0.4 }}
            title={name}
        >
            {getInitials(name)}
        </div>
    );
}
