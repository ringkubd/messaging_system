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
    return (
        <div className="shell">
            <div className="background-mesh" aria-hidden="true" />
            <header className="topbar">
                <div className="brand-wrap">
                    <p className="eyebrow">Phase: Web Client Foundation</p>
                    <h1 className="brand">MessageSing Social</h1>
                </div>
                <div className="status-pill">Backend API Connected</div>
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
