import React from 'react';

export default function Tabs({ tabs, active, onChange, className = '' }) {
    return (
        <div className={`tabs ${className}`}>
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    className={`tab ${active === tab.key ? 'active' : ''}`}
                    onClick={() => onChange(tab.key)}
                    type="button"
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
