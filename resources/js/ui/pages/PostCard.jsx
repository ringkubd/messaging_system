import React from 'react';
import { relativeTime } from './common';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import EmojiPicker from '../components/EmojiPicker';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

function PostMedia({ media }) {
    if (!media || media.length === 0) return null;
    return (
        <div className="post-media">
            {media.map((item, idx) => {
                if (item.type === 'image') {
                    return (
                        <a key={idx} href={item.url} target="_blank" rel="noreferrer">
                            <img src={item.url} alt={item.name} className="post-media-img" />
                        </a>
                    );
                }
                return (
                    <a key={idx} href={item.url} target="_blank" rel="noreferrer" className="post-media-file">
                        📎 {item.name}
                    </a>
                );
            })}
        </div>
    );
}

function CommentMedia({ media }) {
    if (!media || media.length === 0) return null;
    return (
        <div className="comment-media-row">
            {media.map((item, idx) => {
                if (item.type === 'image') {
                    return (
                        <a key={idx} href={item.url} target="_blank" rel="noreferrer">
                            <img src={item.url} alt={item.name} className="comment-media-img" />
                        </a>
                    );
                }
                return (
                    <a key={idx} href={item.url} target="_blank" rel="noreferrer" className="comment-media-file">
                        📎 {item.name}
                    </a>
                );
            })}
        </div>
    );
}

function CommentItem({ comment, currentUser, onUpdate, onDelete }) {
    const [editing, setEditing] = React.useState(false);
    const [editBody, setEditBody] = React.useState('');
    const [editBusy, setEditBusy] = React.useState(false);
    const [confirmDelete, setConfirmDelete] = React.useState(false);
    const toast = useToast();
    const isAuthor = currentUser?.id === comment.user_id;

    function handleStartEdit() {
        setEditBody(comment.body || '');
        setEditing(true);
    }

    async function handleSaveEdit() {
        if (!editBody.trim()) { toast.error('Comment cannot be empty.'); return; }
        setEditBusy(true);
        try {
            await window.axios.put(`/api/v1/comments/${comment.id}`, { body: editBody.trim() });
            onUpdate(comment.id, { body: editBody.trim() });
            setEditing(false);
            toast.success('Comment updated.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not update comment.');
        } finally {
            setEditBusy(false);
        }
    }

    function handleCancelEdit() {
        setEditing(false);
        setEditBody('');
    }

    async function handleDelete() {
        setConfirmDelete(false);
        try {
            await window.axios.delete(`/api/v1/comments/${comment.id}`);
            onDelete(comment.id);
            toast.success('Comment deleted.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not delete comment.');
        }
    }

    return (
        <div className="comment-item">
            <Avatar name={comment.author?.name} size="sm" />
            <div className="comment-body">
                <div className="comment-header">
                    <span className="comment-author">{comment.author?.name || 'Unknown'}</span>
                    <span className="comment-time">{relativeTime(comment.created_at)}</span>
                </div>
                {editing ? (
                    <div className="comment-edit-form">
                        <textarea
                            className="form-input"
                            rows={2}
                            value={editBody}
                            onChange={(e) => setEditBody(e.target.value)}
                            maxLength={5000}
                        />
                        <div className="flex flex-center gap-2" style={{ marginTop: '0.35rem' }}>
                            <button className="btn btn-primary btn-sm" disabled={editBusy || !editBody.trim()} onClick={handleSaveEdit} type="button">
                                {editBusy ? 'Saving...' : 'Save'}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={handleCancelEdit} type="button">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <>
                        {comment.body && <div className="comment-text">{comment.body}</div>}
                        <CommentMedia media={comment.media} />
                        {isAuthor && (
                            <div className="comment-actions" style={{ marginTop: '0.25rem' }}>
                                <button className="btn btn-ghost btn-xs" onClick={handleStartEdit} type="button">Edit</button>
                                <button className="btn btn-ghost btn-xs" onClick={() => setConfirmDelete(true)} type="button">Delete</button>
                            </div>
                        )}
                    </>
                )}
            </div>
            {confirmDelete && (
                <Modal
                    title="Delete Comment"
                    onClose={() => setConfirmDelete(false)}
                    footer={
                        <div className="flex flex-center gap-2">
                            <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)} type="button">Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete} type="button">Delete</button>
                        </div>
                    }
                >
                    <p>Are you sure you want to delete this comment? This cannot be undone.</p>
                </Modal>
            )}
        </div>
    );
}

function ReplyImagePreview({ file, onRemove }) {
    const url = URL.createObjectURL(file);
    React.useEffect(() => () => URL.revokeObjectURL(url), [url]);
    return (
        <div className="attachment-preview">
            <img src={url} alt={file.name} className="attachment-preview-img" />
            <button className="attachment-preview-remove" onClick={onRemove} type="button">×</button>
        </div>
    );
}

