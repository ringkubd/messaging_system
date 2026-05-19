import React from 'react';
import { relativeTime, useApiData } from './common';
import Avatar from '../components/Avatar';
import Spinner from '../components/Spinner';
import { useToast } from '../components/Toast';

function AttachmentPreview({ file, onRemove }) {
    const isImage = file.type.startsWith('image/');
    const url = React.useMemo(() => URL.createObjectURL(file), [file]);

    React.useEffect(() => {
        return () => URL.revokeObjectURL(url);
    }, [url]);

    return (
        <div className="attachment-preview">
            {isImage ? (
                <img src={url} alt={file.name} className="attachment-preview-img" />
            ) : (
                <div className="attachment-preview-file">📎 {file.name}</div>
            )}
            <button className="attachment-preview-remove" onClick={onRemove} type="button">×</button>
        </div>
    );
}

function MessageAttachments({ attachments }) {
    if (!attachments || attachments.length === 0) return null;
    return (
        <div className="message-attachments">
            {attachments.map((att, idx) => {
                if (att.type === 'image') {
                    return <img key={idx} src={att.url} alt={att.name} className="message-attachment-img" />;
                }
                if (att.type === 'voice' || att.type === 'audio') {
                    return (
                        <audio key={idx} controls className="message-attachment-audio">
                            <source src={att.url} type={att.mime} />
                        </audio>
                    );
                }
                return (
                    <a key={idx} href={att.url} target="_blank" rel="noreferrer" className="message-attachment-file">
                        📎 {att.name}
                    </a>
                );
            })}
        </div>
    );
}

function GroupChatBubble({ msg, prevMsg, nextMsg, user }) {
    const isSent = msg.sender_id === user?.id;
    const isGrouped = prevMsg?.sender_id === msg.sender_id;
    const isLastInGroup = nextMsg?.sender_id !== msg.sender_id;

    return (
        <div className={`chat-bubble-wrap ${isSent ? 'chat-bubble-wrap-sent' : 'chat-bubble-wrap-received'}`}>
            {!isSent && !isGrouped && (
                <Avatar name={msg.sender?.name} size="sm" />
            )}
            <div className={`chat-bubble ${isSent ? 'chat-bubble-sent' : 'chat-bubble-received'} ${isGrouped ? 'chat-bubble-grouped' : ''}`}>
                {!isSent && !isGrouped && (
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.15rem' }}>
                        {msg.sender?.name}
                    </div>
                )}
                <div>{msg.body}</div>
                <MessageAttachments attachments={msg.attachments} />
                <div className="chat-bubble-meta">
                    <span className="chat-bubble-time">{msg.created_at ? relativeTime(msg.created_at) : ''}</span>
                </div>
            </div>
        </div>
    );
}

