import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SectionState, useApiData, relativeTime } from './common';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
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

function FeedTab({ communityId, currentUser, isMember }) {
    const { loading, error, data, unauthorized, prepend, update, reload } = useApiData(`/api/v1/posts?community_id=${communityId}`);
    const [body, setBody] = React.useState('');
    const [images, setImages] = React.useState([]);
    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState('');
    const fileInputRef = React.useRef(null);
    const toast = useToast();
    const seenPostIds = React.useRef(new Set());
    const dataRef = React.useRef(data);

    React.useEffect(() => { dataRef.current = data; }, [data]);

    React.useEffect(() => {
        seenPostIds.current = new Set(data.map((p) => p.id));
    }, [data]);

    React.useEffect(() => {
        if (!communityId || !window.Echo) return;

        const channel = window.Echo.private(`community.${communityId}`);

        const postHandler = (e) => {
            console.log('[ws] community.post.created', e.id);
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
        };

        const commentHandler = (e) => {
            console.log('[ws] comment.created (community)', e.post_id);
            const post = dataRef.current.find((p) => p.id === e.post_id);
            if (post) {
                update(e.post_id, {
                    comments_count: (post.comments_count ?? 0) + 1,
                });
            }
        };

        const reactionHandler = (e) => {
            console.log('[ws] reaction.created (community)', e.reactable_id);
            if (e.reactable_type === 'App\\Models\\Post') {
                const post = dataRef.current.find((p) => p.id === e.reactable_id);
                if (post) {
                    update(e.reactable_id, {
                        reactions_count: (post.reactions_count ?? 0) + 1,
                    });
                }
            }
        };

        channel.listen('.community.post.created', postHandler);
        channel.listen('.comment.created', commentHandler);
        channel.listen('.reaction.created', reactionHandler);

        return () => {
            channel.stopListening('.community.post.created', postHandler);
            channel.stopListening('.comment.created', commentHandler);
            channel.stopListening('.reaction.created', reactionHandler);
        };
    }, [communityId]);

    async function createPost(event) {
        event.preventDefault();
        setSubmitError('');
        if (!body.trim() && images.length === 0) { setSubmitError('Write something or attach an image before posting.'); return; }
        try {
            setSubmitting(true);
            const formData = new FormData();
            if (body.trim()) formData.append('body', body.trim());
            formData.append('community_id', communityId);
            images.forEach((file) => formData.append('images[]', file));
            const response = await window.axios.post('/api/v1/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            prepend(response.data);
            setBody('');
            setImages([]);
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
        <div className="stack">
            {isMember && (
                <Card>
                    <form onSubmit={createPost}>
                        <div className="form-group">
                            <textarea
                                className="form-input"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Share something with this community..."
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
                </Card>
            )}

            {loading || error || unauthorized ? (
                <SectionState loading={loading} error={error} unauthorized={unauthorized} emptyLabel="" />
            ) : data.length === 0 ? (
                <EmptyState icon="📝" sub="Be the first to post in this community.">No posts yet</EmptyState>
            ) : (
                data.map((post) => (
                    <PostCard key={post.id} post={post} onReact={handleReact} onReply={handleReply} />
                ))
            )}
        </div>
    );
}

function MembersTab({ members, canInvite, communityId, onInvite, currentUser }) {
    const [busyId, setBusyId] = React.useState(null);
    const [selectedFriendId, setSelectedFriendId] = React.useState('');
    const toast = useToast();
    const { data: acceptedFriendsRaw } = useApiData('/api/v1/friendships/accepted');

    const acceptedFriends = React.useMemo(() => {
        const memberIds = new Set((members ?? []).map((member) => member.id));

        return (Array.isArray(acceptedFriendsRaw) ? acceptedFriendsRaw : [])
            .map((entry) => entry.user)
            .filter(Boolean)
            .filter((friend) => friend.id !== currentUser?.id)
            .filter((friend) => !memberIds.has(friend.id));
    }, [acceptedFriendsRaw, members, currentUser]);

    async function handleInvite(userId) {
        setBusyId(userId);
        try {
            await window.axios.post(`/api/v1/communities/${communityId}/invite`, { user_id: userId });
            toast.success('Invitation sent.');
            setSelectedFriendId('');
            onInvite?.();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not invite.');
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="stack">
            {canInvite && (
                <Card>
                    <div className="card-title">Invite Friend</div>
                    {acceptedFriends.length === 0 ? (
                        <EmptyState icon="👥" sub="Add friends first, then invite them here.">
                            No invitable friends found
                        </EmptyState>
                    ) : (
                        <div className="flex flex-center gap-2">
                            <select
                                className="form-input"
                                value={selectedFriendId}
                                onChange={(event) => setSelectedFriendId(event.target.value)}
                            >
                                <option value="">Select a friend</option>
                                {acceptedFriends.map((friend) => (
                                    <option key={friend.id} value={friend.id}>
                                        {friend.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                className="btn btn-primary"
                                type="button"
                                disabled={!selectedFriendId || busyId === Number(selectedFriendId)}
                                onClick={() => handleInvite(Number(selectedFriendId))}
                            >
                                {busyId === Number(selectedFriendId) ? 'Inviting...' : 'Invite'}
                            </button>
                        </div>
                    )}
                </Card>
            )}

            {members.length === 0 ? (
                <EmptyState icon="👥" sub="Invite friends to get started.">No members yet</EmptyState>
            ) : (
                <div className="member-list">
                    {members.map((member) => (
                        <div key={member.id} className="member-card">
                            <Avatar name={member.name} size="sm" />
                            <div className="member-card-info">
                                <div className="member-card-name">{member.name}</div>
                                <div className="member-card-role">
                                    {member.pivot?.role === 'owner' && <Badge variant="admin">Owner</Badge>}
                                    {member.pivot?.role === 'admin' && <Badge variant="student">Admin</Badge>}
                                    {member.pivot?.role === 'member' && <span className="text-muted text-sm">Member</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function AboutTab({ community }) {
    return (
        <Card>
            <div className="stack-sm">
                <div>
                    <div className="form-label">Description</div>
                    <div className="card-body">{community.description || 'No description provided.'}</div>
                </div>
                {community.tags?.length > 0 && (
                    <div>
                        <div className="form-label">Tags</div>
                        <div className="tag-row">
                            {community.tags.map((t) => (
                                <span key={t} className="badge badge-default">{t}</span>
                            ))}
                        </div>
                    </div>
                )}
                <div>
                    <div className="form-label">Privacy</div>
                    <Badge variant={community.is_private ? 'student' : 'default'}>
                        {community.is_private ? 'Private' : 'Public'}
                    </Badge>
                </div>
                <div>
                    <div className="form-label">Owner</div>
                    <div className="flex flex-center gap-2">
                        <Avatar name={community.owner?.name} size="sm" />
                        <span>{community.owner?.name || 'Unknown'}</span>
                    </div>
                </div>
                <div>
                    <div className="form-label">Created</div>
                    <div className="text-muted text-sm">{relativeTime(community.created_at)}</div>
                </div>
            </div>
        </Card>
    );
}

export default function CommunityDetailPage({ currentUser }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tab, setTab] = React.useState('feed');
    const [actionBusy, setActionBusy] = React.useState(false);
    const toast = useToast();

    const {
        loading,
        error,
        data: community,
        unauthorized,
        reload,
        patch,
    } = useApiData(`/api/v1/communities/${id}`);

    const isOwner = community?.owner_id === currentUser?.id;
    const isMember = community?.members?.some((m) => m.id === currentUser?.id) || isOwner;
    const canManage = isOwner || community?.members?.some(
        (m) => m.id === currentUser?.id && ['owner', 'admin'].includes(m.pivot?.role)
    );

    const communityRef = React.useRef(community);
    React.useEffect(() => { communityRef.current = community; }, [community]);

    React.useEffect(() => {
        if (!id || !window.Echo) return;
        const channel = window.Echo.private(`community.${id}`);

        channel
            .listen('.community.member.joined', (e) => {
                console.log('[ws] community.member.joined', e.user_id);
                const current = communityRef.current;
                const members = current?.members || [];
                if (members.some((m) => m.id === e.user_id)) return;
                patch({
                    members: [...members, { id: e.user_id, name: e.user_name, pivot: { role: 'member' } }],
                    members_count: (current?.members_count ?? members.length) + 1,
                });
            });

        return () => {
            window.Echo.leave(`community.${id}`);
        };
    }, [id]);

    async function handleJoin() {
        setActionBusy(true);
        try {
            await window.axios.post(`/api/v1/communities/${id}/join`);
            toast.success('Joined community.');
            reload();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not join community.');
        } finally {
            setActionBusy(false);
        }
    }

    async function handleLeave() {
        setActionBusy(true);
        try {
            await window.axios.post(`/api/v1/communities/${id}/leave`);
            toast.success('Left community.');
            reload();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not leave community.');
        } finally {
            setActionBusy(false);
        }
    }

    if (loading || error || unauthorized) {
        return (
            <div className="community-detail-page">
                <SectionState loading={loading} error={error} unauthorized={unauthorized} emptyLabel="" />
            </div>
        );
    }

    if (!community) {
        return (
            <div className="community-detail-page">
                <EmptyState icon="🏘️" sub="Community not found.">Nothing here</EmptyState>
            </div>
        );
    }

    return (
        <div className="community-detail-page">
            <div className="community-detail-header">
                <div className="community-detail-hero">
                    <Avatar name={community.name} size="xl" />
                    <div className="community-detail-info">
                        <h1>{community.name}</h1>
                        <div className="community-detail-meta">
                            <Badge variant={community.is_private ? 'student' : 'default'}>
                                {community.is_private ? 'Private' : 'Public'}
                            </Badge>
                            <span className="text-muted">{community.members?.length ?? community.members_count ?? 0} members</span>
                            {community.owner && <span className="text-muted">Owner: {community.owner.name}</span>}
                        </div>
                        {community.tags?.length > 0 && (
                            <div className="tag-row" style={{ marginTop: '0.35rem' }}>
                                {community.tags.map((t) => (
                                    <span key={t} className="badge badge-default">{t}</span>
                                ))}
                            </div>
                        )}
                        <p className="community-detail-description">{community.description || 'No description yet.'}</p>
                    </div>
                </div>
                <div className="community-detail-actions">
                    {isMember ? (
                        <>
                            <button className="btn btn-secondary" onClick={() => navigate('/communities')} type="button">
                                ← Back
                            </button>
                            {!isOwner && (
                                <button className="btn btn-ghost" onClick={handleLeave} disabled={actionBusy} type="button">
                                    {actionBusy ? 'Leaving...' : 'Leave'}
                                </button>
                            )}
                            {isOwner && <Badge variant="admin">Owner</Badge>}
                        </>
                    ) : community.is_private ? (
                        <span className="text-muted">Private — invite only</span>
                    ) : (
                        <button className="btn btn-primary" onClick={handleJoin} disabled={actionBusy} type="button">
                            {actionBusy ? 'Joining...' : 'Join Community'}
                        </button>
                    )}
                </div>
            </div>

            <div className="tabs">
                {[
                    { key: 'feed', label: 'Feed' },
                    { key: 'members', label: `Members (${community.members?.length ?? community.members_count ?? 0})` },
                    { key: 'about', label: 'About' },
                ].map((t) => (
                    <button
                        key={t.key}
                        className={`tab ${tab === t.key ? 'active' : ''}`}
                        onClick={() => setTab(t.key)}
                        type="button"
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'feed' && (
                <FeedTab communityId={id} currentUser={currentUser} isMember={isMember} />
            )}
            {tab === 'members' && (
                <MembersTab
                    members={community.members || []}
                    canInvite={canManage}
                    communityId={id}
                    onInvite={reload}
                    currentUser={currentUser}
                />
            )}
            {tab === 'about' && <AboutTab community={community} />}
        </div>
    );
}
