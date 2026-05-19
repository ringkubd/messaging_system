import React from 'react';
import { SectionState, useApiData } from './common';

function ModerationPage() {
    const { loading, error, data, unauthorized } = useApiData('/api/v1/admin/reports');

    return (
        <section>
            <div className="section-head">
                <h2>Moderation Queue</h2>
                <p>Admin-only report triage board for trust and safety operations.</p>
            </div>

            {loading || error || unauthorized ? (
                <SectionState
                    loading={loading}
                    error={error}
                    unauthorized={unauthorized}
                    emptyLabel=""
                />
            ) : data.length === 0 ? (
                <SectionState emptyLabel="No pending reports in queue." />
            ) : (
                <div className="stack">
                    {data.map((report) => (
                        <article className="tile" key={report.id}>
                            <div className="tile-head">
                                <strong>{report.reason}</strong>
                                <span className="tag">{report.status}</span>
                            </div>
                            <p>{report.details || 'No details provided by reporter.'}</p>
                            <div className="tile-meta">
                                <span>Reporter: {report.reporter?.name ?? `User #${report.reporter_id}`}</span>
                                <span>
                                    Target: {report.target_type} #{report.target_id}
                                </span>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

export default ModerationPage;
