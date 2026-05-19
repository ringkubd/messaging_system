import React from 'react';
import { SectionState, useApiData } from './common';

function CommunitiesPage({ currentUser }) {
    const { loading, error, data, unauthorized, reload } = useApiData('/api/v1/communities');
    const { data: friendships } = useApiData('/api/v1/friendships');
    const [createBusy, setCreateBusy] = React.useState(false);
    const [createError, setCreateError] = React.useState('');
    const [createForm, setCreateForm] = React.useState({
        name: '',
        description: '',
        is_private: false,
    });
    const [inviteBusyId, setInviteBusyId] = React.useState(null);
    const [inviteError, setInviteError] = React.useState('');
    const [inviteState, setInviteState] = React.useState({});

    const acceptedFriends = React.useMemo(() => {
        if (!currentUser) {
            return [];
        }

        return (friendships ?? [])
            .filter((friendship) => friendship.status === 'accepted')
            .map((friendship) => {
                if (friendship.requester_id === currentUser.id) {
                    return friendship.addressee;
                }

                return friendship.requester;
            })
            .filter(Boolean);
    }, [friendships, currentUser]);

    function onCreateChange(event) {
        const { name, value, type, checked } = event.target;
        setCreateForm((previous) => ({
            ...previous,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }

    async function onCreateSubmit(event) {
        event.preventDefault();
        setCreateError('');

        try {
            setCreateBusy(true);
            await window.axios.post('/api/v1/communities', createForm);
            setCreateForm({ name: '', description: '', is_private: false });
            reload();
        } catch (requestError) {
            setCreateError(requestError?.response?.data?.message || 'Could not create community.');
        } finally {
            setCreateBusy(false);
        }
    }

    function onInviteTargetChange(communityId, userId) {
        setInviteState((previous) => ({ ...previous, [communityId]: userId }));
    }

    async function inviteFriend(communityId) {
        const selectedUserId = inviteState[communityId];
        setInviteError('');

        if (!selectedUserId) {
            setInviteError('Select a friend before inviting.');
            return;
        }

        try {
            setInviteBusyId(communityId);
            await window.axios.post(`/api/v1/communities/${communityId}/invite`, {
                user_id: Number(selectedUserId),
            });
            reload();
        } catch (requestError) {
            setInviteError(requestError?.response?.data?.message || 'Could not invite friend.');
        } finally {
            setInviteBusyId(null);
        }
    }

    return (
        <section>
            <div className="section-head">
                <h2>Communities</h2>
                <p>Anyone can create a community and invite accepted friends.</p>
            </div>

            <form className="composer" onSubmit={onCreateSubmit}>
                <label className="composer-label">Create a new community</label>
                <input
                    className="composer-input"
                    name="name"
                    value={createForm.name}
                    onChange={onCreateChange}
                    placeholder="Community name"
                    required
                />
                <textarea
                    className="composer-input"
                    name="description"
                    value={createForm.description}
                    onChange={onCreateChange}
                    placeholder="What is this community about?"
                    rows={3}
                />
                <label className="composer-label">
                    <input
                        type="checkbox"
                        name="is_private"
                        checked={createForm.is_private}
                        onChange={onCreateChange}
                    />
                    {' '}
                    Private community
                </label>
                <div className="composer-actions">
                    <button className="action-btn" type="submit" disabled={createBusy}>
                        {createBusy ? 'Creating...' : 'Create community'}
                    </button>
                </div>
                {createError ? <span className="error-text">{createError}</span> : null}
            </form>

            {loading || error || unauthorized ? (
                <SectionState
                    loading={loading}
                    error={error}
                    unauthorized={unauthorized}
                    emptyLabel=""
                />
            ) : data.length === 0 ? (
                <SectionState emptyLabel="No communities yet." />
            ) : (
                <div className="stack">
                    {data.map((community) => (
                        <article className="tile" key={community.id}>
                            <div className="tile-head">
                                <strong>{community.name}</strong>
                                <span className="tag">/{community.slug}</span>
                            </div>
                            <p>{community.description || 'No description yet.'}</p>
                            <div className="tile-meta">
                                <span>{community.members_count ?? 0} members</span>
                                <span>{community.is_private ? 'Private' : 'Public'}</span>
                            </div>
                            {currentUser && community.owner_id === currentUser.id ? (
                                <div className="action-row">
                                    <select
                                        className="composer-input"
                                        value={inviteState[community.id] ?? ''}
                                        onChange={(event) => onInviteTargetChange(community.id, event.target.value)}
                                    >
                                        <option value="">Select friend to invite</option>
                                        {acceptedFriends.map((friend) => (
                                            <option key={friend.id} value={friend.id}>
                                                {friend.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        className="action-btn"
                                        type="button"
                                        disabled={inviteBusyId === community.id}
                                        onClick={() => inviteFriend(community.id)}
                                    >
                                        {inviteBusyId === community.id ? 'Inviting...' : 'Invite friend'}
                                    </button>
                                </div>
                            ) : null}
                        </article>
                    ))}
                </div>
            )}
            {inviteError ? <div className="helper warn">{inviteError}</div> : null}
        </section>
    );
}

export default CommunitiesPage;
