import React from 'react';
import { SectionState, useApiData } from './common';

function FriendsPage() {
    const friendshipState = useApiData('/api/v1/friendships');
    const blockState = useApiData('/api/v1/blocks');
    const [friendUserId, setFriendUserId] = React.useState('');
    const [blockUserId, setBlockUserId] = React.useState('');
    const [friendError, setFriendError] = React.useState('');
    const [blockError, setBlockError] = React.useState('');

    async function sendFriendRequest(event) {
        event.preventDefault();
        setFriendError('');

        const userId = Number(friendUserId);
        if (!Number.isInteger(userId) || userId <= 0) {
            setFriendError('Enter a valid user id.');
            return;
        }

        try {
            await window.axios.post('/api/v1/friendships', { user_id: userId });
            setFriendUserId('');
            friendshipState.reload();
        } catch (requestError) {
            setFriendError(requestError?.response?.data?.message || 'Could not send request.');
        }
    }

    async function blockUser(event) {
        event.preventDefault();
        setBlockError('');

        const userId = Number(blockUserId);
        if (!Number.isInteger(userId) || userId <= 0) {
            setBlockError('Enter a valid user id.');
            return;
        }

        try {
            await window.axios.post('/api/v1/blocks', { user_id: userId });
            setBlockUserId('');
            blockState.reload();
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
                    <h3 className="subhead">Friendships</h3>
                    <form className="composer composer-inline" onSubmit={sendFriendRequest}>
                        <label htmlFor="friend-user-id" className="composer-label">
                            Send friend request (user id)
                        </label>
                        <div className="composer-row">
                            <input
                                id="friend-user-id"
                                className="composer-input"
                                value={friendUserId}
                                onChange={(event) => setFriendUserId(event.target.value)}
                                placeholder="e.g. 3"
                            />
                            <button className="action-btn" type="submit">
                                Send
                            </button>
                        </div>
                        {friendError ? <span className="error-text">{friendError}</span> : null}
                    </form>

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
                    <form className="composer composer-inline" onSubmit={blockUser}>
                        <label htmlFor="block-user-id" className="composer-label">
                            Block user (user id)
                        </label>
                        <div className="composer-row">
                            <input
                                id="block-user-id"
                                className="composer-input"
                                value={blockUserId}
                                onChange={(event) => setBlockUserId(event.target.value)}
                                placeholder="e.g. 4"
                            />
                            <button className="action-btn" type="submit">
                                Block
                            </button>
                        </div>
                        {blockError ? <span className="error-text">{blockError}</span> : null}
                    </form>

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
