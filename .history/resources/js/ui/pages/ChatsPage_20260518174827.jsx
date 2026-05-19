import React from 'react';
import { SectionState, useApiData } from './common';

function ChatsPage() {
    const { loading, error, data, unauthorized, prepend } = useApiData('/api/v1/conversations');
    const [search, setSearch] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState('');
    const peopleState = useApiData(`/api/v1/users?search=${encodeURIComponent(search)}`);

    async function createConversation(participantId) {
        setSubmitError('');

        try {
            setSubmitting(true);
            const response = await window.axios.post('/api/v1/conversations', {
                participant_id: participantId,
            });

            prepend(response.data);
        } catch (requestError) {
            setSubmitError(requestError?.response?.data?.message || 'Could not create conversation.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section>
            <div className="section-head">
                <h2>Chats</h2>
                <p>Personal and group conversations with realtime support.</p>
            </div>

            <div className="composer composer-inline">
                <label htmlFor="chat-search" className="composer-label">
                    Search students to message
                </label>
                <input
                    id="chat-search"
                    className="composer-input"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name, email, round, batch, course"
                />
                {submitError ? <span className="error-text">{submitError}</span> : null}
            </div>

            {peopleState.loading || peopleState.error || peopleState.unauthorized ? (
                <SectionState
                    loading={peopleState.loading}
                    error={peopleState.error}
                    unauthorized={peopleState.unauthorized}
                    emptyLabel=""
                />
            ) : peopleState.data.length === 0 ? (
                <SectionState emptyLabel="No student found for chat search." />
            ) : (
                <div className="stack">
                    {peopleState.data.slice(0, 6).map((user) => (
                        <article className="tile" key={user.id}>
                            <div className="tile-head">
                                <strong>{user.name}</strong>
                                <span className="tag">{user.email}</span>
                            </div>
                            <div className="tile-meta">
                                <span>Round: {user.round ?? 'N/A'}</span>
                                <span>Batch: {user.batch ?? 'N/A'}</span>
                                <span>Course: {user.course ?? 'N/A'}</span>
                            </div>
                            <div className="action-row">
                                <button
                                    className="action-btn"
                                    disabled={submitting}
                                    type="button"
                                    onClick={() => createConversation(user.id)}
                                >
                                    {submitting ? 'Starting...' : 'Message'}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {loading || error || unauthorized ? (
                <SectionState
                    loading={loading}
                    error={error}
                    unauthorized={unauthorized}
                    emptyLabel=""
                />
            ) : data.length === 0 ? (
                <SectionState emptyLabel="No conversations yet. Start one from API or mobile app." />
            ) : (
                <div className="stack">
                    {data.map((conversation) => (
                        <article className="tile" key={conversation.id}>
                            <div className="tile-head">
                                <strong>Conversation #{conversation.id}</strong>
                                <span className="tag">{conversation.type}</span>
                            </div>
                            <p>
                                Participants: {(conversation.participants ?? [])
                                    .map((participant) => participant.name)
                                    .join(', ')}
                            </p>
                            <div className="tile-meta">
                                <span>
                                    Last activity:{' '}
                                    {conversation.last_message_at
                                        ? new Date(conversation.last_message_at).toLocaleString()
                                        : 'No messages'}
                                </span>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

export default ChatsPage;
