import React from 'react';
import { useApiData } from './common';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import SearchInput from '../components/SearchInput';
import Tabs from '../components/Tabs';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

function MentorshipTab({ user }) {
    const { loading, error, data, pagination, reload } = useApiData('/api/v1/mentorship-requests');
    const toast = useToast();

    async function handleRespond(id, status) {
        try {
            const message = status === 'accepted' ? 'Let\'s connect!' : '';
            await window.axios.patch(`/api/v1/mentorship-requests/${id}/respond`, { status, response_message: message });
            toast.success(status === 'accepted' ? 'Request accepted' : 'Request rejected');
            reload();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not respond.');
        }
    }

    if (loading) return <Spinner />;
    if (error) return <EmptyState icon="⚠️">{error}</EmptyState>;

    if (!data || data.length === 0) {
        return <EmptyState icon="🤝" sub="You have no mentorship requests yet.">No requests</EmptyState>;
    }

    return (
        <div className="stack">
            {data.map((req) => {
                const isMentor = req.mentor_id === user.id;
                const other = isMentor ? req.mentee : req.mentor;

                return (
                    <div key={req.id} className="card" style={{ padding: '1rem' }}>
                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                            <div className="flex-center" style={{ gap: '0.75rem' }}>
                                <Avatar name={other.name} size="sm" />
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{other.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                                        {isMentor ? 'Wants mentorship from you' : 'Your request to mentor'}
                                    </div>
                                </div>
                            </div>
                            <Badge variant={req.status === 'accepted' ? 'active' : req.status === 'rejected' ? 'rejected' : 'pending'}>
                                {req.status}
                            </Badge>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                            {req.message}
                        </div>
                        {req.response_message && (
                            <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                                Reply: {req.response_message}
                            </div>
                        )}
                        {isMentor && req.status === 'pending' && (
                            <div className="flex" style={{ gap: '0.5rem' }}>
                                <button className="btn btn-primary btn-sm" type="button" onClick={() => handleRespond(req.id, 'accepted')}>
                                    Accept
                                </button>
                                <button className="btn btn-secondary btn-sm" type="button" onClick={() => handleRespond(req.id, 'rejected')}>
                                    Decline
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
            {pagination && <Pagination current={pagination.current} last={pagination.last} onChange={() => {}} />}
        </div>
    );
}

function DirectoryView({ user }) {
    const [search, setSearch] = React.useState('');
    const [filters, setFilters] = React.useState({ batch: '', course: '', skill: '' });
    const [mentoringModal, setMentoringModal] = React.useState(null);
    const [mentorMessage, setMentorMessage] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const toast = useToast();

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filters.batch) params.set('batch', filters.batch);
    if (filters.course) params.set('course', filters.course);

    const { loading, error, data, pagination, reload } = useApiData(`/api/v1/mentors?${params.toString()}`);

    function updateFilter(key, value) {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }

    async function handleRequestMentorship(mentorId) {
        try {
            setSubmitting(true);
            await window.axios.post('/api/v1/mentorship-requests', {
                mentor_id: mentorId,
                message: mentorMessage || 'I would like to connect with you as a mentor.',
            });
            toast.success('Mentorship request sent!');
            setMentoringModal(null);
            setMentorMessage('');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not send request.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div>
            <div className="filter-bar">
                <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." />
                <div className="form-group">
                    <input className="form-input" type="text" placeholder="Batch" value={filters.batch}
                        onChange={(e) => updateFilter('batch', e.target.value)} />
                </div>
                <div className="form-group">
                    <input className="form-input" type="text" placeholder="Course" value={filters.course}
                        onChange={(e) => updateFilter('course', e.target.value)} />
                </div>
            </div>

            {loading ? <Spinner /> : error ? <EmptyState icon="⚠️">{error}</EmptyState> : data.length === 0 ? (
                <EmptyState icon="🔍" sub="Try adjusting your search or filters.">No alumni found</EmptyState>
            ) : (
                <>
                    <div className="directory-grid">
                        {data.map((member) => (
                            <div key={member.id} className="directory-card">
                                <div className="directory-card-top">
                                    <Avatar name={member.name} />
                                    <div className="directory-card-info">
                                        <div className="directory-card-name">{member.name}</div>
                                        <div className="directory-card-detail">{member.email}</div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="alumni">Alumni</Badge>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                                    {member.round && <span>Round {member.round} </span>}
                                    {member.batch && <span>Batch {member.batch} </span>}
                                    {member.course && <span>{member.course}</span>}
                                </div>
                                {member.user_profile?.skills && member.user_profile.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1" style={{ fontSize: '0.75rem' }}>
                                        {member.user_profile.skills.slice(0, 4).map((skill, i) => (
                                            <Badge key={i} variant="default">{skill}</Badge>
                                        ))}
                                    </div>
                                )}
                                {member.bio && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{member.bio}</div>
                                )}
                                <div className="directory-card-actions">
                                    <button className="btn btn-primary btn-sm" type="button"
                                        onClick={() => setMentoringModal(member)}>
                                        Request Mentorship
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {pagination && <Pagination current={pagination.current} last={pagination.last} onChange={() => {}} />}
                </>
            )}

            {mentoringModal && (
                <Modal
                    title={`Request Mentorship from ${mentoringModal.name}`}
                    onClose={() => { setMentoringModal(null); setMentorMessage(''); }}
                    footer={
                        <div className="flex" style={{ gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary btn-sm" type="button"
                                onClick={() => { setMentoringModal(null); setMentorMessage(''); }}>
                                Cancel
                            </button>
                            <button className="btn btn-primary btn-sm" type="button" disabled={submitting}
                                onClick={() => handleRequestMentorship(mentoringModal.id)}>
                                {submitting ? 'Sending...' : 'Send Request'}
                            </button>
                        </div>
                    }
                >
                    <div className="form-group">
                        <label className="form-label">Message</label>
                        <textarea className="form-input" rows={4} value={mentorMessage}
                            onChange={(e) => setMentorMessage(e.target.value)}
                            placeholder="Introduce yourself and explain why you'd like mentorship..." />
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default function AlumniPage({ user }) {
    const [tab, setTab] = React.useState('directory');

    const tabs = [
        { key: 'directory', label: 'Alumni Directory' },
        { key: 'mentorship', label: 'My Mentorship Requests' },
    ];

    return (
        <div>
            <div className="page-header">
                <h1>Alumni & Mentorship</h1>
                <p>Connect with fellow alumni and find mentors from the IsDB-BISEW community.</p>
            </div>

            <Tabs tabs={tabs} active={tab} onChange={setTab} />

            {tab === 'directory' && <DirectoryView user={user} />}
            {tab === 'mentorship' && <MentorshipTab user={user} />}
        </div>
    );
}
