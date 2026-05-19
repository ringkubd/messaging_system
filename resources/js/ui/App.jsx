import React from 'react';
import { Link, NavLink, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Avatar from './components/Avatar';
import Badge from './components/Badge';
import DashboardPage from './pages/DashboardPage';
import FeedPage from './pages/FeedPage';
import ChatsPage from './pages/ChatsPage';
import DirectoryPage from './pages/DirectoryPage';
import CommunitiesPage from './pages/CommunitiesPage';
import CommunityDetailPage from './pages/CommunityDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import FriendsPage from './pages/FriendsPage';
import AdminPage from './pages/AdminPage';
import AlumniPage from './pages/AlumniPage';
import SuccessStoriesPage from './pages/SuccessStoriesPage';
import ProfilePage from './pages/ProfilePage';
import ResumePage from './pages/ResumePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import VerifyNoticePage from './pages/VerifyNoticePage';
import ResourcesPage from './pages/ResourcesPage';
import ResourceDetailPage from './pages/ResourceDetailPage';
import LeaderboardPage from './pages/LeaderboardPage';
import SearchPage from './pages/SearchPage';
import LiveStreamsPage from './pages/LiveStreamsPage';
import LiveStreamWatchPage from './pages/LiveStreamWatchPage';
import LiveStreamDashboard from './pages/LiveStreamDashboard';
import ChatbotWidget from './components/ChatbotWidget';

function AuthScreen({ mode, setMode, formState, onFormChange, onAuthSubmit, authError, authBusy, resetSuccess }) {
    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">IB</div>
                <h1 className="auth-title">IsDB-BISEW Connect</h1>
                <p className="auth-subtitle">{mode === 'register' ? 'Create your community account' : 'Sign in to your account'}</p>

                {resetSuccess && (
                    <div className="form-success" style={{ textAlign: 'center', marginBottom: 16 }}>
                        Your password has been reset successfully. Please sign in with your new password.
                    </div>
                )}

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

                {mode === 'login' && (
                    <div className="auth-toggle" style={{ marginTop: 4 }}>
                        <Link to="/forgot-password" style={{ fontSize: '0.875rem' }}>
                            Forgot Password?
                        </Link>
                    </div>
                )}

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

function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            className="sidebar-logout"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {theme === 'dark' ? '☀️' : '🌙'}
        </button>
    );
}

