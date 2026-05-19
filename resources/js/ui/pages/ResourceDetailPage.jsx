import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SectionState, useApiData, relativeTime } from './common';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import { useToast } from '../components/Toast';

const TYPE_ICONS = {
    pdf: '📄',
    video: '🎬',
    document: '📝',
    ebook: '📖',
    source_code: '💻',
    template: '🔧',
    other: '📁',
};

function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResourceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [actionBusy, setActionBusy] = React.useState(false);
    const [userRating, setUserRating] = React.useState(0);

    const {
        loading,
        error,
        data: resource,
        unauthorized,
        reload,
    } = useApiData(`/api/v1/resources/${id}`);

    const { data: allResources } = useApiData('/api/v1/resources?per_page=100');
    const related = Array.isArray(allResources)
        ? allResources
            .filter((r) => r.id !== resource?.id && (r.category_id === resource?.category_id || r.type === resource?.type))
            .slice(0, 4)
        : [];

    async function handleDownload() {
        setActionBusy(true);
        try {
            const res = await window.axios.post(`/api/v1/resources/${id}/download`);
            window.open(res.data.url, '_blank');
            reload();
        } catch (err) {
            toast.error('Could not download.');
        } finally {
            setActionBusy(false);
        }
    }

    async function handleRate(rating) {
        setUserRating(rating);
        try {
            const res = await window.axios.post(`/api/v1/resources/${id}/rate`, { rating });
            reload();
            toast.success('Rating submitted.');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not rate.');
        }
    }

    if (loading || error || unauthorized) {
        return (
            <div className="resource-detail-page">
                <SectionState loading={loading} error={error} unauthorized={unauthorized} emptyLabel="" />
            </div>
        );
    }

    if (!resource) {
        return (
            <div className="resource-detail-page">
                <div className="empty-state">
                    <div className="empty-state-icon">📚</div>
                    <div className="empty-state-text">Resource not found.</div>
                </div>
            </div>
        );
    }

    const isImage = resource.file_type?.startsWith('image/');
    const isPdf = resource.file_type === 'application/pdf';

    return (
        <div className="resource-detail-page">
            <div className="resource-detail-header">
                <div className="resource-detail-badges">
                    <span className="resource-type-icon-large">{TYPE_ICONS[resource.type] || '📁'}</span>
                    <Badge variant="default">{resource.type.replace('_', ' ')}</Badge>
                    {resource.category && <Badge variant="default">{resource.category.name}</Badge>}
                </div>

                <h1>{resource.title}</h1>

                <div className="resource-detail-meta">
                    <div className="resource-detail-meta-item">
                        <span className="resource-detail-meta-label">Uploaded by</span>
                        <span>{resource.user?.name || 'Unknown'}</span>
                    </div>
                    <div className="resource-detail-meta-item">
                        <span className="resource-detail-meta-label">Date</span>
                        <span>{relativeTime(resource.created_at)}</span>
                    </div>
                    <div className="resource-detail-meta-item">
                        <span className="resource-detail-meta-label">Downloads</span>
                        <span>{resource.download_count}</span>
                    </div>
                    {resource.file_size && (
                        <div className="resource-detail-meta-item">
                            <span className="resource-detail-meta-label">Size</span>
                            <span>{formatFileSize(resource.file_size)}</span>
                        </div>
                    )}
                    <div className="resource-detail-meta-item">
                        <span className="resource-detail-meta-label">Rating</span>
                        <span>
                            {renderStarsDetail(resource.avg_rating, resource.ratings_count, handleRate)}
                        </span>
                    </div>
                </div>

                {resource.tags && resource.tags.length > 0 && (
                    <div className="resource-detail-tags">
                        {resource.tags.map((tag, i) => (
                            <span key={i} className="badge badge-default">{tag}</span>
                        ))}
                    </div>
                )}

                {resource.description && (
                    <Card>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{resource.description}</p>
                    </Card>
                )}

                <div className="resource-detail-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate('/resources')}
                        type="button"
                    >
                        ← Back to Resources
                    </button>

                    <button
                        className="btn btn-primary"
                        onClick={handleDownload}
                        disabled={actionBusy}
                        type="button"
                    >
                        {actionBusy ? 'Preparing...' : '⬇ Download'}
                    </button>
                </div>
            </div>

            {(isImage || isPdf) && (
                <div className="resource-detail-preview" style={{ marginTop: '1.5rem' }}>
                    <h3>Preview</h3>
                    {isImage ? (
                        <img
                            src={resource.file_url}
                            alt={resource.title}
                            style={{ maxWidth: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                        />
                    ) : (
                        <iframe
                            src={resource.file_url}
                            title={resource.title}
                            style={{ width: '100%', height: 600, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                        />
                    )}
                </div>
            )}

            {related.length > 0 && (
                <div className="resource-detail-related" style={{ marginTop: '2rem' }}>
                    <h3>Related Resources</h3>
                    <div className="resources-grid">
                        {related.map((r) => (
                            <Link key={r.id} to={`/resources/${r.id}`} className="card card-hover" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                                <div className="resource-card-header">
                                    <span className="resource-type-icon">{TYPE_ICONS[r.type] || '📁'}</span>
                                    <Badge variant="default">{r.type.replace('_', ' ')}</Badge>
                                </div>
                                <h4 className="resource-card-title" style={{ margin: '0.5rem 0 0.25rem' }}>{r.title}</h4>
                                <div className="resource-card-meta">
                                    <span>⬇ {r.download_count}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function renderStarsDetail(rating, count, onRate) {
    const stars = [];
    const r = rating || 0;
    for (let i = 1; i <= 5; i++) {
        const filled = i <= Math.round(r);
        stars.push(
            <span
                key={i}
                className={`resource-star filled interactive`}
                onClick={() => onRate(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onRate(i); }}
                style={{ cursor: 'pointer', fontSize: '1.25rem' }}
            >
                {filled ? '★' : '☆'}
            </span>
        );
    }
    return (
        <span className="resource-stars" title={count > 0 ? `${r.toFixed(1)} / 5 (${count} ratings)` : 'No ratings'}>
            {stars}
            {count > 0 && <span className="text-muted text-sm" style={{ marginLeft: '0.35rem' }}>({count})</span>}
        </span>
    );
}
