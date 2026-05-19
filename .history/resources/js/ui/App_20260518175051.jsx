import React from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import ChatsPage from './pages/ChatsPage';
import CommunitiesPage from './pages/CommunitiesPage';
import FeedPage from './pages/FeedPage';
import FriendsPage from './pages/FriendsPage';
import ModerationPage from './pages/ModerationPage';
import NotificationsPage from './pages/NotificationsPage';

const navItems = [
    { to: '/feed', label: 'Feed' },
    { to: '/chats', label: 'Chats' },
    { to: '/friends', label: 'Friends' },
    { to: '/communities', label: 'Communities' },
    { to: '/notifications', label: 'Notifications' },
    { to: '/moderation', label: 'Moderation' },
];

function App() {
    const [authChecked, setAuthChecked] = React.useState(false);
    const [user, setUser] = React.useState(null);
    const [mode, setMode] = React.useState('login');
    const [formState, setFormState] = React.useState({
        name: '',
        email: '',
        password: '',
        round: '',
        batch: '',
        course: '',
    });
    const [authError, setAuthError] = React.useState('');
    const [authBusy, setAuthBusy] = React.useState(false);

    React.useEffect(() => {
        let mounted = true;

        async function run() {
            try {
                const response = await window.axios.get('/api/v1/me');
                if (mounted) {
                    setUser(response.data);
                }
            } catch {
                if (mounted) {
                    setUser(null);
                }
            } finally {
                if (mounted) {
                    setAuthChecked(true);
                }
            }
        }

        run();

        return () => {
            mounted = false;
        };
    }, []);

    function onFormChange(event) {
        const { name, value } = event.target;
        setFormState((previous) => ({ ...previous, [name]: value }));
    }

    async function onAuthSubmit(event) {
        event.preventDefault();
        setAuthError('');

        try {
            setAuthBusy(true);
            const payload = mode === 'register'
                ? {
                    name: formState.name,
                    email: formState.email,
                    password: formState.password,
                    round: formState.round || null,
                    batch: formState.batch || null,
                    course: formState.course || null,
                }
                : {
                    email: formState.email,
                    password: formState.password,
                };

            const endpoint = mode === 'register' ? '/api/v1/auth/register' : '/api/v1/auth/login';
            const response = await window.axios.post(endpoint, payload);
            const token = response.data?.token;

            if (!token) {
                throw new Error('No token received from server.');
            }

            window.localStorage.setItem('messagesing_token', token);
            window.axios.defaults.headers.common.Authorization = `Bearer ${token}`;

            const meResponse = await window.axios.get('/api/v1/me');
            setUser(meResponse.data);
        } catch (error) {
            setAuthError(error?.response?.data?.message || 'Could not authenticate.');
        } finally {
            setAuthBusy(false);
        }
    }

    async function logout() {
        try {
            await window.axios.post('/api/v1/auth/logout');
        } catch {
            // Ignore logout failure and clear local session anyway.
        }

        window.localStorage.removeItem('messagesing_token');
        delete window.axios.defaults.headers.common.Authorization;
        setUser(null);
    }

    if (!authChecked) {
        return (
            <div className="shell">
                <main className="content-card">
                    <div className="helper loading">Checking login session...</div>
                </main>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="shell">
                <div className="background-mesh" aria-hidden="true" />
                <main className="content-card auth-card">
                    <div className="section-head">
                        <h2>{mode === 'register' ? 'Create account' : 'Login required'}</h2>
                        <p>Use your community account to access MessageSing.</p>
                    </div>

                    <form className="composer" onSubmit={onAuthSubmit}>
                        {mode === 'register' ? (
                            <input
                                className="composer-input"
                                name="name"
                                value={formState.name}
                                onChange={onFormChange}
                                placeholder="Full name"
                                required
                            />
                        ) : null}

                        <input
                            className="composer-input"
                            type="email"
                            name="email"
                            value={formState.email}
                            onChange={onFormChange}
                            placeholder="Email"
                            required
                        />

                        <input
                            className="composer-input"
                            type="password"
                            name="password"
                            value={formState.password}
                            onChange={onFormChange}
                            placeholder="Password"
                            required
                        />

                        {mode === 'register' ? (
                            <>
                                <input
                                    className="composer-input"
                                    name="round"
                                    value={formState.round}
                                    onChange={onFormChange}
                                    placeholder="Round (optional)"
                                />
                                <input
                                    className="composer-input"
                                    name="batch"
                                    value={formState.batch}
                                    onChange={onFormChange}
                                    placeholder="Batch (optional)"
                                />
                                <input
                                    className="composer-input"
                                    name="course"
                                    value={formState.course}
                                    onChange={onFormChange}
                                    placeholder="Course (optional)"
                                />
                            </>
                        ) : null}

                        <div className="composer-actions">
                            <button className="action-btn" disabled={authBusy} type="submit">
                                {authBusy ? 'Please wait...' : mode === 'register' ? 'Register' : 'Login'}
                            </button>
                            <button
                                className="action-btn"
                                type="button"
                                onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                            >
                                {mode === 'register' ? 'Have account? Login' : 'No account? Register'}
                            </button>
                        </div>
                        {authError ? <span className="error-text">{authError}</span> : null}
                    </form>
                </main>
            </div>
        );
    }

    return (
        <div className="shell">
            <div className="background-mesh" aria-hidden="true" />
            <header className="topbar">
                <div className="brand-wrap">
                    <p className="eyebrow">ISDB-BISEW Scholarship X Community</p>
                    <h1 className="brand">ISDB-BISEW Students Community</h1>
                </div>
                <div className="topbar-actions">
                    <span className="status-pill">Signed in as {user.name}</span>
                    <button className="action-btn" type="button" onClick={logout}>
                        Logout
                    </button>
                </div>
            </header>

            <nav className="nav-grid" aria-label="Primary">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            isActive ? 'nav-chip nav-chip-active' : 'nav-chip'
                        }
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <main className="content-card">
                <Routes>
                    <Route path="/" element={<Navigate to="/feed" replace />} />
                    <Route path="/feed" element={<FeedPage />} />
                    <Route path="/chats" element={<ChatsPage />} />
                    <Route path="/friends" element={<FriendsPage />} />
                    <Route path="/communities" element={<CommunitiesPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/moderation" element={<ModerationPage />} />
                    <Route path="*" element={<Navigate to="/feed" replace />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
