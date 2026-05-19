import React from 'react';
import { SectionState, useApiData } from './common';

function FriendsPage() {
    const friendshipState = useApiData('/api/v1/friendships');
    const blockState = useApiData('/api/v1/blocks');

    return (
        <section>
            <div className="section-head">
                <h2>Friends and Safety</h2>
                <p>Friend requests and blocked users in one place.</p>
            </div>

            <div className="split-grid">
                <div>
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
                                            {friendship.requester?.name} -> {friendship.addressee?.name}
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
