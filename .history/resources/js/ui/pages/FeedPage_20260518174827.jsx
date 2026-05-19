import React from 'react';
import { SectionState, useApiData } from './common';

function FeedPage() {
    const { loading, error, data, unauthorized, prepend } = useApiData('/api/v1/posts');
    const [body, setBody] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState('');

    async function createPost(event) {
        event.preventDefault();
        setSubmitError('');

        if (!body.trim()) {
            setSubmitError('Write something before posting.');
            return;
        }

        try {
            setSubmitting(true);
            const response = await window.axios.post('/api/v1/posts', { body: body.trim() });
            prepend(response.data);
            setBody('');
        } catch (requestError) {
            setSubmitError(requestError?.response?.data?.message || 'Could not create post.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section>
            <div className="section-head">
                <h2>Home Feed</h2>
                <p>Posts, reactions, and comments from your network.</p>
            </div>

            <form className="composer" onSubmit={createPost}>
                <label htmlFor="post-body" className="composer-label">
                    Create post
                </label>
                <textarea
                    id="post-body"
                    className="composer-input"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Share an update..."
                    rows={3}
                />
                <div className="composer-actions">
                    <button className="action-btn" disabled={submitting} type="submit">
                        {submitting ? 'Posting...' : 'Post'}
                    </button>
                    {submitError ? <span className="error-text">{submitError}</span> : null}
                </div>
            </form>

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
