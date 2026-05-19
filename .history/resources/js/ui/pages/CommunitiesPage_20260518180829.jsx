import React from 'react';
import { SectionState, useApiData } from './common';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Card from '../components/Card';

export default function CommunitiesPage({ currentUser }) {
    const { loading, error, data, unauthorized, reload } = useApiData('/api/v1/communities');
    const { data: friendships } = useApiData('/api/v1/friendships');
    const [createBusy, setCreateBusy] = React.useState(false);
    const [createError, setCreateError] = React.useState('');
    const [createForm, setCreateForm] = React.useState({ name: '', description: '', is_private: false });
    const [showCreate, setShowCreate] = React.useState(false);

    const acceptedFriends = React.useMemo(() => {
        if (!currentUser) return [];
        return (friendships ?? [])
            .filter((f) => f.status === 'accepted')
            .map((f) => (f.requester_id === currentUser.id ? f.addressee : f.requester))
            .filter(Boolean);
    }, [friendships, currentUser]);

    async function onCreateSubmit(event) {
        event.preventDefault();
        setCreateError('');
        try {
            setCreateBusy(true);
            await window.axios.post('/api/v1/communities', createForm);
            setCreateForm({ name: '', description: '', is_private: false });
            setShowCreate(false);
            reload();
        } catch (err) {
            setCreateError(err?.response?.data?.message || 'Could not create community.');
        } finally {
            setCreateBusy(false);
        }
    }

    const list = Array.isArray(data) ? data : [];

    return (
        <div>
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
                            <input className="form-input" name="name" value={createForm.name}
                                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="form-input" name="description" value={createForm.description}
                                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
                        </div>
                        <div className="form-group flex flex-center gap-2">
                            <input type="checkbox" id="is-private" checked={createForm.is_private}
                                onChange={(e) => setCreateForm((p) => ({ ...p, is_private: e.target.checked }))} />
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

            {loading || error || unauthorized ? (
                <SectionState loading={loading} error={error} unauthorized={unauthorized} emptyLabel="" />
            ) : list.length === 0 ? (
                <SectionState icon="🏘️" sub="Create the first community for your batch!">No communities yet</SectionState>
            ) : (
                <div className="stack">
                    {list.map((community) => (
                        <Card key={community.id} hover>
                            <div className="card-header">
                                <div className="card-header-left">
                                    <Avatar name={community.name} size="sm" />
                                    <div>
                                        <div className="card-title">{community.name}</div>
                                        <div className="text-xs text-muted">/{community.slug}</div>
                                    </div>
                                </div>
                                <Badge variant={community.is_private ? 'student' : 'default'}>
                                    {community.is_private ? 'Private' : 'Public'}
                                </Badge>
                            </div>
                            <div className="card-body">{community.description || 'No description yet.'}</div>
                            <div className="card-meta">
                                <span>👥 {community.members_count ?? 0} members</span>
                                {community.owner_id === currentUser?.id && <Badge variant="admin">Owner</Badge>}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
