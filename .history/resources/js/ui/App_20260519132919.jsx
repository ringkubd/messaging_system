import React from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Avatar from './components/Avatar';
import Badge from './components/Badge';
import DashboardPage from './pages/DashboardPage';
import FeedPage from './pages/FeedPage';
import ChatsPage from './pages/ChatsPage';
import DirectoryPage from './pages/DirectoryPage';
import CommunitiesPage from './pages/CommunitiesPage';
import CommunityDetailPage from './pages/CommunityDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import FriendsPage from './pages/FriendsPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';

function AuthScreen({ mode, setMode, formState, onFormChange, onAuthSubmit, authError, authBusy }) {
    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">IB</div>
                <h1 className="auth-title">IsDB-BISEW Connect</h1>
                <p className="auth-subtitle">{mode === 'register' ? 'Create your community account' : 'Sign in to your account'}</p>

                <form onSubmit={onAuthSubmit}>
                    {mode === 'register' && (
                        <div className="form-group">
                            <label className="form-label">Full name</label>
                            <input className="form-input" name="name" value={formState.name} onChange={onFormChange} placeholder="e.g. Anwar Hossain" required />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-input" type="email" name="email" value={formState.email} onChange={onFormChange} placeholder="your@email.com" required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" name="password" value={formState.password} onChange={onFormChange} placeholder="Min. 8 characters" required />
                    </div>

                    {mode === 'register' && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Round (optional)</label>
                                <input className="form-input" name="round" value={formState.round} onChange={onFormChange} placeholder="e.g. 2024" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Batch (optional)</label>
                                <input className="form-input" name="batch" value={formState.batch} onChange={onFormChange} placeholder="e.g. 4" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Course (optional)</label>
                                <input className="form-input" name="course" value={formState.course} onChange={onFormChange} placeholder="e.g. Web Development" />
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={authBusy} type="submit">
                            {authBusy ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Sign In'}
                        </button>
                    </div>

                    {authError && <div className="form-error" style={{ textAlign: 'center' }}>{authError}</div>}
                </form>

                <div className="auth-toggle">
                    {mode === 'register' ? 'Already have an account? ' : "Don't have an account? "}
                    <button type="button" onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>
                        {mode === 'register' ? 'Sign In' : 'Register'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function App() {
    const [authChecked, setAuthChecked] = React.useState(false);
    const [user, setUser] = React.useState(null);
    const [mode, setMode] = React.useState('login');
    const [formState, setFormState] = React.useState({ name: '', email: '', password: '', round: '', batch: '', course: '' });
    const [authError, setAuthError] = React.useState('');
    const [authBusy, setAuthBusy] = React.useState(false);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [unreadChatCount, setUnreadChatCount] = React.useState(0);

    React.useEffect(() => {
        let mounted = true;
        async function run() {
            try {
                const response = await window.axios.get('/api/v1/me');
                if (mounted) setUser(response.data);
            } catch {
                if (mounted) setUser(null);
            } finally {
                if (mounted) setAuthChecked(true);
            }
        }
        run();
        return () => { mounted = false; };
    }, []);

    React.useEffect(() => {
        if (!user) return;
        async function fetchCounts() {
            try {
                const [notifRes, meRes] = await Promise.all([
                    window.axios.get('/api/v1/notifications/unread-count'),
                    window.axios.get('/api/v1/me/stats'),
                ]);
                setUnreadCount(notifRes.data?.count ?? 0);
                setUnreadChatCount(meRes.data?.unread_messages_count ?? 0);
            } catch {
                /* ignore polling errors */
            }
        }
        fetchCounts();
        const id = setInterval(fetchCounts, 30000);
        return () => clearInterval(id);
    }, [user]);

    function onFormChange(event) {
        const { name, value } = event.target;
        setFormState((prev) => ({ ...prev, [name]: value }));
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
                : { email: formState.email, password: formState.password };

            const endpoint = mode === 'register' ? '/api/v1/auth/register' : '/api/v1/auth/login';
            const response = await window.axios.post(endpoint, payload);
            const token = response.data?.token;
            if (!token) throw new Error('No token.');

            window.localStorage.setItem('messagesing_token', token);
            window.axios.defaults.headers.common.Authorization = `Bearer ${token}`;
            if (window.setEchoToken) window.setEchoToken(token);

            const meResponse = await window.axios.get('/api/v1/me');
            setUser(meResponse.data);
        } catch (error) {
            setAuthError(error?.response?.data?.message || 'Could not authenticate.');
        } finally {
            setAuthBusy(false);
        }
    }

    async function logout() {
        try { await window.axios.post('/api/v1/auth/logout'); } catch { /* ignore */ }
        window.localStorage.removeItem('messagesing_token');
        delete window.axios.defaults.headers.common.Authorization;
        if (window.setEchoToken) window.setEchoToken('');
        setUser(null);
    }

    if (!authChecked) {
        return (
            <div className="auth-page">
                <div className="spinner-wrap"><div className="spinner" /></div>
            </div>
        );
    }

    if (!user) {
        return (
            <AuthScreen
                mode={mode}
                setMode={setMode}
                formState={formState}
                onFormChange={onFormChange}
                onAuthSubmit={onAuthSubmit}
                authError={authError}
                authBusy={authBusy}
            />
        );
    }

    const avatarColor = user.role === 'super_admin' || user.role === 'moderator' ? 'admin' : 'student';
    const isAdmin = user.role === 'super_admin' || user.role === 'moderator';

    const navLinks = [
        { to: '/', label: 'Dashboard', icon: '📊', exact: true },
        { to: '/feed', label: 'Feed', icon: '📝' },
        { to: '/chats', label: 'Chats', icon: '💬' },
        { to: '/friends', label: 'Friends', icon: '👥' },
        { to: '/directory', label: 'Directory', icon: '🔍' },
        { to: '/communities', label: 'Communities', icon: '🏘️' },
        { to: '/notifications', label: 'Notifications', icon: '🔔' },
    ];

    if (isAdmin) {
        navLinks.push({ to: '/admin', label: 'Admin', icon: '⚙️' });
    }

    return (
        <ToastProvider>
            <div className="app-shell">
                <aside className="sidebar">
                    <div className="sidebar-brand">
                        <div className="sidebar-logo">IB</div>
                        <div>
                            <div className="sidebar-brand-text">IsDB-BISEW Connect</div>
                            <div className="sidebar-brand-sub">Scholarship Community</div>
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        <div className="sidebar-section-label">Main</div>
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.exact}
                                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            >
                                <span className="sidebar-link-icon">{link.icon}</span>
                                {link.label}
                                {link.to === '/notifications' && unreadCount > 0 && (
                                    <span className="sidebar-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                                )}
                                {link.to === '/chats' && unreadChatCount > 0 && (
                                    <span className="sidebar-badge">{unreadChatCount > 99 ? '99+' : unreadChatCount}</span>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="sidebar-footer">
                        <Avatar name={user.name} size="sm" />
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user.name}</div>
                            <div className="sidebar-user-role">
                                {user.role === 'super_admin' ? 'Super Admin' :
                                 user.role === 'moderator' ? 'Moderator' :
                                 user.round ? `Round ${user.round}` : 'Student'}
                            </div>
                        </div>
                        <button className="sidebar-logout" onClick={logout} title="Logout">↩</button>
                    </div>
                </aside>

                <main className="main-area">
                    <Routes>
                        <Route path="/" element={<DashboardPage user={user} />} />
                        <Route path="/feed" element={<FeedPage />} />
                        <Route path="/chats" element={<ChatsPage user={user} />} />
                        <Route path="/directory" element={<DirectoryPage />} />
                        <Route path="/friends" element={<FriendsPage user={user} />} />
                        <Route path="/communities" element={<CommunitiesPage currentUser={user} />} />
                        <Route path="/communities/:id" element={<CommunityDetailPage currentUser={user} />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/profile" element={<ProfilePage user={user} />} />
                        {isAdmin && <Route path="/admin" element={<AdminPage user={user} />} />}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
            </div>
        </ToastProvider>
    );
}

export default App;
