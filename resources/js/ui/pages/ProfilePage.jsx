import React from 'react';
import { useApiData, relativeTime } from './common';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import { useToast } from '../components/Toast';

const API_BASE = '/api/v1';

function ActivityItem({ type, title, time, meta }) {
    const dotClass = type === 'post' ? 'activity-dot-post' : 'activity-dot-comment';
    return (
        <div className="activity-item">
            <div className={`activity-dot ${dotClass}`} />
            <div className="activity-body">
                <div className="activity-title">{title}</div>
                <div className="activity-meta">{meta} · {relativeTime(time)}</div>
            </div>
        </div>
    );
}

function ExperienceEntry({ index, entry, onChange, onRemove }) {
    return (
        <div className="experience-entry" style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.5rem' }}>
            <div className="grid-2" style={{ gap: '0.5rem' }}>
                <div className="form-group">
                    <label className="form-label">Company</label>
                    <input className="form-input" value={entry.company || ''} onChange={(e) => onChange(index, 'company', e.target.value)} placeholder="Company name" />
                </div>
                <div className="form-group">
                    <label className="form-label">Role</label>
                    <input className="form-input" value={entry.role || ''} onChange={(e) => onChange(index, 'role', e.target.value)} placeholder="Job title" />
                </div>
                <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input className="form-input" value={entry.start_date || ''} onChange={(e) => onChange(index, 'start_date', e.target.value)} placeholder="e.g. Jan 2020" />
                </div>
                <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input className="form-input" value={entry.end_date || ''} onChange={(e) => onChange(index, 'end_date', e.target.value)} placeholder="e.g. Dec 2022" />
                </div>
            </div>
            <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={entry.description || ''} onChange={(e) => onChange(index, 'description', e.target.value)} rows={2} placeholder="Brief description" />
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onRemove(index)} style={{ marginTop: '0.25rem' }}>Remove</button>
        </div>
    );
}

