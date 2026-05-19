import React from 'react';

export default function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
    return (
        <div className={`form-group ${className}`}>
            <input
                className="form-input"
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}
