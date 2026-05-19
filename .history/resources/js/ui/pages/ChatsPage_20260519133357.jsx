import React from 'react';
import { useApiData, relativeTime } from './common';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import { useToast } from '../components/Toast';

function playMessageSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
    } catch {
        /* ignore audio errors */
    }
}

function showBrowserNotification(title, body, tag) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
        new Notification(title, { body, tag, icon: '/favicon.ico', badge: '/favicon.ico' });
    } catch {
        /* ignore notification errors */
    }
}

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

function ChatBubble({ msg, prevMsg, nextMsg, user, otherReadId }) {
    const isSent = msg.sender_id === user?.id;
    const isGrouped = prevMsg?.sender_id === msg.sender_id;
    const isLastInGroup = nextMsg?.sender_id !== msg.sender_id;
    const isSeen = isSent && isLastInGroup && msg.id <= (otherReadId ?? 0);

    return (
        <div className={`chat-bubble-wrap ${isSent ? 'chat-bubble-wrap-sent' : 'chat-bubble-wrap-received'}`}>
            {!isSent && !isGrouped && (
                <Avatar name={msg.sender?.name} size="sm" />
            )}
            <div className={`chat-bubble ${isSent ? 'chat-bubble-sent' : 'chat-bubble-received'} ${isGrouped ? 'chat-bubble-grouped' : ''}`}>
                <div>{msg.body}</div>
                <MessageAttachments attachments={msg.attachments} />
                <div className="chat-bubble-meta">
                    <span className="chat-bubble-time">{msg.created_at ? relativeTime(msg.created_at) : ''}</span>
                    {isSeen && <span className="chat-read-receipt" title="Seen">✓✓</span>}
                    {isSent && !isSeen && isLastInGroup && <span className="chat-read-receipt chat-read-receipt-sent" title="Sent">✓</span>}
                </div>
            </div>
        </div>
    );
}

