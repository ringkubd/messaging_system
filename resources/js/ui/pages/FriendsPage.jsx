import React from 'react';
import { useApiData } from './common';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import SearchInput from '../components/SearchInput';
import { useToast } from '../components/Toast';

function FriendCard({ user, friendshipId, onRemove }) {
    return (
        <div className="friend-card">
            <Avatar name={user?.name} size="md" />
            <div className="friend-card-info">
                <div className="friend-card-name">{user?.name}</div>
                <div className="friend-card-detail">{user?.email}</div>
                <div className="flex flex-wrap gap-1" style={{ marginTop: '0.25rem' }}>
                    {user?.round && <Badge variant="default">Round {user.round}</Badge>}
                    {user?.batch && <Badge variant="default">Batch {user.batch}</Badge>}
                </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onRemove(friendshipId)} type="button">Remove</button>
        </div>
    );
}

function PendingRequestCard({ friendship, currentUserId, onAccept, onDecline, onCancel }) {
    const isRequester = friendship.requester_id === currentUserId;
    const other = isRequester ? friendship.addressee : friendship.requester;

    return (
        <div className="friend-card">
            <Avatar name={other?.name} size="md" />
            <div className="friend-card-info">
                <div className="friend-card-name">{other?.name}</div>
                <div className="friend-card-detail">{other?.email}</div>
                <Badge variant="pending">{isRequester ? 'Request sent' : 'Wants to be friends'}</Badge>
            </div>
            <div className="friend-card-actions">
                {isRequester ? (
                    <button className="btn btn-ghost btn-sm" onClick={() => onCancel(friendship.id)} type="button">Cancel</button>
                ) : (
                    <>
                        <button className="btn btn-primary btn-sm" onClick={() => onAccept(friendship.id)} type="button">Accept</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => onDecline(friendship.id)} type="button">Decline</button>
                    </>
                )}
            </div>
        </div>
    );
}

