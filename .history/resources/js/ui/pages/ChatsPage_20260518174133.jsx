import React from 'react';
import { SectionState, useApiData } from './common';

function ChatsPage() {
    const { loading, error, data, unauthorized, prepend } = useApiData('/api/v1/conversations');
    const [participantId, setParticipantId] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState('');

    async function createConversation(event) {
        event.preventDefault();
        setSubmitError('');

        const parsedParticipantId = Number(participantId);
        if (!Number.isInteger(parsedParticipantId) || parsedParticipantId <= 0) {
            setSubmitError('Enter a valid participant user id.');
            return;
        }

        try {
            setSubmitting(true);
            const response = await window.axios.post('/api/v1/conversations', {
                participant_id: parsedParticipantId,
            });

            prepend(response.data);
            setParticipantId('');
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

            <form className="composer composer-inline" onSubmit={createConversation}>
                <label htmlFor="participant-id" className="composer-label">
                    Start conversation (user id)
                </label>
                <div className="composer-row">
                    <input
                        id="participant-id"
                        className="composer-input"
                        value={participantId}
                        onChange={(event) => setParticipantId(event.target.value)}
                        placeholder="e.g. 2"
                    />
                    <button className="action-btn" disabled={submitting} type="submit">
                        {submitting ? 'Starting...' : 'Start'}
                    </button>
                </div>
                {submitError ? <span className="error-text">{submitError}</span> : null}
            </form>

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
