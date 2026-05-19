import React from 'react';
import { Link } from 'react-router-dom';
import { SectionState, useApiData, relativeTime } from './common';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';

function CommunityCard({ community, currentUser, onJoin, onLeave, busyId }) {
    const isOwner = community.owner_id === currentUser?.id;
    const isMember = community.is_member || isOwner;
    const isBusy = busyId === community.id;

    return (
        <Card hover>
            <div className="community-card-header">
                <div className="community-card-avatar">
                    <Avatar name={community.name} size="lg" />
                </div>
                <div className="community-card-info">
                    <div className="community-card-name">{community.name}</div>
                    <div className="community-card-meta">
                        <Badge variant={community.is_private ? 'student' : 'default'}>
                            {community.is_private ? 'Private' : 'Public'}
                        </Badge>
                        <span className="text-muted">{community.members_count ?? 0} members</span>
                    </div>
                </div>
            </div>
            <div className="community-card-body">
                {community.description || 'No description yet.'}
            </div>
            {community.tags?.length > 0 && (
                <div className="tag-row" style={{ marginBottom: '0.5rem' }}>
                    {community.tags.map((t) => (
                        <span key={t} className="badge badge-default">{t}</span>
                    ))}
                </div>
            )}
            <div className="community-card-footer">
                {isMember ? (
                    <>
                        <Link className="btn btn-primary btn-sm" to={`/communities/${community.id}`}>
                            View
                        </Link>
                        {!isOwner && (
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => onLeave(community.id)}
                                disabled={isBusy}
                                type="button"
                            >
                                {isBusy ? 'Leaving...' : 'Leave'}
                            </button>
                        )}
                        {isOwner && <Badge variant="admin">Owner</Badge>}
                    </>
                ) : community.is_private ? (
                    <span className="text-muted text-sm">Private — invite only</span>
                ) : (
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onJoin(community.id)}
                        disabled={isBusy}
                        type="button"
                    >
                        {isBusy ? 'Joining...' : 'Join'}
                    </button>
                )}
            </div>
        </Card>
    );
}

