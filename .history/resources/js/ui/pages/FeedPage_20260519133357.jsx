import React from 'react';
import { SectionState, useApiData } from './common';
import EmptyState from '../components/EmptyState';
import PostCard from './PostCard';
import { useToast } from '../components/Toast';

const MAX_POST_LENGTH = 10000;

function ImagePreview({ file, onRemove }) {
    const url = URL.createObjectURL(file);
    React.useEffect(() => () => URL.revokeObjectURL(url), [url]);
    return (
        <div className="attachment-preview">
            <img src={url} alt={file.name} className="attachment-preview-img" />
            <button className="attachment-preview-remove" onClick={onRemove} type="button">×</button>
        </div>
    );
}

export default function FeedPage() {
    const { loading, error, data, unauthorized, prepend, update } = useApiData('/api/v1/posts');
    const [body, setBody] = React.useState('');
    const [images, setImages] = React.useState([]);
    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState('');
    const [sort, setSort] = React.useState('latest');
    const fileInputRef = React.useRef(null);
    const toast = useToast();
    const seenPostIds = React.useRef(new Set());
    const dataRef = React.useRef(data);
    const submitKeyRef = React.useRef(null);

    React.useEffect(() => { dataRef.current = data; }, [data]);

    React.useEffect(() => {
        seenPostIds.current = new Set(data.map((p) => p.id));
    }, [data]);

    React.useEffect(() => {
        if (!window.Echo) return;

        const channel = window.Echo.channel('feed');

        channel
            .listen('.post.created', (e) => {
                console.log('[ws] post.created', e.id);
                if (!seenPostIds.current.has(e.id)) {
                    seenPostIds.current.add(e.id);
                    prepend({
                        id: e.id,
                        user_id: e.user_id,
                        body: e.body,
                        media: e.media,
                        community_id: e.community_id,
                        created_at: e.created_at,
                        author: e.author,
                        reactions_count: 0,
                        comments_count: 0,
                        user_reacted: false,
                    });
                }
            })
            .listen('.comment.created', (e) => {
                console.log('[ws] comment.created', e.post_id);
                const post = dataRef.current.find((p) => p.id === e.post_id);
                if (post) {
                    update(e.post_id, {
                        comments_count: (post.comments_count ?? 0) + 1,
                    });
                }
            })
            .listen('.reaction.created', (e) => {
                console.log('[ws] reaction.created', e.reactable_id, e.reactable_type);
                if (e.reactable_type === 'App\\Models\\Post') {
                    const post = dataRef.current.find((p) => p.id === e.reactable_id);
                    if (post) {
                        update(e.reactable_id, {
                            reactions_count: (post.reactions_count ?? 0) + 1,
                        });
                    }
                }
            });

        return () => {
            window.Echo.leave('feed');
        };
    }, []);

    async function createPost(event) {
        event.preventDefault();
        setSubmitError('');
        if (!body.trim() && images.length === 0) { setSubmitError('Write something or attach an image before posting.'); return; }
        const idempotencyKey = submitKeyRef.current || window.createIdempotencyKey?.() || `post-${Date.now()}`;
        submitKeyRef.current = idempotencyKey;
        try {
            setSubmitting(true);
            const formData = new FormData();
            if (body.trim()) formData.append('body', body.trim());
            images.forEach((file) => formData.append('images[]', file));
            const response = await window.axios.post('/api/v1/posts', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-Idempotency-Key': idempotencyKey,
                },
            });
            prepend(response.data);
            setBody('');
            setImages([]);
            submitKeyRef.current = null;
        } catch (err) {
            setSubmitError(err?.response?.data?.message || 'Could not create post.');
        } finally {
            setSubmitting(false);
        }
    }

    function handleImageSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setImages((prev) => [...prev, ...files.slice(0, 5 - prev.length)]);
        e.target.value = '';
    }

    function removeImage(index) {
        setImages((prev) => prev.filter((_, i) => i !== index));
    }

    function handleReact(postId, reactionData) {
        const isRemoving = reactionData.action === 'removed';
        const post = data.find((p) => p.id === postId);
        update(postId, {
            reactions_count: Math.max(0, (post?.reactions_count ?? 0) + (isRemoving ? -1 : 1)),
            user_reacted: !isRemoving,
        });
    }

    function handleReply(postId, commentData) {
        update(postId, {
            comments_count: (data.find((p) => p.id === postId)?.comments_count ?? 0) + 1,
        });
    }

    const remaining = MAX_POST_LENGTH - body.length;

    return (
        <div className="feed-page">
            <div className="page-header">
                <h1>Feed</h1>
                <p>Posts, reactions, and comments from the community.</p>
            </div>

            <div className="feed-composer">
                <form onSubmit={createPost}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="post-body">Share an update</label>
                        <textarea
                            id="post-body"
                            className="form-input"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="What's on your mind?"
                            rows={3}
                            maxLength={MAX_POST_LENGTH}
                        />
                        <div className="composer-footer">
                            <span className={`char-counter ${remaining < 500 ? 'warning' : ''}`}>
                                {body.length}/{MAX_POST_LENGTH}
                            </span>
                        </div>
                    </div>
                    {images.length > 0 && (
                        <div className="attachment-preview-row" style={{ marginBottom: '0.5rem' }}>
                            {images.map((file, idx) => (
                                <ImagePreview key={idx} file={file} onRemove={() => removeImage(idx)} />
                            ))}
                        </div>
                    )}
                    <div className="flex flex-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            multiple
                            accept="image/*"
                            onChange={handleImageSelect}
                        />
                        <button
                            className="btn btn-ghost btn-sm"
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            title="Attach image"
                        >
                            📎
                        </button>
                        <button className="btn btn-primary" disabled={submitting || (!body.trim() && images.length === 0)} type="submit">
                            {submitting ? 'Posting...' : 'Post'}
                        </button>
                        {submitError && <span className="form-error">{submitError}</span>}
                    </div>
                </form>
            </div>

            <div className="feed-sort">
                {['latest', 'popular'].map((s) => (
                    <button
                        key={s}
                        className={`feed-sort-btn ${sort === s ? 'active' : ''}`}
                        onClick={() => setSort(s)}
                        type="button"
                    >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {loading || error || unauthorized ? (
                <SectionState loading={loading} error={error} unauthorized={unauthorized} emptyLabel="" />
            ) : data.length === 0 ? (
                <EmptyState icon="📝" sub="Share your first update with the community.">
                    <div className="empty-cta">
                        <p>No posts yet.</p>
                        <button className="btn btn-primary" onClick={() => document.getElementById('post-body')?.focus()}>
                            Write a post
                        </button>
                    </div>
                </EmptyState>
            ) : (
                <div className="stack">
                    {data.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onReact={handleReact}
                            onReply={handleReply}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
