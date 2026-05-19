import React from 'react';
import { SectionState, useApiData } from './common';

function FeedPage() {
    const { loading, error, data, unauthorized } = useApiData('/api/v1/posts');

    return (
        <section>
            <div className="section-head">
                <h2>Home Feed</h2>
                <p>Posts, reactions, and comments from your network.</p>
            </div>

            {loading || error || unauthorized ? (
                <SectionState
                    loading={loading}
                    error={error}
                    unauthorized={unauthorized}
                    emptyLabel=""
                />
            ) : data.length === 0 ? (
                <SectionState emptyLabel="No posts yet. Create your first post from mobile or API." />
            ) : (
                <div className="stack">
                    {data.map((post) => (
                        <article className="tile" key={post.id}>
                            <div className="tile-head">
                                <strong>{post.author?.name ?? 'Unknown'}</strong>
                                <span className="tag">Post #{post.id}</span>
                            </div>
                            <p>{post.body}</p>
                            <div className="tile-meta">
                                <span>{post.comments_count ?? 0} comments</span>
                                <span>{post.reactions_count ?? 0} reactions</span>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

export default FeedPage;