export default function ChatsPage({ user }) {
    const { loading, error, data, unauthorized, reload, prepend, update } = useApiData('/api/v1/conversations');
    const [search, setSearch] = React.useState('');
    const [selectedConv, setSelectedConv] = React.useState(null);
    const [messages, setMessages] = React.useState([]);
    const [messagesLoading, setMessagesLoading] = React.useState(false);
    const [msgText, setMsgText] = React.useState('');
    const [attachments, setAttachments] = React.useState([]);
    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState('');
    const [typingUser, setTypingUser] = React.useState(null);
    const [recording, setRecording] = React.useState(false);
    const [recordingTime, setRecordingTime] = React.useState(0);
    const [onlineUsers, setOnlineUsers] = React.useState([]);
    const [otherReadId, setOtherReadId] = React.useState(null);
    const [isFocused, setIsFocused] = React.useState(document.visibilityState === 'visible');
    const messagesEndRef = React.useRef(null);
    const typingTimeoutRef = React.useRef(null);
    const autoReadTimeoutRef = React.useRef(null);
    const mediaRecorderRef = React.useRef(null);
    const recordingIntervalRef = React.useRef(null);
    const fileInputRef = React.useRef(null);
    const conversationChannelRef = React.useRef(null);
    const sendKeyRef = React.useRef(null);
    const peopleState = useApiData(`/api/v1/users?search=${encodeURIComponent(search)}`);
    const toast = useToast();

    const convList = data && Array.isArray(data) ? data : [];
    const activeConv = convList.find((c) => c.id === selectedConv);

    React.useEffect(() => {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
    }, []);

    React.useEffect(() => {
        function onVis() {
            setIsFocused(document.visibilityState === 'visible');
        }
        function onFocus() {
            setIsFocused(true);
        }
        function onBlur() {
            setIsFocused(false);
        }
        document.addEventListener('visibilitychange', onVis);
        window.addEventListener('focus', onFocus);
        window.addEventListener('blur', onBlur);
        return () => {
            document.removeEventListener('visibilitychange', onVis);
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('blur', onBlur);
        };
    }, []);

    const markRead = React.useCallback(async (messageId = null) => {
        if (!selectedConv) return;
        try {
            await window.axios.post(`/api/v1/conversations/${selectedConv}/read`, {
                last_read_message_id: messageId,
            });
        } catch {
            /* ignore mark-read errors */
        }
    }, [selectedConv]);

    React.useEffect(() => {
        if (activeConv) {
            const other = getOtherParticipant(activeConv);
            setOtherReadId(other?.pivot?.last_read_message_id ?? null);
        } else {
            setOtherReadId(null);
        }
    }, [activeConv]);

    React.useEffect(() => {
        if (!selectedConv) {
            setMessages([]);
            return;
        }
        let cancelled = false;
        async function loadMessages() {
            setMessagesLoading(true);
            try {
                const res = await window.axios.get(`/api/v1/conversations/${selectedConv}/messages`);
                const payload = res.data;
                const list = Array.isArray(payload) ? payload : payload?.data ?? [];
                if (!cancelled) {
                    setMessages(list.reverse());
                    const latestId = list.length > 0 ? list[list.length - 1].id : null;
                    if (latestId) markRead(latestId);
                }
            } catch (err) {
                if (!cancelled) {
                    toast.error(err?.response?.data?.message || 'Could not load messages.');
                }
            } finally {
                if (!cancelled) setMessagesLoading(false);
            }
        }
        loadMessages();

        return () => { cancelled = true; };
    }, [selectedConv, markRead]);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    React.useEffect(() => {
        if (!selectedConv || !window.Echo) return;

        const presenceChannel = window.Echo.join(`conversation.${selectedConv}`);
        conversationChannelRef.current = presenceChannel;

        presenceChannel
            .here((users) => {
                setOnlineUsers(users.filter((u) => u.id !== user?.id));
            })
            .joining((u) => {
                setOnlineUsers((prev) => [...prev.filter((x) => x.id !== u.id), u]);
            })
            .leaving((u) => {
                setOnlineUsers((prev) => prev.filter((x) => x.id !== u.id));
            })
            .listenForWhisper('typing', (e) => {
                if (e.user_id !== user?.id && e.is_typing) {
                    setTypingUser(e.user_name);
                    clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
                }
                if (e.user_id !== user?.id && !e.is_typing) {
                    setTypingUser(null);
                }
            });

        const privateChannel = window.Echo.private(`conversation.${selectedConv}`);

        privateChannel
            .listen('.conversation.message.sent', (e) => {
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

                    const isChatOpen = selectedConv === e.conversation_id && isFocused;
                    if (isChatOpen) {
                        clearTimeout(autoReadTimeoutRef.current);
                        autoReadTimeoutRef.current = setTimeout(() => markRead(e.id), 600);
                        playMessageSound();
                    } else {
                        playMessageSound();
                        const other = getOtherParticipant(activeConv);
                        const senderName = e.sender?.name || other?.name || 'New message';
                        showBrowserNotification(senderName, e.body || 'Sent an attachment', `msg-${e.id}`);
                        toast.info(`New message from ${senderName}`);

                        // Increment unread count for this conversation in list
                        const convId = e.conversation_id;
                        update(convId, (item) => ({
                            ...item,
                            unread_count: (item.unread_count || 0) + 1,
                            latest_message: {
                                id: e.id,
                                body: e.body,
                                created_at: e.created_at,
                                sender: e.sender,
                            },
                        }));
                    }
                }
            })
            .listen('.conversation.read.updated', (e) => {
                if (e.user_id !== user?.id) {
                    setOtherReadId(e.last_read_message_id);
                }
            });

        return () => {
            conversationChannelRef.current = null;
            window.Echo.leave(`conversation.${selectedConv}`);
            clearTimeout(typingTimeoutRef.current);
            clearTimeout(autoReadTimeoutRef.current);
            setTypingUser(null);
            setOnlineUsers([]);
        };
    }, [selectedConv, user?.id, isFocused, markRead, activeConv, toast, update]);

    React.useEffect(() => {
        if (isFocused && selectedConv && messages.length > 0) {
            const latestId = messages[messages.length - 1].id;
            markRead(latestId);
        }
    }, [isFocused, selectedConv, messages, markRead]);

    async function createConversation(participantId) {
        setSubmitError('');
        try {
            setSubmitting(true);
            const response = await window.axios.post('/api/v1/conversations', {
                participant_id: participantId,
            });
            prepend(response.data);
            setSelectedConv(response.data.id);
            setSearch('');
        } catch (err) {
            setSubmitError(err?.response?.data?.message || 'Could not create conversation.');
        } finally {
            setSubmitting(false);
        }
    }

    async function sendMessage() {
        if ((!msgText.trim() && attachments.length === 0) || !selectedConv) return;
        const text = msgText.trim();
        setMsgText('');
        const currentAttachments = attachments;
        setAttachments([]);
        const idempotencyKey = sendKeyRef.current || window.createIdempotencyKey?.() || `msg-${Date.now()}`;
        sendKeyRef.current = idempotencyKey;
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
            const res = await window.axios.post(`/api/v1/conversations/${selectedConv}/messages`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-Idempotency-Key': idempotencyKey,
                },
            });
            setMessages((prev) => [...prev, res.data]);
            sendKeyRef.current = null;
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

    function handleTyping() {
        const channel = conversationChannelRef.current;
        if (!channel) return;

        try {
            channel.whisper('typing', {
                user_id: user?.id,
                user_name: user?.name,
                is_typing: true,
            });
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                try {
                    channel.whisper('typing', {
                        user_id: user?.id,
                        user_name: user?.name,
                        is_typing: false,
                    });
                } catch {
                    /* ignore */
                }
            }, 3000);
        } catch {
            /* ignore typing errors */
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

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const file = new File([blob], 'voice.webm', { type: 'audio/webm' });
                file.voice = true;
                setAttachments((prev) => (prev.length < 5 ? [...prev, file] : prev));
                stream.getTracks().forEach((t) => t.stop());
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
            setRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime((t) => t + 1);
            }, 1000);
        } catch {
            toast.error('Could not access microphone.');
        }
    }

    function stopRecording() {
        mediaRecorderRef.current?.stop();
        clearInterval(recordingIntervalRef.current);
        setRecording(false);
        setRecordingTime(0);
    }

    function getOtherParticipant(conv) {
        if (!conv.participants) return null;
        return conv.participants.find((p) => p.id !== user?.id) || conv.participants[0];
    }

    const isOtherOnline = onlineUsers.some((u) => u.id === getOtherParticipant(activeConv)?.id);

    function handleSelectConversation(id) {
        setSelectedConv(id);
        // Mark conversation as read locally when opened
        const conv = convList.find((c) => c.id === id);
        if (conv && conv.unread_count > 0) {
            update(id, { unread_count: 0 });
        }
    }

    return (
        <div>
            <div className="page-header">
                <h1>Chats</h1>
                <p>Personal conversations with fellow scholars.</p>
            </div>

            <div className="chats-layout">
                <div className="chats-list">
                    <div className="chats-list-header">
                        <input
                            className="form-input"
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search students or start a chat..."
                        />
                        {submitError && <div className="form-error" style={{ marginTop: '0.35rem' }}>{submitError}</div>}
                    </div>

                    {search && peopleState.data?.length > 0 && (
                        <div>
                            <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>
                                Start new conversation
                            </div>
                            {peopleState.data.slice(0, 5).map((u) => (
                                <div key={u.id} className="chats-conversation" onClick={() => createConversation(u.id)}>
                                    <Avatar name={u.name} size="sm" />
                                    <div className="chats-conversation-info">
                                        <div className="chats-conversation-name">{u.name}</div>
                                        <div className="chats-conversation-preview">
                                            {u.round && `Round ${u.round}`} {u.batch && `Batch ${u.batch}`}
                                        </div>
                                    </div>
                                    <button className="btn btn-primary btn-sm" disabled={submitting} type="button">Chat</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {!search && (
                        loading ? <Spinner /> :
                        convList.length === 0 ? (
                            <div className="chats-empty">Search for someone to start chatting</div>
                        ) : (
                            convList.map((conv) => {
                                const other = getOtherParticipant(conv);
                                const latest = conv.latest_message;
                                const hasUnread = (conv.unread_count || 0) > 0;
                                const isOnline = onlineUsers.some((u) => u.id === other?.id);
                                return (
                                    <div
                                        key={conv.id}
                                        className={`chats-conversation ${selectedConv === conv.id ? 'active' : ''}`}
                                        onClick={() => handleSelectConversation(conv.id)}
                                    >
                                        <div className="chats-conversation-avatar-wrap">
                                            <Avatar name={other?.name} size="sm" />
                                            {isOnline && <span className="online-dot" />}
                                        </div>
                                        <div className="chats-conversation-info">
                                            <div className="chats-conversation-name">{other?.name || `Conversation #${conv.id}`}</div>
                                            <div className="chats-conversation-preview">
                                                {latest?.body || 'No messages yet'}
                                            </div>
                                        </div>
                                        <div className="chats-conversation-right">
                                            <div className="chats-conversation-time">
                                                {latest?.created_at ? relativeTime(latest.created_at) : ''}
                                            </div>
                                            {hasUnread && (
                                                <div className="chats-conversation-unread">{conv.unread_count}</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )
                    )}
                </div>

                <div className="chats-window">
                    {!activeConv ? (
                        <div className="chats-empty">
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                            Select a conversation or search for someone to start chatting
                        </div>
                    ) : (
                        <>
                            <div className="chats-window-header">
                                <div className="chats-window-header-left">
                                    <div className="chats-conversation-avatar-wrap">
                                        <Avatar name={getOtherParticipant(activeConv)?.name} size="sm" />
                                        {isOtherOnline && <span className="online-dot" />}
                                    </div>
                                    <div>
                                        <div className="chats-window-header-name">{getOtherParticipant(activeConv)?.name}</div>
                                        {isOtherOnline && <div className="online-indicator">Online</div>}
                                        {typingUser && <div className="typing-indicator">{typingUser} is typing...</div>}
                                    </div>
                                </div>
                            </div>
                            <div className="chats-window-messages">
                                {messagesLoading ? (
                                    <Spinner />
                                ) : messages.length === 0 ? (
                                    <div className="chats-empty">No messages yet. Say hello!</div>
                                ) : (
                                    messages.map((msg, idx) => (
                                        <ChatBubble
                                            key={msg.id}
                                            msg={msg}
                                            prevMsg={messages[idx - 1]}
                                            nextMsg={messages[idx + 1]}
                                            user={user}
                                            otherReadId={otherReadId}
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
                                    {recording ? (
                                        <button className="btn btn-danger btn-sm" type="button" onClick={stopRecording}>
                                            ⏹ {recordingTime}s
                                        </button>
                                    ) : (
                                        <button className="btn btn-ghost btn-sm" type="button" onClick={startRecording} title="Voice message">
                                            🎤
                                        </button>
                                    )}
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
