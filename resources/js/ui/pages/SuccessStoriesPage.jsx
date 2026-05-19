import React from 'react';
import { useApiData } from './common';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

function StoryCard({ story, onExpand }) {
    const snippet = story.story.length > 150 ? story.story.slice(0, 150) + '...' : story.story;

    return (
        <div className="card card-hover" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => onExpand(story)}>
            <div className="flex-center" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                <Avatar name={story.user?.name} size="md" />
                <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{story.user?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        {story.user?.round && `Round ${story.user.round} `}
                        {story.user?.batch && `Batch ${story.user.batch}`}
                    </div>
                </div>
            </div>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{story.title}</div>
            {story.company && (
                <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                    {story.position && `${story.position} at `}{story.company}
                </div>
            )}
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.5 }}>{snippet}</div>
            {story.story.length > 150 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.5rem', fontWeight: 500 }}>
                    Read more →
                </div>
            )}
        </div>
    );
}

function ExpandedStory({ story, onClose }) {
    return (
        <Modal title={story.title} onClose={onClose}>
            <div className="flex-center" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
                <Avatar name={story.user?.name} size="md" />
                <div>
                    <div style={{ fontWeight: 600 }}>{story.user?.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                        {story.user?.round && `Round ${story.user.round} `}
                        {story.user?.batch && `Batch ${story.user.batch}`}
                        {story.user?.course && ` · ${story.user.course}`}
                    </div>
                </div>
            </div>
            {story.company && (
                <div style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '1rem' }}>
                    {story.position} at {story.company}
                </div>
            )}
            <div style={{ fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{story.story}</div>
        </Modal>
    );
}

function ShareStoryForm({ onClose, onSuccess }) {
    const [form, setForm] = React.useState({ title: '', story: '', company: '', position: '' });
    const [busy, setBusy] = React.useState(false);
    const toast = useToast();

    function onChange(e) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setBusy(true);
            await window.axios.post('/api/v1/success-stories', form);
            toast.success('Story submitted for approval!');
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not submit story.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal title="Share Your Success Story" onClose={onClose}
            footer={
                <div className="flex" style={{ gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary btn-sm" type="button" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary btn-sm" type="button" disabled={busy} onClick={handleSubmit}>
                        {busy ? 'Submitting...' : 'Submit for Approval'}
                    </button>
                </div>
            }
        >
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input className="form-input" name="title" value={form.title} onChange={onChange} placeholder="e.g. My Journey to Software Engineering" required />
                </div>
                <div className="form-group">
                    <label className="form-label">Your Story *</label>
                    <textarea className="form-input" name="story" rows={6} value={form.story} onChange={onChange}
                        placeholder="Share your journey, achievements, and how IsDB-BISEW helped..." required />
                </div>
                <div className="form-group">
                    <label className="form-label">Company (optional)</label>
                    <input className="form-input" name="company" value={form.company} onChange={onChange} placeholder="e.g. Google" />
                </div>
                <div className="form-group">
                    <label className="form-label">Position (optional)</label>
                    <input className="form-input" name="position" value={form.position} onChange={onChange} placeholder="e.g. Software Engineer" />
                </div>
            </form>
        </Modal>
    );
}

export default function SuccessStoriesPage() {
    const { loading, error, data, reload } = useApiData('/api/v1/success-stories');
    const [expanded, setExpanded] = React.useState(null);
    const [showForm, setShowForm] = React.useState(false);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Success Stories</h1>
                    <p>Inspiring journeys of IsDB-BISEW scholars and alumni.</p>
                </div>
                <button className="btn btn-primary" type="button" onClick={() => setShowForm(true)}>
                    Share Your Story
                </button>
            </div>

            {loading ? <Spinner /> : error ? <EmptyState icon="⚠️">{error}</EmptyState> : data.length === 0 ? (
                <EmptyState icon="🌟" sub="Be the first to share your success story!">No stories yet</EmptyState>
            ) : (
                <div className="directory-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                    {data.map((story) => (
                        <StoryCard key={story.id} story={story} onExpand={setExpanded} />
                    ))}
                </div>
            )}

            {expanded && <ExpandedStory story={expanded} onClose={() => setExpanded(null)} />}
            {showForm && <ShareStoryForm onClose={() => setShowForm(false)} onSuccess={reload} />}
        </div>
    );
}
