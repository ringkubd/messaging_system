import React from 'react';

export default function Card({ children, className = '', hover = false, onClick, role, style }) {
    return (
        <div className={`card ${hover ? 'card-hover' : ''} ${className}`} onClick={onClick} role={role} style={style}>
            {children}
        </div>
    );
}
