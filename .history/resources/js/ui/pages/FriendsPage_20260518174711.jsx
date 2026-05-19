import React from 'react';
import { SectionState, useApiData } from './common';

function FriendsPage() {
    const friendshipState = useApiData('/api/v1/friendships');
    const blockState = useApiData('/api/v1/blocks');
    const [search, setSearch] = React.useState('');
    const [friendError, setFriendError] = React.useState('');
    const [blockError, setBlockError] = React.useState('');
    const peopleState = useApiData(`/api/v1/users?search=${encodeURIComponent(search)}`);

    async function sendFriendRequest(userId) {
        setFriendError('');

        try {
            await window.axios.post('/api/v1/friendships', { user_id: userId });
            friendshipState.reload();
        } catch (requestError) {
            setFriendError(requestError?.response?.data?.message || 'Could not send request.');
        }
    }

    async function blockUser(userId) {
        setBlockError('');

        try {
            await window.axios.post('/api/v1/blocks', { user_id: userId });
            blockState.reload();
            friendshipState.reload();
            peopleState.reload();
        } catch (requestError) {
            setBlockError(requestError?.response?.data?.message || 'Could not block user.');
        }
    }

    return (
        <section>
            <div className="section-head">
                <h2>Friends and Safety</h2>
                <p>Friend requests and blocked users in one place.</p>
            </div>

            <div className="split-grid">
                <div>
                    <h3 className="subhead">Find Students</h3>
                    <div className="composer composer-inline">
                        <label htmlFor="student-search" className="composer-label">
                            Search by name, email, round, batch, or course
                        </label>
                        <input
                            id="student-search"
                            className="composer-input"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search students"
                        />
                        {friendError ? <span className="error-text">{friendError}</span> : null}
                        {blockError ? <span className="error-text">{blockError}</span> : null}
                    </div>

                    {peopleState.loading || peopleState.error || peopleState.unauthorized ? (
                        <SectionState
                            loading={peopleState.loading}
                            error={peopleState.error}
                            unauthorized={peopleState.unauthorized}
                            emptyLabel=""
                        />
                    ) : peopleState.data.length === 0 ? (
                        <SectionState emptyLabel="No student found for this search." />
                    ) : (
                        <div className="stack">
                            {peopleState.data.map((user) => (
                                <article className="tile" key={user.id}>
                                    <div className="tile-head">
                                        <strong>{user.name}</strong>
                                        <span className="tag">{user.email}</span>
                                    </div>
                                    <div className="tile-meta">
                                        <span>Round: {user.round ?? 'N/A'}</span>
                                        <span>Batch: {user.batch ?? 'N/A'}</span>
                                        <span>Course: {user.course ?? 'N/A'}</span>
                                    </div>
                                    <div className="action-row">
                                        <button
                                            className="action-btn"
                                            type="button"
                                            onClick={() => sendFriendRequest(user.id)}
                                        >
                                            Add Friend
                                        </button>
                                        <button
                                            className="action-btn action-btn-danger"
                                            type="button"
                                            onClick={() => blockUser(user.id)}
                                        >
                                            Block
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    <h3 className="subhead">Friendships</h3>

                    {friendshipState.loading || friendshipState.error || friendshipState.unauthorized ? (
                        <SectionState
                            loading={friendshipState.loading}
                            error={friendshipState.error}
                            unauthorized={friendshipState.unauthorized}
                            emptyLabel=""
                        />
                    ) : friendshipState.data.length === 0 ? (
                        <SectionState emptyLabel="No friendships yet." />
                    ) : (
                        <div className="stack">
                            {friendshipState.data.map((friendship) => (
                                <article className="tile" key={friendship.id}>
                                    <div className="tile-head">
                                        <strong>
                                            {friendship.requester?.name} to {friendship.addressee?.name}
                                        </strong>
                                        <span className="tag">{friendship.status}</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="subhead">Blocked Users</h3>

                    {blockState.loading || blockState.error || blockState.unauthorized ? (
                        <SectionState
                            loading={blockState.loading}
                            error={blockState.error}
                            unauthorized={blockState.unauthorized}
                            emptyLabel=""
                        />
                    ) : blockState.data.length === 0 ? (
                        <SectionState emptyLabel="No blocked users." />
                    ) : (
                        <div className="stack">
                            {blockState.data.map((block) => (
                                <article className="tile" key={block.id}>
                                    <div className="tile-head">
                                        <strong>{block.blocked?.name ?? `User #${block.blocked_id}`}</strong>
                                        <span className="tag">blocked</span>
                                    </div>
                                    <p>{block.reason || 'No reason provided.'}</p>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default FriendsPage;