function UserSearchCard({ user, friendshipStatus, friendshipId, onAdd, onBlock }) {
    return (
        <div className="friend-card">
            <Avatar name={user?.name} size="md" />
            <div className="friend-card-info">
                <div className="friend-card-name">{user?.name}</div>
                <div className="friend-card-detail">{user?.email}</div>
                <div className="flex flex-wrap gap-1" style={{ marginTop: '0.25rem' }}>
                    {user?.round && <Badge variant="default">Round {user.round}</Badge>}
                    {user?.batch && <Badge variant="default">Batch {user.batch}</Badge>}
                    {user?.course && <Badge variant="default">{user.course}</Badge>}
                </div>
            </div>
            <div className="friend-card-actions">
                {friendshipStatus === 'accepted' ? (
                    <Badge variant="active">Friends</Badge>
                ) : friendshipStatus === 'pending' ? (
                    <Badge variant="pending">Pending</Badge>
                ) : (
                    <>
                        <button className="btn btn-primary btn-sm" onClick={() => onAdd(user.id)} type="button">Add Friend</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => onBlock(user.id)} type="button">Block</button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function FriendsPage({ user }) {
    const [search, setSearch] = React.useState('');
    const toast = useToast();

    const acceptedState = useApiData('/api/v1/friendships/accepted');
    const pendingState = useApiData('/api/v1/friendships?status=pending');
    const peopleState = useApiData(`/api/v1/users?search=${encodeURIComponent(search)}`);
    const blocksState = useApiData('/api/v1/blocks');

    const acceptedFriends = Array.isArray(acceptedState.data) ? acceptedState.data : [];
    const pendingRequests = Array.isArray(pendingState.data) ? pendingState.data : [];
    const blockedUsers = Array.isArray(blocksState.data) ? blocksState.data : [];

    const pendingIncoming = pendingRequests.filter((f) => f.addressee_id === user?.id);
    const pendingOutgoing = pendingRequests.filter((f) => f.requester_id === user?.id);

    function getFriendshipStatus(targetUserId) {
        const accepted = acceptedFriends.find((f) => f.user?.id === targetUserId);
        if (accepted) return { status: 'accepted', id: accepted.friendship_id };
        const pending = pendingRequests.find(
            (f) => (f.requester_id === targetUserId && f.addressee_id === user?.id) ||
                    (f.addressee_id === targetUserId && f.requester_id === user?.id)
        );
        if (pending) return { status: 'pending', id: pending.id };
        const blocked = blockedUsers.find((b) => b.blocked_id === targetUserId);
        if (blocked) return { status: 'blocked', id: blocked.id };
        return { status: 'none', id: null };
    }

    async function sendRequest(userId) {
        try {
            await window.axios.post('/api/v1/friendships', { user_id: userId });
            pendingState.reload();
            toast.success('Friend request sent.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not send request.');
        }
    }

    async function acceptRequest(friendshipId) {
        try {
            await window.axios.patch(`/api/v1/friendships/${friendshipId}/respond`, { status: 'accepted' });
            pendingState.reload();
            acceptedState.reload();
            toast.success('Friend request accepted.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not accept request.');
        }
    }

    async function declineRequest(friendshipId) {
        try {
            await window.axios.patch(`/api/v1/friendships/${friendshipId}/respond`, { status: 'rejected' });
            pendingState.reload();
            toast.success('Friend request declined.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not decline request.');
        }
    }

    async function cancelRequest(friendshipId) {
        try {
            await window.axios.delete(`/api/v1/friendships/${friendshipId}`);
            pendingState.reload();
            toast.success('Request cancelled.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not cancel request.');
        }
    }

    async function removeFriend(friendshipId) {
        try {
            await window.axios.delete(`/api/v1/friendships/${friendshipId}`);
            acceptedState.reload();
            pendingState.reload();
            toast.success('Friend removed.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not remove friend.');
        }
    }

    async function blockUser(userId) {
        try {
            await window.axios.post('/api/v1/blocks', { user_id: userId });
            blocksState.reload();
            acceptedState.reload();
            pendingState.reload();
            toast.success('User blocked.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not block user.');
        }
    }

    async function unblockUser(blockedUserId) {
        try {
            await window.axios.delete(`/api/v1/blocks/${blockedUserId}`);
            blocksState.reload();
            toast.success('User unblocked.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not unblock user.');
        }
    }

    return (
        <div className="friends-page">
            <div className="page-header">
                <h1>Friends</h1>
                <p>Manage your connections, requests, and safety settings.</p>
            </div>

            <div className="friends-grid">
                <div className="friends-main">
                    {pendingIncoming.length > 0 && (
                        <Card>
                            <div className="card-title">Friend Requests ({pendingIncoming.length})</div>
                            <div className="friend-list">
                                {pendingIncoming.map((f) => (
                                    <PendingRequestCard
                                        key={f.id}
                                        friendship={f}
                                        currentUserId={user?.id}
                                        onAccept={acceptRequest}
                                        onDecline={declineRequest}
                                        onCancel={cancelRequest}
                                    />
                                ))}
                            </div>
                        </Card>
                    )}

                    <Card>
                        <div className="card-title">My Friends ({acceptedFriends.length})</div>
                        {acceptedState.loading ? <Spinner /> : acceptedFriends.length === 0 ? (
                            <EmptyState icon="👋" sub="Search below to find and connect with fellow scholars.">No friends yet</EmptyState>
                        ) : (
                            <div className="friend-list">
                                {acceptedFriends.map((f) => (
                                    <FriendCard
                                        key={f.friendship_id}
                                        user={f.user}
                                        friendshipId={f.friendship_id}
                                        onRemove={removeFriend}
                                    />
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card>
                        <div className="card-title">Find People</div>
                        <div style={{ marginBottom: '0.75rem' }}>
                            <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, round, batch, or course..." />
                        </div>
                        {peopleState.loading ? <Spinner /> : search && peopleState.data?.length === 0 ? (
                            <EmptyState icon="🔍" sub="Try a different search term.">No users found</EmptyState>
                        ) : search ? (
                            <div className="friend-list">
                                {peopleState.data.map((u) => {
                                    const fs = getFriendshipStatus(u.id);
                                    return (
                                        <UserSearchCard
                                            key={u.id}
                                            user={u}
                                            friendshipStatus={fs.status}
                                            friendshipId={fs.id}
                                            onAdd={sendRequest}
                                            onBlock={blockUser}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyState icon="🔍" sub="Type a name, email, round, or batch to find scholars.">Start searching</EmptyState>
                        )}
                    </Card>
                </div>

                <div className="friends-side">
                    <Card>
                        <div className="card-title">Sent Requests</div>
                        {pendingOutgoing.length === 0 ? (
                            <EmptyState icon="📭" sub="Requests you send will appear here.">No outgoing requests</EmptyState>
                        ) : (
                            <div className="friend-list">
                                {pendingOutgoing.map((f) => (
                                    <PendingRequestCard
                                        key={f.id}
                                        friendship={f}
                                        currentUserId={user?.id}
                                        onAccept={acceptRequest}
                                        onDecline={declineRequest}
                                        onCancel={cancelRequest}
                                    />
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card>
                        <div className="card-title">Blocked Users</div>
                        {blocksState.loading ? <Spinner /> : blockedUsers.length === 0 ? (
                            <EmptyState icon="🛡️" sub="Users you block will appear here.">No blocked users</EmptyState>
                        ) : (
                            <div className="friend-list">
                                {blockedUsers.map((b) => (
                                    <div key={b.id} className="friend-card">
                                        <Avatar name={b.blocked?.name} size="md" />
                                        <div className="friend-card-info">
                                            <div className="friend-card-name">{b.blocked?.name || `User #${b.blocked_id}`}</div>
                                            <div className="friend-card-detail">{b.blocked?.email}</div>
                                        </div>
                                        <button className="btn btn-ghost btn-sm" onClick={() => unblockUser(b.blocked_id)} type="button">Unblock</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