function EditForm({ user, onSave, onCancel, saving }) {
    const profile = user.profile || {};
    const [form, setForm] = React.useState({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        phone: user.phone || '',
        address: user.address || '',
        round: user.round || '',
        batch: user.batch || '',
        course: user.course || '',
    });
    const [profileForm, setProfileForm] = React.useState({
        linkedin_url: profile.linkedin_url || '',
        github_url: profile.github_url || '',
        portfolio_url: profile.portfolio_url || '',
        skills_text: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
    });
    const [experience, setExperience] = React.useState(Array.isArray(profile.experience) ? profile.experience : []);
    const [activeTab, setActiveTab] = React.useState('basic');
    const [avatarFile, setAvatarFile] = React.useState(null);
    const [avatarPreview, setAvatarPreview] = React.useState(user.avatar || null);
    const [errors, setErrors] = React.useState({});
    const [profileErrors, setProfileErrors] = React.useState({});

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: null }));
    }

    function handleProfileChange(e) {
        const { name, value } = e.target;
        setProfileForm(prev => ({ ...prev, [name]: value }));
        setProfileErrors(prev => ({ ...prev, [name]: null }));
    }

    function handleExperienceChange(index, field, value) {
        setExperience(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    }

    function addExperience() {
        setExperience(prev => [...prev, { company: '', role: '', start_date: '', end_date: '', description: '' }]);
    }

    function removeExperience(index) {
        setExperience(prev => prev.filter((_, i) => i !== index));
    }

    function handleAvatarChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarPreview(ev.target.result);
        reader.readAsDataURL(file);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErrors({});
        setProfileErrors({});

        const fd = new FormData();
        fd.append('_method', 'PUT');
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        if (avatarFile) fd.append('avatar', avatarFile);

        const skillsArray = profileForm.skills_text
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        const profileData = {
            linkedin_url: profileForm.linkedin_url || null,
            github_url: profileForm.github_url || null,
            portfolio_url: profileForm.portfolio_url || null,
            skills: skillsArray.length > 0 ? skillsArray : null,
            experience: experience.length > 0 ? experience : null,
        };

        try {
            await onSave(fd, profileData);
        } catch (err) {
            if (err.response?.status === 422 && err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
        }
    }

    const tabStyle = (tab) => ({
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
        fontWeight: activeTab === tab ? 600 : 400,
        color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
        transition: 'all 0.2s',
    });

    return (
        <form onSubmit={handleSubmit}>
            <div className="stack stack-md">
                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
                    <span style={tabStyle('basic')} onClick={() => setActiveTab('basic')}>Basic</span>
                    <span style={tabStyle('professional')} onClick={() => setActiveTab('professional')}>Professional</span>
                </div>

                {activeTab === 'basic' && (
                    <div className="profile-header-content" style={{ alignItems: 'flex-start' }}>
                        <label className="avatar-upload">
                            <Avatar name={user.name} size="xl" src={avatarPreview} />
                            <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                            <div className="avatar-upload-overlay">Change</div>
                        </label>
                        <div className="profile-info" style={{ flex: 1 }}>
                            <div className="grid-2" style={{ gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input className={`form-input ${errors.name ? 'input-error' : ''}`} name="name" value={form.name} onChange={handleChange} required />
                                    {errors.name && <div className="form-error">{errors.name[0]}</div>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input className={`form-input ${errors.email ? 'input-error' : ''}`} type="email" name="email" value={form.email} onChange={handleChange} required />
                                    {errors.email && <div className="form-error">{errors.email[0]}</div>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input className={`form-input ${errors.phone ? 'input-error' : ''}`} name="phone" value={form.phone} onChange={handleChange} />
                                    {errors.phone && <div className="form-error">{errors.phone[0]}</div>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Round</label>
                                    <input className={`form-input ${errors.round ? 'input-error' : ''}`} name="round" value={form.round} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Batch</label>
                                    <input className={`form-input ${errors.batch ? 'input-error' : ''}`} name="batch" value={form.batch} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Course</label>
                                    <input className={`form-input ${errors.course ? 'input-error' : ''}`} name="course" value={form.course} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '0.75rem' }}>
                                <label className="form-label">Bio</label>
                                <textarea className={`form-input ${errors.bio ? 'input-error' : ''}`} name="bio" value={form.bio} onChange={handleChange} rows={3} />
                                {errors.bio && <div className="form-error">{errors.bio[0]}</div>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <textarea className={`form-input ${errors.address ? 'input-error' : ''}`} name="address" value={form.address} onChange={handleChange} rows={2} />
                                {errors.address && <div className="form-error">{errors.address[0]}</div>}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'professional' && (
                    <div className="stack stack-md">
                        <div className="grid-2" style={{ gap: '0.75rem' }}>
                            <div className="form-group">
                                <label className="form-label">LinkedIn URL</label>
                                <input className={`form-input ${profileErrors.linkedin_url ? 'input-error' : ''}`} name="linkedin_url" value={profileForm.linkedin_url} onChange={handleProfileChange} placeholder="https://linkedin.com/in/..." />
                                {profileErrors.linkedin_url && <div className="form-error">{profileErrors.linkedin_url[0]}</div>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">GitHub URL</label>
                                <input className={`form-input ${profileErrors.github_url ? 'input-error' : ''}`} name="github_url" value={profileForm.github_url} onChange={handleProfileChange} placeholder="https://github.com/..." />
                                {profileErrors.github_url && <div className="form-error">{profileErrors.github_url[0]}</div>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Portfolio URL</label>
                                <input className={`form-input ${profileErrors.portfolio_url ? 'input-error' : ''}`} name="portfolio_url" value={profileForm.portfolio_url} onChange={handleProfileChange} placeholder="https://..." />
                                {profileErrors.portfolio_url && <div className="form-error">{profileErrors.portfolio_url[0]}</div>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Skills</label>
                                <input className="form-input" name="skills_text" value={profileForm.skills_text} onChange={handleProfileChange} placeholder="e.g. PHP, Laravel, React, JavaScript" />
                                <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>Comma-separated list of skills</div>
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className="form-label" style={{ margin: 0 }}>Experience</label>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={addExperience}>+ Add Experience</button>
                            </div>
                            {experience.length === 0 ? (
                                <p className="text-sm text-muted">No experience entries yet.</p>
                            ) : (
                                experience.map((entry, i) => (
                                    <ExperienceEntry key={i} index={i} entry={entry} onChange={handleExperienceChange} onRemove={removeExperience} />
                                ))
                            )}
                        </div>
                    </div>
                )}

                <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </form>
    );
}

export default function ProfilePage({ user, onUserUpdate }) {
    if (!user) return null;

    const [isEditing, setIsEditing] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [currentUser, setCurrentUser] = React.useState(user);
    const [aiAnalyzing, setAiAnalyzing] = React.useState(false);
    const [aiSuggestions, setAiSuggestions] = React.useState(null);
    const [aiLoaded, setAiLoaded] = React.useState(false);
    const toast = useToast();
    const { loading, data: stats } = useApiData('/api/v1/me/stats');
    const { loading: pointsLoading, data: pointsData } = useApiData('/api/v1/user/points');
    const { loading: badgesLoading, data: userBadges } = useApiData('/api/v1/user/badges');

    const recentPosts = stats?.recent_posts ?? [];
    const recentComments = stats?.recent_comments ?? [];
    const allActivity = [
        ...recentPosts.map((p) => ({ type: 'post', id: `p-${p.id}`, title: p.body, time: p.created_at, meta: p.community ? `in ${p.community.name}` : 'Post' })),
        ...recentComments.map((c) => ({ type: 'comment', id: `c-${c.id}`, title: c.body, time: c.created_at, meta: c.post?.body ? `on "${c.post.body}"` : 'Comment' })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);

    async function handleSave(formData, profileData) {
        setSaving(true);
        try {
            const res = await window.axios.post(`${API_BASE}/me`, formData);
            if (profileData) {
                await window.axios.put(`${API_BASE}/profile`, profileData);
            }
            const profileRes = await window.axios.get(`${API_BASE}/profile`);
            setCurrentUser({ ...res.data, profile: profileRes.data });
            setIsEditing(false);
            toast.success('Profile updated');
            if (onUserUpdate) onUserUpdate(res.data);
        } catch (err) {
            throw err;
        } finally {
            setSaving(false);
        }
    }

    async function handleAIAnalyze() {
        setAiAnalyzing(true);
        try {
            await window.axios.post(`${API_BASE}/resume/analyze`);
            toast.success('AI analysis started. Check back shortly for suggestions.');

            setTimeout(async () => {
                try {
                    const res = await window.axios.get(`${API_BASE}/resume/suggestions`);
                    setAiSuggestions(res.data);
                    setAiLoaded(true);

                    const profileRes = await window.axios.get(`${API_BASE}/profile`);
                    setCurrentUser(prev => ({ ...prev, profile: profileRes.data }));
                } catch {
                    setAiLoaded(true);
                    setAiSuggestions(null);
                }
            }, 3000);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Analysis failed.');
        } finally {
            setAiAnalyzing(false);
        }
    }

    async function handleAcceptSuggestion(skill) {
        try {
            const profile = currentUser.profile || {};
            const currentSkills = Array.isArray(profile.skills) ? profile.skills : [];
            if (currentSkills.includes(skill)) {
                toast.info('Skill already in your profile.');
                return;
            }
            const res = await window.axios.post(`${API_BASE}/resume/accept-suggestions`, {
                skills: [...currentSkills, skill],
            });
            const profileRes = await window.axios.get(`${API_BASE}/profile`);
            setCurrentUser(prev => ({ ...prev, profile: profileRes.data }));
            toast.success(`"${skill}" added to your skills.`);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to accept skill.');
        }
    }

    return (
        <div className="profile-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Profile</h1>
                {!isEditing && (
                    <div className="flex gap-2">
                        <a href="/resume" className="btn btn-primary">View Resume</a>
                        <button className="btn btn-secondary" onClick={handleAIAnalyze} disabled={aiAnalyzing}>
                            {aiAnalyzing ? 'Analyzing...' : 'AI Analyze Profile'}
                        </button>
                        <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>Edit Profile</button>
                    </div>
                )}
            </div>

            <div className="profile-header">
                <div className="profile-cover" />
                {isEditing ? (
                    <EditForm user={currentUser} onSave={handleSave} onCancel={() => setIsEditing(false)} saving={saving} />
                ) : (
                    <div className="profile-header-content">
                        <Avatar name={currentUser.name} size="xl" src={currentUser.avatar} />
                        <div className="profile-info">
                            <h2>{currentUser.name}</h2>
                            <p>{currentUser.email}</p>
                            {currentUser.bio && <p className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>{currentUser.bio}</p>}
                            <div className="flex flex-wrap gap-2" style={{ marginTop: '0.35rem' }}>
                                <Badge variant={currentUser.role === 'super_admin' || currentUser.role === 'moderator' ? 'admin' : 'student'}>
                                    {currentUser.role === 'super_admin' ? 'Super Admin' : currentUser.role === 'moderator' ? 'Moderator' : 'Student'}
                                </Badge>
                                {currentUser.round && <Badge variant="default">Round {currentUser.round}</Badge>}
                                {currentUser.batch && <Badge variant="default">Batch {currentUser.batch}</Badge>}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="profile-stats-row">
                <div className="profile-stat">
                    <div className="profile-stat-value">{currentUser.posts_count ?? '-'}</div>
                    <div className="profile-stat-label">Posts</div>
                </div>
                <div className="profile-stat">
                    <div className="profile-stat-value">{currentUser.comments_count ?? '-'}</div>
                    <div className="profile-stat-label">Comments</div>
                </div>
                <div className="profile-stat">
                    <div className="profile-stat-value">{pointsLoading ? '-' : (pointsData?.points ?? 0)}</div>
                    <div className="profile-stat-label">Points</div>
                </div>
                <div className="profile-stat">
                    <div className="profile-stat-value">{badgesLoading ? '-' : ((userBadges && Array.isArray(userBadges) ? userBadges.length : 0))}</div>
                    <div className="profile-stat-label">Badges</div>
                </div>
                <div className="profile-stat">
                    <div className="profile-stat-value">{currentUser.round || '-'}</div>
                    <div className="profile-stat-label">Round</div>
                </div>
                <div className="profile-stat">
                    <div className="profile-stat-value">{currentUser.batch || '-'}</div>
                    <div className="profile-stat-label">Batch</div>
                </div>
            </div>

            <div className="grid-2">
                <Card>
                    <div className="card-title" style={{ marginBottom: '0.5rem' }}>Scholarship Info</div>
                    <div className="stack stack-sm text-sm">
                        <div><span className="text-muted">Name:</span> {currentUser.name}</div>
                        <div><span className="text-muted">Email:</span> {currentUser.email}</div>
                        <div><span className="text-muted">Phone:</span> {currentUser.phone || 'Not set'}</div>
                        <div><span className="text-muted">Address:</span> {currentUser.address || 'Not set'}</div>
                        <div><span className="text-muted">Round:</span> {currentUser.round || 'Not set'}</div>
                        <div><span className="text-muted">Batch:</span> {currentUser.batch || 'Not set'}</div>
                        <div><span className="text-muted">Course:</span> {currentUser.course || 'Not set'}</div>
                        <div><span className="text-muted">Role:</span> {currentUser.role}</div>
                        <div><span className="text-muted">Member since:</span> {currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString() : '-'}</div>
                    </div>
                </Card>

                <Card>
                    <div className="card-title" style={{ marginBottom: '0.5rem' }}>Recent Activity</div>
                    {loading ? (
                        <Spinner />
                    ) : allActivity.length === 0 ? (
                        <EmptyState icon="📭" sub="Your posts and comments will appear here.">No activity yet</EmptyState>
                    ) : (
                        <div className="activity-list">
                            {allActivity.map((item) => (
                                <ActivityItem
                                    key={item.id}
                                    type={item.type}
                                    title={item.title}
                                    time={item.time}
                                    meta={item.meta}
                                />
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            <Card style={{ marginTop: '1rem' }}>
                <div className="card-title" style={{ marginBottom: '0.75rem' }}>
                    Badges ({badgesLoading ? '-' : (userBadges && Array.isArray(userBadges) ? userBadges.length : 0)})
                </div>
                {badgesLoading ? (
                    <Spinner />
                ) : userBadges && Array.isArray(userBadges) && userBadges.length > 0 ? (
                    <div className="flex flex-wrap gap-2" style={{ marginBottom: '0.75rem' }}>
                        {userBadges.map((badge) => {
                            const levelColors = { 1: 'var(--badge-bronze, #cd7f32)', 2: 'var(--badge-silver, #c0c0c0)', 3: 'var(--badge-gold, #ffd700)' };
                            const bgColor = levelColors[badge.level] || 'var(--text-muted)';
                            return (
                                <div
                                    key={badge.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: `${bgColor}20`,
                                        border: `1px solid ${bgColor}40`,
                                        fontSize: '0.85rem',
                                    }}
                                    title={badge.description}
                                >
                                    <span style={{ fontSize: '1.1rem' }}>{badge.icon}</span>
                                    <span style={{ fontWeight: 600 }}>{badge.name}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+{badge.points}pts</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-muted" style={{ marginBottom: '0.75rem' }}>No badges earned yet. Participate in the community to earn badges!</p>
                )}
            </Card>

            <Card style={{ marginTop: '1rem' }}>
                <div className="card-title" style={{ marginBottom: '0.75rem' }}>Professional Info</div>
                {currentUser.profile ? (
                    <div className="stack stack-sm text-sm">
                        <div className="flex flex-wrap gap-2" style={{ marginBottom: '0.5rem' }}>
                            {currentUser.profile.linkedin_url && (
                                <a href={currentUser.profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                                    LinkedIn
                                </a>
                            )}
                            {currentUser.profile.github_url && (
                                <a href={currentUser.profile.github_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                                    GitHub
                                </a>
                            )}
                            {currentUser.profile.portfolio_url && (
                                <a href={currentUser.profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                                    Portfolio
                                </a>
                            )}
                        </div>
                        {Array.isArray(currentUser.profile.skills) && currentUser.profile.skills.length > 0 && (
                            <div style={{ marginBottom: '0.5rem' }}>
                                <div className="text-muted" style={{ marginBottom: '0.25rem' }}>Skills</div>
                                <div className="flex flex-wrap gap-1">
                                    {currentUser.profile.skills.map((skill, i) => (
                                        <Badge key={i} variant="default">{skill}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        {aiLoaded && aiSuggestions && Array.isArray(aiSuggestions.suggested_skills) && aiSuggestions.suggested_skills.length > 0 && (
                            <div style={{ marginBottom: '0.5rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                                <div className="text-muted" style={{ marginBottom: '0.25rem' }}>AI Suggested Skills</div>
                                <p className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>Click to accept suggested skills.</p>
                                <div className="flex flex-wrap gap-1">
                                    {aiSuggestions.suggested_skills.map((skill, i) => {
                                        const alreadyHas = Array.isArray(currentUser.profile.skills) && currentUser.profile.skills.includes(skill);
                                        return (
                                            <button
                                                key={i}
                                                className="badge badge-admin"
                                                style={{ cursor: alreadyHas ? 'default' : 'pointer', opacity: alreadyHas ? 0.6 : 1, border: 'none', fontSize: 'inherit' }}
                                                onClick={() => !alreadyHas && handleAcceptSuggestion(skill)}
                                                disabled={alreadyHas}
                                                type="button"
                                                title={alreadyHas ? 'Already in your skills' : 'Click to add this skill'}
                                            >
                                                {skill} {alreadyHas ? '✓' : '+'}
                                            </button>
                                        );
                                    })}
                                </div>
                                {aiSuggestions.career_level && (
                                    <div className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>
                                        Career Level: <Badge variant="admin">{aiSuggestions.career_level}</Badge>
                                    </div>
                                )}
                                {Array.isArray(aiSuggestions.top_industries) && aiSuggestions.top_industries.length > 0 && (
                                    <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>
                                        Industries: {aiSuggestions.top_industries.map((ind, i) => (
                                            <Badge key={i} variant="default">{ind}</Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {Array.isArray(currentUser.profile.experience) && currentUser.profile.experience.length > 0 && (
                            <div>
                                <div className="text-muted" style={{ marginBottom: '0.25rem' }}>Experience ({currentUser.profile.experience.length} entries)</div>
                            </div>
                        )}
                        {!currentUser.profile.linkedin_url && !currentUser.profile.github_url && !currentUser.profile.portfolio_url &&
                         (!Array.isArray(currentUser.profile.skills) || currentUser.profile.skills.length === 0) &&
                         (!Array.isArray(currentUser.profile.experience) || currentUser.profile.experience.length === 0) && (
                            <span className="text-muted">No professional info added yet.</span>
                        )}
                    </div>
                ) : (
                    <span className="text-muted">No professional info added yet.</span>
                )}
            </Card>
        </div>
    );
}