export default function CommunitiesPage({ currentUser }) {
    const [page, setPage] = React.useState(1);
    const [search, setSearch] = React.useState('');
    const [filter, setFilter] = React.useState('all');
    const [tagFilter, setTagFilter] = React.useState('');
    const [busyId, setBusyId] = React.useState(null);
    const [createBusy, setCreateBusy] = React.useState(false);
    const [createError, setCreateError] = React.useState('');
    const [createForm, setCreateForm] = React.useState({ name: '', description: '', is_private: false, tags: [] });
    const [tagInput, setTagInput] = React.useState('');
    const [showCreate, setShowCreate] = React.useState(false);
    const toast = useToast();

    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    const tagParam = tagFilter ? `&tag=${encodeURIComponent(tagFilter)}` : '';
    const {
        loading,
        error,
        data,
        unauthorized,
        pagination,
        reload,
    } = useApiData(`/api/v1/communities?page=${page}${searchParam}${tagParam}`);

    const list = data ?? [];

    const filtered = React.useMemo(() => {
        if (filter === 'all') return list;
        if (filter === 'public') return list.filter((c) => !c.is_private);
        if (filter === 'private') return list.filter((c) => c.is_private);
        if (filter === 'my') {
            return list.filter(
                (c) => c.is_member || c.owner_id === currentUser?.id
            );
        }
        return list;
    }, [list, filter, currentUser]);

    async function onJoin(communityId) {
        setBusyId(communityId);
        try {
            await window.axios.post(`/api/v1/communities/${communityId}/join`);
            toast.success('Joined community.');
            reload();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not join community.');
        } finally {
            setBusyId(null);
        }
    }

    async function onLeave(communityId) {
        setBusyId(communityId);
        try {
            await window.axios.post(`/api/v1/communities/${communityId}/leave`);
            toast.success('Left community.');
            reload();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not leave community.');
        } finally {
            setBusyId(null);
        }
    }

    function addTag() {
        const raw = tagInput.trim().toLowerCase();
        if (!raw) return;
        if (createForm.tags.includes(raw)) { setTagInput(''); return; }
        if (createForm.tags.length >= 5) { toast.error('Maximum 5 tags.'); return; }
        setCreateForm((p) => ({ ...p, tags: [...p.tags, raw] }));
        setTagInput('');
    }

    function removeTag(tag) {
        setCreateForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));
    }

    async function onCreateSubmit(event) {
        event.preventDefault();
        setCreateError('');
        try {
            setCreateBusy(true);
            await window.axios.post('/api/v1/communities', createForm);
            setCreateForm({ name: '', description: '', is_private: false, tags: [] });
            setTagInput('');
            setShowCreate(false);
            reload();
            toast.success('Community created.');
        } catch (err) {
            setCreateError(err?.response?.data?.message || 'Could not create community.');
        } finally {
            setCreateBusy(false);
        }
    }

    return (
        <div className="communities-page">
            <div className="page-header page-header-actions">
                <div>
                    <h1>Communities</h1>
                    <p>Create and join communities with your fellow scholars.</p>
                </div>
                <button className="btn btn-primary" type="button" onClick={() => setShowCreate(!showCreate)}>
                    {showCreate ? 'Cancel' : '+ New Community'}
                </button>
            </div>

            {showCreate && (
                <Card style={{ marginBottom: '1rem' }}>
                    <form onSubmit={onCreateSubmit}>
                        <div className="form-group">
                            <label className="form-label">Community name</label>
                            <input
                                className="form-input"
                                name="name"
                                value={createForm.name}
                                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. Web Development Batch 4"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-input"
                                name="description"
                                value={createForm.description}
                                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                                placeholder="What is this community about?"
                                rows={3}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tags (max 5)</label>
                            <div className="tag-input-row">
                                <input
                                    className="form-input"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                    placeholder="e.g. webdev, batch-4"
                                />
                                <button className="btn btn-secondary btn-sm" type="button" onClick={addTag}>Add</button>
                            </div>
                            {createForm.tags.length > 0 && (
                                <div className="tag-row">
                                    {createForm.tags.map((t) => (
                                        <span key={t} className="badge badge-default" style={{ cursor: 'pointer' }} onClick={() => removeTag(t)}>
                                            {t} ×
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="form-group flex flex-center gap-2">
                            <input
                                type="checkbox"
                                id="is-private"
                                checked={createForm.is_private}
                                onChange={(e) => setCreateForm((p) => ({ ...p, is_private: e.target.checked }))}
                            />
                            <label htmlFor="is-private" className="form-label mb-0">Private community</label>
                        </div>
                        <div className="flex flex-center gap-2">
                            <button className="btn btn-primary" disabled={createBusy} type="submit">
                                {createBusy ? 'Creating...' : 'Create'}
                            </button>
                            {createError && <span className="form-error">{createError}</span>}
                        </div>
                    </form>
                </Card>
            )}

            <div className="communities-toolbar">
                <input
                    className="form-input"
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search communities..."
                />
                <input
                    className="form-input"
                    type="text"
                    value={tagFilter}
                    onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
                    placeholder="Filter by tag..."
                    style={{ maxWidth: 160 }}
                />
                <div className="tabs">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'public', label: 'Public' },
                        { key: 'private', label: 'Private' },
                        { key: 'my', label: 'My Communities' },
                    ].map((t) => (
                        <button
                            key={t.key}
                            className={`tab ${filter === t.key ? 'active' : ''}`}
                            onClick={() => setFilter(t.key)}
                            type="button"
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading || error || unauthorized ? (
                <SectionState loading={loading} error={error} unauthorized={unauthorized} emptyLabel="" />
            ) : filtered.length === 0 ? (
                <EmptyState icon="🏘️" sub="Create the first community for your batch!">
                    No communities yet
                </EmptyState>
            ) : (
                <div className="communities-grid">
                    {filtered.map((community) => (
                        <CommunityCard
                            key={community.id}
                            community={community}
                            currentUser={currentUser}
                            onJoin={onJoin}
                            onLeave={onLeave}
                            busyId={busyId}
                        />
                    ))}
                </div>
            )}

            {pagination && pagination.last > 1 && (
                <div className="pagination">
                    <button
                        className="page-btn"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        type="button"
                    >
                        Prev
                    </button>
                    <span className="page-btn active">{page} / {pagination.last}</span>
                    <button
                        className="page-btn"
                        disabled={page >= pagination.last}
                        onClick={() => setPage((p) => p + 1)}
                        type="button"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
