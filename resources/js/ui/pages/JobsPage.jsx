import React from 'react';
import { Link } from 'react-router-dom';
import { SectionState, useApiData, relativeTime } from './common';
import Badge from '../components/Badge';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';


const JOB_TYPES = [
    { key: '', label: 'All' },
    { key: 'full_time', label: 'Full Time' },
    { key: 'part_time', label: 'Part Time' },
    { key: 'internship', label: 'Internship' },
    { key: 'contract', label: 'Contract' },
    { key: 'remote', label: 'Remote' },
];

const TYPE_BADGE_VARIANTS = {
    full_time: 'admin',
    part_time: 'student',
    internship: 'default',
    contract: 'danger',
    remote: 'success',
};

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function MatchBadge({ score }) {
    const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : score >= 25 ? '#f97316' : '#ef4444';
    return (
        <span className="badge" style={{ background: color, color: '#fff', fontSize: '0.75rem' }}>
            {score}% match
        </span>
    );
}

function JobCard({ job, showMatch }) {
    return (
        <Card hover>
            <div className="job-card-body">
                <div className="job-card-header">
                    <Badge variant={TYPE_BADGE_VARIANTS[job.type] || 'default'}>
                        {job.type.replace('_', ' ')}
                    </Badge>
                    {showMatch && job.match_score !== undefined && (
                        <MatchBadge score={job.match_score} />
                    )}
                    {job.deadline && (
                        <span className="text-muted text-sm">
                            Deadline: {formatDate(job.deadline)}
                        </span>
                    )}
                </div>
                <h3 className="job-card-title">{job.title}</h3>
                <div className="job-card-meta">
                    <span>{job.company?.name}</span>
                    {job.location && <span>{job.location}</span>}
                    {job.salary_range && <span>{job.salary_range}</span>}
                </div>
                <p className="job-card-description">
                    {job.description?.length > 150
                        ? job.description.slice(0, 150) + '...'
                        : job.description}
                </p>
                <div className="job-card-footer">
                    <span className="text-muted text-sm">
                        Posted {relativeTime(job.created_at)}
                    </span>
                    <Link className="btn btn-primary btn-sm" to={`/jobs/${job.id}`}>
                        View Details
                    </Link>
                </div>
            </div>
        </Card>
    );
}

function MatchingJobs() {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [jobs, setJobs] = React.useState([]);

    React.useEffect(() => {
        let cancelled = false;
        async function run() {
            try {
                const res = await window.axios.get('/api/v1/jobs/matching');
                if (!cancelled) {
                    setJobs(Array.isArray(res.data) ? res.data : []);
                    setLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    setError('Could not load matching jobs.');
                    setLoading(false);
                }
            }
        }
        run();
        return () => { cancelled = true; };
    }, []);

    if (loading) return <Spinner />;
    if (error) return <EmptyState icon="⚠️">{error}</EmptyState>;

    if (jobs.length === 0) {
        return (
            <EmptyState icon="🎯" sub="Add skills to your profile to get personalized job matches.">
                No matching jobs found
            </EmptyState>
        );
    }

    return (
        <div className="jobs-grid">
            {jobs.map((job) => (
                <JobCard key={job.id} job={job} showMatch />
            ))}
        </div>
    );
}

export default function JobsPage() {
    const [page, setPage] = React.useState(1);
    const [typeFilter, setTypeFilter] = React.useState('');
    const [locationFilter, setLocationFilter] = React.useState('');
    const [skillsFilter, setSkillsFilter] = React.useState('');
    const [sort, setSort] = React.useState('date');
    const [view, setView] = React.useState('browse');

    const params = new URLSearchParams();
    params.set('page', page);
    if (typeFilter) params.set('type', typeFilter);
    if (locationFilter) params.set('location', locationFilter);
    if (skillsFilter) params.set('skills', skillsFilter);
    if (sort) params.set('sort', sort);

    const {
        loading,
        error,
        data,
        unauthorized,
        pagination,
    } = useApiData(`/api/v1/jobs?${params.toString()}`);

    const jobs = data ?? [];

    const viewTabStyle = (v) => ({
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        borderBottom: view === v ? '2px solid var(--primary)' : '2px solid transparent',
        fontWeight: view === v ? 600 : 400,
        color: view === v ? 'var(--primary)' : 'var(--text-muted)',
        transition: 'all 0.2s',
    });

    return (
        <div className="jobs-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Jobs</h1>
                    <p>Browse job openings, internships, and career opportunities.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={viewTabStyle('browse')} onClick={() => setView('browse')}>Browse Jobs</span>
                    <span style={viewTabStyle('matching')} onClick={() => setView('matching')}>Matching Jobs</span>
                </div>
            </div>

            {view === 'matching' ? (
                <MatchingJobs />
            ) : (
                <>
                    <div className="jobs-toolbar">
                        <div className="tabs">
                            {JOB_TYPES.map((t) => (
                                <button
                                    key={t.key}
                                    className={`tab ${typeFilter === t.key ? 'active' : ''}`}
                                    onClick={() => { setTypeFilter(t.key); setPage(1); }}
                                    type="button"
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        <div className="jobs-filters">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="Location..."
                                    value={locationFilter}
                                    onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="Skills..."
                                    value={skillsFilter}
                                    onChange={(e) => { setSkillsFilter(e.target.value); setPage(1); }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <select
                                    className="form-input"
                                    value={sort}
                                    onChange={(e) => { setSort(e.target.value); setPage(1); }}
                                >
                                    <option value="date">Sort by Date</option>
                                    <option value="salary">Sort by Salary</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading || error || unauthorized ? (
                        <SectionState loading={loading} error={error} unauthorized={unauthorized} emptyLabel="" />
                    ) : jobs.length === 0 ? (
                        <EmptyState icon="💼" sub="Check back later for new opportunities.">
                            No jobs found
                        </EmptyState>
                    ) : (
                        <div className="jobs-grid">
                            {jobs.map((job) => (
                                <JobCard key={job.id} job={job} />
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
                </>
            )}
        </div>
    );
}
