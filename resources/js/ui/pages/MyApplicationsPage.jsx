import React from 'react';
import { Link } from 'react-router-dom';
import { SectionState, useApiData, relativeTime } from './common';
import Badge from '../components/Badge';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const STATUS_VARIANTS = {
    pending: 'default',
    reviewed: 'student',
    shortlisted: 'admin',
    rejected: 'danger',
    accepted: 'success',
};

export default function MyApplicationsPage() {
    const [page, setPage] = React.useState(1);

    const {
        loading,
        error,
        data,
        unauthorized,
        pagination,
    } = useApiData(`/api/v1/applications/mine?page=${page}`);

    const applications = data ?? [];

    return (
        <div className="my-applications-page">
            <div className="page-header">
                <h1>My Applications</h1>
                <p>Track your job applications and their status.</p>
            </div>

            {loading || error || unauthorized ? (
                <SectionState loading={loading} error={error} unauthorized={unauthorized} emptyLabel="" />
            ) : applications.length === 0 ? (
                <EmptyState icon="📋" sub="You haven't applied for any jobs yet.">
                    No applications
                </EmptyState>
            ) : (
                <div className="applications-list">
                    {applications.map((app) => (
                        <Card key={app.id}>
                            <div className="application-card-body">
                                <div className="application-card-header">
                                    <h3>
                                        <Link to={`/jobs/${app.job?.id}`}>
                                            {app.job?.title}
                                        </Link>
                                    </h3>
                                    <Badge variant={STATUS_VARIANTS[app.status] || 'default'}>
                                        {app.status}
                                    </Badge>
                                </div>
                                <div className="application-card-meta">
                                    <span>{app.job?.company?.name}</span>
                                    <span className="text-muted text-sm">
                                        Applied {relativeTime(app.created_at)}
                                    </span>
                                </div>
                                {app.cover_letter && (
                                    <p className="text-muted text-sm" style={{ marginTop: '0.5rem' }}>
                                        {app.cover_letter.length > 200
                                            ? app.cover_letter.slice(0, 200) + '...'
                                            : app.cover_letter}
                                    </p>
                                )}
                                {app.resume_url && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <a
                                            href={app.resume_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-ghost btn-sm"
                                        >
                                            View Resume
                                        </a>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {pagination && pagination.last > 1 && (
                <Pagination
                    current={pagination.current}
                    last={pagination.last}
                    onChange={setPage}
                />
            )}
        </div>
    );
}
