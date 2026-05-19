import React from 'react';
import { SectionState, useApiData } from './common';

function CommunitiesPage() {
    const { loading, error, data, unauthorized } = useApiData('/api/v1/communities');

    return (
        <section>
            <div className="section-head">
                <h2>Communities</h2>
                <p>Create and join interest-based spaces with role controls.</p>
            </div>

            {loading || error || unauthorized ? (
                <SectionState
                    loading={loading}
                    error={error}
                    unauthorized={unauthorized}
                    emptyLabel=""
                />
            ) : data.length === 0 ? (
                <SectionState emptyLabel="No communities yet." />
            ) : (
                <div className="stack">
                    {data.map((community) => (
                        <article className="tile" key={community.id}>
                            <div className="tile-head">
                                <strong>{community.name}</strong>
                                <span className="tag">/{community.slug}</span>
                            </div>
                            <p>{community.description || 'No description yet.'}</p>
                            <div className="tile-meta">
                                <span>{community.members_count ?? 0} members</span>
                                <span>{community.is_private ? 'Private' : 'Public'}</span>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

export default CommunitiesPage;