function App() {
    const [searchParams] = useSearchParams();
    const [authChecked, setAuthChecked] = React.useState(false);
    const [user, setUser] = React.useState(null);
    const [mode, setMode] = React.useState('login');
    const [formState, setFormState] = React.useState({ name: '', email: '', password: '', round: '', batch: '', course: '' });
    const [authError, setAuthError] = React.useState('');
    const [authBusy, setAuthBusy] = React.useState(false);
    const resetSuccess = searchParams.get('reset') === 'success';
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [unreadChatCount, setUnreadChatCount] = React.useState(0);
    const [realtimeStatus, setRealtimeStatus] = React.useState(navigator.onLine ? 'connecting' : 'offline');

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

    React.useEffect(() => {
        function handleOffline() {
            setRealtimeStatus('offline');
        }

        function handleOnline() {
            setRealtimeStatus(window.Echo ? 'connecting' : 'online');
        }

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        const connection = window.Echo?.connector?.pusher?.connection;
        const handleStateChange = (states) => {
            const current = states?.current;
            if (!navigator.onLine) {
                setRealtimeStatus('offline');
                return;
            }

            if (current === 'connected') {
                setRealtimeStatus('online');
                return;
            }

            if (current === 'connecting' || current === 'initialized') {
                setRealtimeStatus('connecting');
                return;
            }

            setRealtimeStatus('degraded');
        };

        connection?.bind('state_change', handleStateChange);

        if (!navigator.onLine) {
            setRealtimeStatus('offline');
        } else if (connection?.state === 'connected') {
            setRealtimeStatus('online');
        }

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
            connection?.unbind('state_change', handleStateChange);
        };
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
            <Routes>
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route
                    path="*"
                    element={
                        <AuthScreen
                            mode={mode}
                            setMode={setMode}
                            formState={formState}
                            onFormChange={onFormChange}
                            onAuthSubmit={onAuthSubmit}
                            authError={authError}
                            authBusy={authBusy}
                            resetSuccess={resetSuccess}
                        />
                    }
                />
            </Routes>
        );
    }

    if (!user.email_verified_at) {
        return <VerifyNoticePage onLogout={logout} />;
    }

    const avatarColor = user.role === 'super_admin' || user.role === 'moderator' ? 'admin' : 'student';
    const isAdmin = user.role === 'super_admin' || user.role === 'moderator';

    const navLinks = [
        { to: '/', label: 'Dashboard', icon: '📊', exact: true },
        { to: '/feed', label: 'Feed', icon: '📝' },
        { to: '/chats', label: 'Chats', icon: '💬' },
        { to: '/events', label: 'Events', icon: '📅' },
        { to: '/live-streams', label: 'Live', icon: '📺' },
        { to: '/jobs', label: 'Jobs', icon: '💼' },
        { to: '/friends', label: 'Friends', icon: '👥' },
        { to: '/directory', label: 'Directory', icon: '🔍' },
        { to: '/search', label: 'Search', icon: '🔎' },
        { to: '/communities', label: 'Communities', icon: '🏘️' },
        { to: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
        { to: '/alumni', label: 'Alumni', icon: '🎓' },
        { to: '/success-stories', label: 'Success Stories', icon: '🌟' },
        { to: '/notifications', label: 'Notifications', icon: '🔔' },
    ];

    if (isAdmin) {
        navLinks.push({ to: '/admin', label: 'Admin', icon: '⚙️' });
    }

    const realtimeLabel = realtimeStatus === 'online'
        ? 'Realtime live'
        : realtimeStatus === 'connecting'
            ? 'Realtime connecting'
            : realtimeStatus === 'offline'
                ? 'Offline mode'
                : 'Realtime degraded';

    return (
        <ThemeProvider>
            <ToastProvider>
            <div className="app-shell">
                <aside className="sidebar">
                    <div className="sidebar-brand">
                        <div className="sidebar-logo">IB</div>
                        <div>
                            <div className="sidebar-brand-text">IsDB-BISEW Connect</div>
                            <div className="sidebar-brand-sub">Scholarship Community</div>
                            <div className={`sidebar-status sidebar-status-${realtimeStatus}`}>
                                <span className="sidebar-status-dot" />
                                <span>{realtimeLabel}</span>
                            </div>
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
                        <ThemeToggle />
                        <button className="sidebar-logout" onClick={logout} title="Logout">↩</button>
                    </div>
                </aside>

                <main className="main-area">
                    <Routes>
                        <Route path="/" element={<DashboardPage user={user} />} />
                        <Route path="/feed" element={<FeedPage user={user} />} />
                        <Route path="/chats" element={<ChatsPage user={user} />} />
                        <Route path="/directory" element={<DirectoryPage />} />
                        <Route path="/events" element={<EventsPage />} />
                        <Route path="/events/:id" element={<EventDetailPage />} />
                        <Route path="/live-streams" element={<LiveStreamsPage />} />
                        <Route path="/live-streams/:id" element={<LiveStreamWatchPage />} />
                        <Route path="/my/streams" element={<LiveStreamDashboard />} />
                        <Route path="/jobs" element={<JobsPage />} />
                        <Route path="/jobs/:id" element={<JobDetailPage />} />
                        <Route path="/my-applications" element={<MyApplicationsPage />} />
                        <Route path="/friends" element={<FriendsPage user={user} />} />
                        <Route path="/communities" element={<CommunitiesPage currentUser={user} />} />
                        <Route path="/communities/:id" element={<CommunityDetailPage currentUser={user} />} />
                        <Route path="/resources" element={<ResourcesPage />} />
                        <Route path="/resources/:id" element={<ResourceDetailPage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/leaderboard" element={<LeaderboardPage user={user} />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/profile" element={<ProfilePage user={user} />} />
                        <Route path="/resume" element={<ResumePage user={user} />} />
                        <Route path="/alumni" element={<AlumniPage user={user} />} />
                        <Route path="/success-stories" element={<SuccessStoriesPage />} />
                        {isAdmin && <Route path="/admin" element={<AdminPage user={user} />} />}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    <ChatbotWidget user={user} />
                </main>
            </div>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;
