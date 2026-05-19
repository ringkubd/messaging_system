import React from 'react';
import { SectionState, useApiData } from './common';

function ChatsPage() {
    const { loading, error, data, unauthorized } = useApiData('/api/v1/conversations');

    return (
        <section>
            <div className="section-head">
                <h2>Chats</h2>
                <p>Personal and group conversations with realtime support.</p>
            </div>

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