function AddMembersModal({ groupId, currentMembers, onClose, onAdded, toast }) {
    const [search, setSearch] = React.useState('');
    const [selectedIds, setSelectedIds] = React.useState([]);
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState('');
    const peopleState = useApiData(`/api/v1/users?search=${encodeURIComponent(search)}`);
    const people = Array.isArray(peopleState.data) ? peopleState.data : [];
    const memberIds = currentMembers.map((m) => m.id || m.user_id);

    function toggleUser(id) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    async function handleSubmit() {
        if (selectedIds.length === 0) return;
        setSubmitting(true);
        setError('');
        try {
            await window.axios.post(`/api/v1/groups/${groupId}/members`, { user_ids: selectedIds });
            toast.success('Members added successfully.');
            onAdded();
        } catch (err) {
            setError(err?.response?.data?.message || 'Could not add members.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title">Add Members</div>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    {error && <div className="form-error" style={{ marginBottom: '0.5rem' }}>{error}</div>}
                    <div className="form-group">
                        <input className="form-input" type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." />
                    </div>
                    {peopleState.loading ? (
                        <Spinner />
                    ) : people.length > 0 ? (
                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                            {people.map((u) => {
                                const alreadyMember = memberIds.includes(u.id);
                                return (
                                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.5rem 0.75rem', cursor: alreadyMember ? 'default' : 'pointer', borderBottom: '1px solid var(--border-light)', opacity: alreadyMember ? 0.5 : 1 }}>
                                        <input type="checkbox" checked={selectedIds.includes(u.id) || alreadyMember} disabled={alreadyMember} onChange={() => toggleUser(u.id)} />
                                        <Avatar name={u.name} size="sm" />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{u.name} {alreadyMember ? '(member)' : ''}</div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{u.email}</div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    ) : search ? (
                        <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>No users found</div>
                    ) : (
                        <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>Search for users to add</div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" type="button" disabled={submitting || selectedIds.length === 0} onClick={handleSubmit}>
                        {submitting ? 'Adding...' : `Add ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function GroupChatWindow({ user, group, onMuteToggle, groupDetail, onMembersAdded }) {
    const [messages, setMessages] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [msgText, setMsgText] = React.useState('');
    const [attachments, setAttachments] = React.useState([]);
    const [submitting, setSubmitting] = React.useState(false);
    const [typingUsers, setTypingUsers] = React.useState([]);
    const [onlineMembers, setOnlineMembers] = React.useState([]);
    const messagesEndRef = React.useRef(null);
    const typingTimeoutRef = React.useRef(null);
    const fileInputRef = React.useRef(null);
    const toast = useToast();

    const [showAddMembers, setShowAddMembers] = React.useState(false);
    const memberCount = groupDetail?.members?.length || group?.members_count || 0;
    const memberAvatars = groupDetail?.members || [];

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    React.useEffect(() => {
        if (!group?.id) {
            setMessages([]);
            return;
        }
        let cancelled = false;
        async function loadMessages() {
            setLoading(true);
            try {
                const res = await window.axios.get(`/api/v1/groups/${group.id}/messages`);
                const payload = res.data;
                const list = Array.isArray(payload) ? payload : payload?.data ?? [];
                if (!cancelled) {
                    setMessages(list.reverse());
                }
            } catch (err) {
                if (!cancelled) {
                    toast.error(err?.response?.data?.message || 'Could not load messages.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadMessages();
        return () => { cancelled = true; };
    }, [group?.id]);

    React.useEffect(() => {
        if (!group?.id || !window.Echo) return;

        const presenceChannel = window.Echo.join(`presence-group.${group.id}`);

        presenceChannel
            .here((users) => {
                setOnlineMembers(users.filter((u) => u.id !== user?.id));
            })
            .joining((u) => {
                setOnlineMembers((prev) => [...prev.filter((x) => x.id !== u.id), u]);
            })
            .leaving((u) => {
                setOnlineMembers((prev) => prev.filter((x) => x.id !== u.id));
            })
            .listenForWhisper('typing', (e) => {
                if (e.user_id !== user?.id) {
                    setTypingUsers((prev) => {
                        if (e.is_typing && !prev.some((p) => p.id === e.user_id)) {
                            return [...prev, { id: e.user_id, name: e.user_name }];
                        }
                        if (!e.is_typing) {
                            return prev.filter((p) => p.id !== e.user_id);
                        }
                        return prev;
                    });
                    clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => setTypingUsers([]), 3000);
                }
            });

        const privateChannel = window.Echo.private(`group.${group.id}`);

        privateChannel
            .listen('.GroupMessageSent', (e) => {
                if (e.sender?.id !== user?.id) {
                    setMessages((prev) => [...prev, {
                        id: e.id,
                        sender_id: e.sender?.id,
                        body: e.body,
                        message_type: e.message_type,
                        metadata: e.metadata,
                        attachments: e.attachments,
                        created_at: e.created_at,
                        sender: e.sender,
                    }]);
                }
            });

        return () => {
            clearTimeout(typingTimeoutRef.current);
            setTypingUsers([]);
            setOnlineMembers([]);
            window.Echo.leave(`presence-group.${group.id}`);
            window.Echo.leave(`group.${group.id}`);
        };
    }, [group?.id, user?.id]);

    async function sendMessage() {
        if ((!msgText.trim() && attachments.length === 0) || !group?.id) return;
        const text = msgText.trim();
        setMsgText('');
        const currentAttachments = attachments;
        setAttachments([]);
        try {
            const formData = new FormData();
            if (text) formData.append('body', text);
            currentAttachments.forEach((file) => {
                if (file.voice) {
                    formData.append('voice', file, 'voice.webm');
                } else {
                    formData.append('attachments[]', file);
                }
            });
            const res = await window.axios.post(`/api/v1/groups/${group.id}/messages`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setMessages((prev) => [...prev, res.data]);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not send message.');
            setMsgText(text);
            setAttachments(currentAttachments);
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    async function handleTyping() {
        if (!group?.id) return;
        try {
            await window.axios.post(`/api/v1/groups/${group.id}/typing`);
        } catch {
            /* ignore */
        }
    }

    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setAttachments((prev) => [...prev, ...files.slice(0, 5 - prev.length)]);
        e.target.value = '';
    }

    function removeAttachment(index) {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    }

    const typingNames = typingUsers.map((u) => u.name);

    return (
        <>
            <div className="chats-window-header">
                <div className="chats-window-header-left">
                    <Avatar name={group?.name} size="sm" />
                    <div>
                        <div className="chats-window-header-name">{group?.name}</div>
                        {group?.description && <div className="text-xs text-muted">{group.description}</div>}
                        {typingNames.length > 0 ? (
                            <div className="typing-indicator">{typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...</div>
                        ) : onlineMembers.length > 0 ? (
                            <div className="online-indicator">{onlineMembers.length} online</div>
                        ) : null}
                    </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {memberAvatars.length > 0 && (
                        <div className="flex" style={{ gap: '-0.25rem' }}>
                            {memberAvatars.slice(0, 3).map((m) => (
                                <Avatar key={m.id || m.user_id} name={m.name || m.user?.name} size="sm" style={{ border: '2px solid var(--paper)', marginLeft: '-0.25rem' }} />
                            ))}
                            {memberCount > 3 && (
                                <span className="text-xs text-muted" style={{ marginLeft: '0.25rem' }}>+{memberCount - 3}</span>
                            )}
                        </div>
                    )}
                    <span className="text-xs text-muted">{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowAddMembers(true)} title="Add members">➕</button>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={onMuteToggle} title={groupDetail?.is_muted ? 'Unmute' : 'Mute'}>
                        {groupDetail?.is_muted ? '🔇' : '🔔'}
                    </button>
                </div>
            </div>
            <div className="chats-window-messages">
                {loading ? (
                    <Spinner />
                ) : messages.length === 0 ? (
                    <div className="chats-empty">No messages yet. Start the conversation!</div>
                ) : (
                    messages.map((msg, idx) => (
                        <GroupChatBubble
                            key={msg.id}
                            msg={msg}
                            prevMsg={messages[idx - 1]}
                            nextMsg={messages[idx + 1]}
                            user={user}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="chats-composer">
                {attachments.length > 0 && (
                    <div className="attachment-preview-row">
                        {attachments.map((file, idx) => (
                            <AttachmentPreview key={idx} file={file} onRemove={() => removeAttachment(idx)} />
                        ))}
                    </div>
                )}
                <div className="chats-composer-row">
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        multiple
                        onChange={handleFileSelect}
                        accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
                    />
                    <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach file"
                    >
                        📎
                    </button>
                    <input
                        className="form-input"
                        type="text"
                        value={msgText}
                        onChange={(e) => { setMsgText(e.target.value); handleTyping(); }}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                    />
                    <button className="btn btn-primary" type="button" onClick={sendMessage} disabled={!msgText.trim() && attachments.length === 0}>
                        Send
                    </button>
                </div>
            </div>

            {showAddMembers && (
                <AddMembersModal
                    groupId={group?.id}
                    currentMembers={memberAvatars}
                    onClose={() => setShowAddMembers(false)}
                    onAdded={() => {
                        setShowAddMembers(false);
                        if (onMembersAdded) onMembersAdded();
                    }}
                    toast={toast}
                />
            )}
        </>
    );
}
