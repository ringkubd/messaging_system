import React from 'react';

const ToastContext = React.createContext();

export function ToastProvider({ children }) {
    const [toasts, setToasts] = React.useState([]);
    const idRef = React.useRef(0);

    const add = React.useCallback((message, type = 'info', duration = 3500) => {
        const id = ++idRef.current;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const toast = React.useMemo(() => ({
        success: (msg) => add(msg, 'success'),
        error: (msg) => add(msg, 'error'),
        info: (msg) => add(msg, 'info'),
    }), [add]);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="toast-container">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return React.useContext(ToastContext);
}