export default function PostCard({ post, onReact, onReply, currentUser, onUpdatePost, onRemovePost, onDeleteReply }) {
    const [replyOpen, setReplyOpen] = React.useState(false);
    const [replyBody, setReplyBody] = React.useState('');
    const [replyImages, setReplyImages] = React.useState([]);
    const [replyBusy, setReplyBusy] = React.useState(false);
    const [comments, setComments] = React.useState([]);
    const [commentsLoading, setCommentsLoading] = React.useState(false);
    const [commentsLoaded, setCommentsLoaded] = React.useState(false);
    const [editing, setEditing] = React.useState(false);
    const [editBody, setEditBody] = React.useState('');
    const [editBusy, setEditBusy] = React.useState(false);
    const [confirmDelete, setConfirmDelete] = React.useState(false);
    const [deleteBusy, setDeleteBusy] = React.useState(false);
    const fileInputRef = React.useRef(null);
    const textareaRef = React.useRef(null);
    const toast = useToast();
    const isAuthor = currentUser?.id === post.user_id;

    React.useEffect(() => {
        if (!replyOpen || commentsLoaded) return;
        let cancelled = false;
        async function loadComments() {
            setCommentsLoading(true);
            try {
                const res = await window.axios.get(`/api/v1/posts/${post.id}/comments`);
                const payload = res.data;
                const list = Array.isArray(payload) ? payload : payload?.data ?? [];
                if (!cancelled) {
                    setComments(list);
                    setCommentsLoaded(true);
                }
            } catch (err) {
                if (!cancelled) toast.error('Could not load comments.');
            } finally {
                if (!cancelled) setCommentsLoading(false);
            }
        }
        loadComments();
        return () => { cancelled = true; };
    }, [replyOpen, commentsLoaded, post.id]);

    React.useEffect(() => {
        if (!window.Echo) return;
        const channel = window.Echo.channel('feed');
        const handler = (e) => {
            if (e.post_id === post.id) {
                setComments((prev) => {
                    if (prev.some((c) => c.id === e.id)) return prev;
                    return [{
                        id: e.id,
                        user_id: e.user_id,
                        body: e.body,
                        media: e.media,
                        created_at: e.created_at,
                        author: e.author,
                    }, ...prev];
                });
            }
        };
        channel.listen('.comment.created', handler);
        return () => {
            channel.stopListening('.comment.created', handler);
        };
    }, [post.id]);

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleReply(e);
        }
    }

    function handleImageSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setReplyImages((prev) => [...prev, ...files.slice(0, 3 - prev.length)]);
        e.target.value = '';
    }

    function removeImage(index) {
        setReplyImages((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleReply(e) {
        if (e) e.preventDefault();
        if (!replyBody.trim() && replyImages.length === 0) return;
        setReplyBusy(true);
        try {
            const formData = new FormData();
            if (replyBody.trim()) formData.append('body', replyBody.trim());
            replyImages.forEach((file) => formData.append('images[]', file));
            const response = await window.axios.post(`/api/v1/posts/${post.id}/comments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onReply(post.id, response.data);
            setComments((prev) => [response.data, ...prev]);
            setReplyBody('');
            setReplyImages([]);
            toast.success('Reply posted.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not post reply.');
        } finally {
            setReplyBusy(false);
        }
    }

    async function handleReact() {
        try {
            const response = post.user_reacted
                ? await window.axios.delete(`/api/v1/posts/${post.id}/reactions`)
                : await window.axios.post(`/api/v1/posts/${post.id}/reactions`, { type: 'like' });
            onReact(post.id, response.data);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not react.');
        }
    }

    function handleStartEdit() {
        setEditBody(post.body || '');
        setEditing(true);
    }

    async function handleSaveEdit() {
        if (!editBody.trim()) { toast.error('Post cannot be empty.'); return; }
        setEditBusy(true);
        try {
            const response = await window.axios.put(`/api/v1/posts/${post.id}`, { body: editBody.trim() });
            onUpdatePost(post.id, { body: editBody.trim() });
            setEditing(false);
            toast.success('Post updated.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not update post.');
        } finally {
            setEditBusy(false);
        }
    }

    function handleCancelEdit() {
        setEditing(false);
        setEditBody('');
    }

    async function handleDelete() {
        setDeleteBusy(true);
        try {
            await window.axios.delete(`/api/v1/posts/${post.id}`);
            onRemovePost(post.id);
            setConfirmDelete(false);
            toast.success('Post deleted.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not delete post.');
        } finally {
            setDeleteBusy(false);
        }
    }

    function handleCommentUpdate(commentId, updates) {
        setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, ...updates } : c)));
    }

    function handleCommentDelete(commentId) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        if (onDeleteReply) onDeleteReply(post.id);
    }

    return (
        <Card hover>
            <div className="card-header">
                <div className="card-header-left">
                    <Avatar name={post.author?.name} size="sm" />
                    <div>
                        <div className="card-title">
                            {post.author?.name || 'Unknown'}
                            {post.is_from_friend && (
                                <span className="badge badge-friend" style={{ marginLeft: '0.35rem', fontSize: '0.7rem' }}>Friend</span>
                            )}
                        </div>
                        <div className="text-xs text-muted">{relativeTime(post.created_at)}</div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-1">
                    {post.community && (
                        <Badge variant="default">{post.community.name}</Badge>
                    )}
                    {isAuthor && (
                        <div className="flex flex-center gap-1">
                            <button className="btn btn-ghost btn-xs" onClick={handleStartEdit} type="button">Edit</button>
                            <button className="btn btn-ghost btn-xs" onClick={() => setConfirmDelete(true)} type="button">Delete</button>
                        </div>
                    )}
                    <Badge variant="default">#{post.id}</Badge>
                </div>
            </div>
            {editing ? (
                <div className="card-body">
                    <textarea
                        className="form-input"
                        rows={3}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        maxLength={10000}
                    />
                    <div className="flex flex-center gap-2" style={{ marginTop: '0.5rem' }}>
                        <button className="btn btn-primary btn-sm" disabled={editBusy || !editBody.trim()} onClick={handleSaveEdit} type="button">
                            {editBusy ? 'Saving...' : 'Save'}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={handleCancelEdit} type="button">Cancel</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="card-body">{post.body}</div>
                    <PostMedia media={post.media} />
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap" style={{ gap: '0.35rem', marginTop: '0.5rem' }}>
                            {post.tags.map((tag) => (
                                <span key={tag} className="tag-chip">{tag}</span>
                            ))}
                        </div>
                    )}
                </>
            )}
            <div className="card-meta">
                <button
                    className={`feed-action-btn ${post.user_reacted ? 'active' : ''}`}
                    onClick={handleReact}
                    type="button"
                    title="Like"
                >
                    ❤️ {post.reactions_count ?? 0}
                </button>
                <button
                    className="feed-action-btn"
                    onClick={() => setReplyOpen((v) => !v)}
                    type="button"
                >
                    💬 {post.comments_count ?? 0}
                </button>
            </div>

            {replyOpen && (
                <div className="feed-reply">
                    {commentsLoading && <Spinner />}
                    {comments.length > 0 && (
                        <div className="comments-list">
                            {comments.map((c) => (
                                <CommentItem
                                    key={c.id}
                                    comment={c}
                                    currentUser={currentUser}
                                    onUpdate={handleCommentUpdate}
                                    onDelete={handleCommentDelete}
                                />
                            ))}
                        </div>
                    )}
                    <form onSubmit={handleReply}>
                        <textarea
                            ref={textareaRef}
                            className="form-input"
                            rows={2}
                            placeholder="Write a reply... (Enter to send, Shift+Enter for new line)"
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            onKeyDown={handleKeyDown}
                            maxLength={5000}
                        />
                        {replyImages.length > 0 && (
                            <div className="attachment-preview-row" style={{ marginBottom: '0.5rem' }}>
                                {replyImages.map((file, idx) => (
                                    <ReplyImagePreview key={idx} file={file} onRemove={() => removeImage(idx)} />
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
                            <EmojiPicker onPick={(emoji) => {
                                setReplyBody((prev) => prev + emoji);
                                textareaRef.current?.focus();
                            }} />
                            <button
                                className="btn btn-ghost btn-sm"
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                title="Attach image"
                            >
                                📎
                            </button>
                            <button className="btn btn-primary btn-sm" disabled={replyBusy || (!replyBody.trim() && replyImages.length === 0)} type="submit">
                                {replyBusy ? 'Posting...' : 'Reply'}
                            </button>
                            <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setReplyOpen(false); setReplyBody(''); setReplyImages([]); }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {confirmDelete && (
                <Modal
                    title="Delete Post"
                    onClose={() => setConfirmDelete(false)}
                    footer={
                        <div className="flex flex-center gap-2">
                            <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)} type="button">Cancel</button>
                            <button className="btn btn-danger" disabled={deleteBusy} onClick={handleDelete} type="button">
                                {deleteBusy ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    }
                >
                    <p>Are you sure you want to delete this post? This cannot be undone.</p>
                </Modal>
            )}
        </Card>
    );
}
