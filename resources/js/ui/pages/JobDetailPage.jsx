import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SectionState, useApiData, relativeTime } from './common';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

const TYPE_BADGE_VARIANTS = {
    full_time: 'admin',
    part_time: 'student',
    internship: 'default',
    contract: 'danger',
    remote: 'success',
};

const STATUS_BADGE_VARIANTS = {
    pending: 'default',
    reviewed: 'student',
    shortlisted: 'admin',
    rejected: 'danger',
    accepted: 'success',
};

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

function ApplicationRow({ application, onStatusChange }) {
    const [updating, setUpdating] = React.useState(false);

    async function handleStatusChange(newStatus) {
        setUpdating(true);
        try {
            await window.axios.patch(`/api/v1/applications/${application.id}/status`, {
                status: newStatus,
            });
            onStatusChange(application.id, newStatus);
        } catch (err) {
            /* ignore */
        } finally {
            setUpdating(false);
        }
    }

    return (
        <tr>
            <td>{application.user?.name}</td>
            <td>{application.user?.email}</td>
            <td>
                <Badge variant={STATUS_BADGE_VARIANTS[application.status] || 'default'}>
                    {application.status}
                </Badge>
            </td>
            <td>
                {application.resume_url && (
                    <a href={application.resume_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                        Resume
                    </a>
                )}
            </td>
            <td>
                {application.cover_letter && (
                    <span title={application.cover_letter} className="text-muted text-sm" style={{ cursor: 'help' }}>
                        {application.cover_letter.length > 60
                            ? application.cover_letter.slice(0, 60) + '...'
                            : application.cover_letter}
                    </span>
                )}
            </td>
            <td>
                <select
                    className="form-input"
                    value={application.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updating}
                    style={{ fontSize: '0.8rem', padding: '2px 4px' }}
                >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                    <option value="accepted">Accepted</option>
                </select>
            </td>
        </tr>
    );
}

export default function JobDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [showApplyModal, setShowApplyModal] = React.useState(false);
    const [coverLetter, setCoverLetter] = React.useState('');
    const [resumeFile, setResumeFile] = React.useState(null);
    const [submitting, setSubmitting] = React.useState(false);
    const userRef = React.useRef(null);

    React.useEffect(() => {
        async function fetchUser() {
            try {
                const res = await window.axios.get('/api/v1/me');
                userRef.current = res.data;
            } catch {
                /* ignore */
            }
        }
        fetchUser();
    }, []);

    const {
        loading,
        error,
        data: job,
        unauthorized,
        reload,
    } = useApiData(`/api/v1/jobs/${id}`);

    const [applications, setApplications] = React.useState([]);
    const [applicationsLoading, setApplicationsLoading] = React.useState(false);
    const [showApplications, setShowApplications] = React.useState(false);

    const isCreator = job && userRef.current && job.created_by === userRef.current.id;
    const isAdmin = job && userRef.current && (userRef.current.role === 'super_admin' || userRef.current.role === 'moderator');
    const canManage = isCreator || isAdmin;

    async function loadApplications() {
        if (!canManage) return;
        setApplicationsLoading(true);
        try {
            const res = await window.axios.get(`/api/v1/jobs/${id}/applications`);
            setApplications(res.data?.data ?? res.data ?? []);
            setShowApplications(true);
        } catch {
            toast.error('Could not load applications.');
        } finally {
            setApplicationsLoading(false);
        }
    }

    function handleApplicationStatusChange(appId, newStatus) {
        setApplications((prev) =>
            (prev ?? []).map((a) =>
                a.id === appId ? { ...a, status: newStatus } : a
            )
        );
        toast.success('Status updated.');
    }

    async function handleApply() {
        setSubmitting(true);
        try {
            const formData = new FormData();
            if (coverLetter.trim()) formData.append('cover_letter', coverLetter);
            if (resumeFile) formData.append('resume', resumeFile);

            await window.axios.post(`/api/v1/jobs/${id}/apply`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Application submitted.');
            setShowApplyModal(false);
            reload();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not submit application.');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!confirm('Delete this job?')) return;
        try {
            await window.axios.delete(`/api/v1/jobs/${id}`);
            toast.success('Job deleted.');
            navigate('/jobs');
        } catch (err) {
            toast.error('Could not delete job.');
        }
    }

    async function handleStatusChange(newStatus) {
        try {
            await window.axios.put(`/api/v1/jobs/${id}`, { status: newStatus });
            toast.success(`Job ${newStatus}.`);
            reload();
        } catch (err) {
            toast.error('Could not update status.');
        }
    }

    if (loading || error || unauthorized) {
        return (
            <div className="job-detail-page">
                <SectionState loading={loading} error={error} unauthorized={unauthorized} emptyLabel="" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="job-detail-page">
                <div className="empty-state">
                    <div className="empty-state-icon">💼</div>
                    <div className="empty-state-text">Job not found.</div>
                </div>
            </div>
        );
    }

    const isApplied = !!job.user_application;
    const isFull = job.max_applications > 0 && (job.applications_count ?? 0) >= job.max_applications;
    const canApply = job.status === 'published' && !isApplied && !isFull;

    return (
        <div className="job-detail-page">
            <div className="job-detail-header">
                <div className="job-detail-info">
                    <div className="job-detail-badges">
                        <Badge variant={TYPE_BADGE_VARIANTS[job.type] || 'default'}>
                            {job.type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="default">{job.status}</Badge>
                    </div>
                    <h1>{job.title}</h1>

                    <div className="job-detail-meta">
                        <div className="job-detail-meta-item">
                            <span className="event-detail-meta-label">Company</span>
                            <span>{job.company?.name}</span>
                        </div>
                        {job.company?.industry && (
                            <div className="job-detail-meta-item">
                                <span className="event-detail-meta-label">Industry</span>
                                <span>{job.company.industry}</span>
                            </div>
                        )}
                        {job.company?.location && (
                            <div className="job-detail-meta-item">
                                <span className="event-detail-meta-label">Location</span>
                                <span>{job.company.location}</span>
                            </div>
                        )}
                        {job.location && (
                            <div className="job-detail-meta-item">
                                <span className="event-detail-meta-label">Job Location</span>
                                <span>{job.location}</span>
                            </div>
                        )}
                        {job.salary_range && (
                            <div className="job-detail-meta-item">
                                <span className="event-detail-meta-label">Salary</span>
                                <span>{job.salary_range}</span>
                            </div>
                        )}
                        {job.deadline && (
                            <div className="job-detail-meta-item">
                                <span className="event-detail-meta-label">Deadline</span>
                                <span>{formatDate(job.deadline)}</span>
                            </div>
                        )}
                        <div className="job-detail-meta-item">
                            <span className="event-detail-meta-label">Posted</span>
                            <span>{relativeTime(job.created_at)}</span>
                        </div>
                        <div className="job-detail-meta-item">
                            <span className="event-detail-meta-label">Applications</span>
                            <span>
                                {job.applications_count ?? 0}
                                {job.max_applications > 0 ? ` / ${job.max_applications}` : ''}
                            </span>
                        </div>
                    </div>

                    {job.description && (
                        <Card>
                            <h3>Description</h3>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{job.description}</p>
                        </Card>
                    )}

                    {job.requirements && (
                        <Card>
                            <h3>Requirements</h3>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{job.requirements}</p>
                        </Card>
                    )}

                    {job.responsibilities && (
                        <Card>
                            <h3>Responsibilities</h3>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{job.responsibilities}</p>
                        </Card>
                    )}

                    {job.skills_required?.length > 0 && (
                        <Card>
                            <h3>Skills Required</h3>
                            <div className="flex flex-wrap gap-1" style={{ marginTop: '0.5rem' }}>
                                {job.skills_required.map((skill, idx) => (
                                    <Badge key={idx} variant="student">{skill}</Badge>
                                ))}
                            </div>
                        </Card>
                    )}

                    <div className="job-detail-actions" style={{ marginTop: '1rem' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate('/jobs')}
                            type="button"
                        >
                            ← Back to Jobs
                        </button>

                        {canApply && (
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowApplyModal(true)}
                                type="button"
                            >
                                Apply Now
                            </button>
                        )}

                        {isApplied && (
                            <Badge variant={STATUS_BADGE_VARIANTS[job.user_application?.status] || 'default'}>
                                Applied — {job.user_application?.status}
                            </Badge>
                        )}

                        {isFull && !isApplied && (
                            <span className="text-muted">Maximum applications reached.</span>
                        )}

                        {job.status !== 'published' && !isApplied && (
                            <span className="text-muted">This job is not accepting applications.</span>
                        )}

                        {canManage && (
                            <div className="flex flex-center gap-2" style={{ marginLeft: 'auto' }}>
                                {job.status === 'published' && (
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleStatusChange('closed')}
                                        type="button"
                                    >
                                        Close
                                    </button>
                                )}
                                {job.status === 'draft' && (
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleStatusChange('published')}
                                        type="button"
                                    >
                                        Publish
                                    </button>
                                )}
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={handleDelete}
                                    type="button"
                                >
                                    Delete
                                </button>
                                {!showApplications && (
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={loadApplications}
                                        disabled={applicationsLoading}
                                        type="button"
                                    >
                                        {applicationsLoading ? 'Loading...' : 'Applications'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {canManage && showApplications && (
                        <div style={{ marginTop: '2rem' }}>
                            <div className="page-header" style={{ marginBottom: '1rem' }}>
                                <h2>Applications ({applications.length})</h2>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setShowApplications(false)}
                                    type="button"
                                >
                                    Hide
                                </button>
                            </div>
                            {applications.length === 0 ? (
                                <EmptyState icon="📋" sub="No applications yet.">
                                    No applications
                                </EmptyState>
                            ) : (
                                <div className="table-wrap" style={{ overflowX: 'auto' }}>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Status</th>
                                                <th>Resume</th>
                                                <th>Cover Letter</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {applications.map((app) => (
                                                <ApplicationRow
                                                    key={app.id}
                                                    application={app}
                                                    onStatusChange={handleApplicationStatusChange}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {showApplyModal && (
                <Modal title="Apply for this Job" onClose={() => setShowApplyModal(false)}>
                    <div className="form-group">
                        <label className="form-label">Cover Letter (optional)</label>
                        <textarea
                            className="form-input"
                            rows="6"
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            placeholder="Tell us why you're a good fit..."
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Resume (optional)</label>
                        <input
                            className="form-input"
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={(e) => setResumeFile(e.target.files[0] || null)}
                        />
                        <span className="text-muted text-sm">PDF, DOC, or TXT (max 10MB)</span>
                    </div>
                    <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                        <button className="btn btn-ghost" onClick={() => setShowApplyModal(false)} type="button">
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleApply} disabled={submitting} type="button">
                            {submitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
