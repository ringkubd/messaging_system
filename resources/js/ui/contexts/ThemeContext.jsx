import React from 'react';

const ThemeContext = React.createContext();

function getInitialTheme() {
    try {
        const stored = localStorage.getItem('theme');
        if (stored === 'dark' || stored === 'light') return stored;
    } catch {}
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = React.useState(getInitialTheme);

    React.useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        try {
            localStorage.setItem('theme', theme);
        } catch {}
    }, [theme]);

    const toggleTheme = React.useCallback(() => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    const value = React.useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = React.useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}

export default ThemeContext;
