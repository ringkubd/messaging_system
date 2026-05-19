import React from 'react';
import { Link } from 'react-router-dom';
import { SectionState, useApiData, relativeTime } from './common';
import Badge from '../components/Badge';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import SearchInput from '../components/SearchInput';
import { useToast } from '../components/Toast';

const RESOURCE_TYPES = [
    { key: '', label: 'All' },
    { key: 'pdf', label: 'PDF' },
    { key: 'video', label: 'Video' },
    { key: 'document', label: 'Document' },
    { key: 'ebook', label: 'E-Book' },
    { key: 'source_code', label: 'Source Code' },
    { key: 'template', label: 'Template' },
    { key: 'other', label: 'Other' },
];

const TYPE_ICONS = {
    pdf: '📄',
    video: '🎬',
    document: '📝',
    ebook: '📖',
    source_code: '💻',
    template: '🔧',
    other: '📁',
};

function renderStars(rating, count, interactive, onRate) {
    const stars = [];
    const r = rating || 0;
    for (let i = 1; i <= 5; i++) {
        const filled = i <= Math.round(r);
        stars.push(
            <span
                key={i}
                className={`resource-star ${filled ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
                onClick={interactive ? () => onRate(i) : undefined}
                role={interactive ? 'button' : undefined}
                tabIndex={interactive ? 0 : undefined}
                onKeyDown={interactive ? (e) => { if (e.key === 'Enter') onRate(i); } : undefined}
            >
                {filled ? '★' : '☆'}
            </span>
        );
    }
    return (
        <span className="resource-stars" title={count > 0 ? `${r.toFixed(1)} / 5 (${count} ratings)` : 'No ratings'}>
            {stars}
            {count > 0 && <span className="text-muted text-sm">({count})</span>}
        </span>
    );
}

function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ResourceCard({ resource }) {
    return (
        <Card hover>
            <div className="resource-card-header">
                <span className="resource-type-icon">{TYPE_ICONS[resource.type] || '📁'}</span>
                <Badge variant="default">{resource.type.replace('_', ' ')}</Badge>
            </div>
            <h3 className="resource-card-title">{resource.title}</h3>
            {resource.description && (
                <p className="resource-card-desc">
                    {resource.description.length > 120
                        ? resource.description.slice(0, 120) + '...'
                        : resource.description}
                </p>
            )}
            <div className="resource-card-meta">
                <span title={`${resource.download_count} downloads`}>⬇ {resource.download_count}</span>
                {renderStars(resource.avg_rating, resource.ratings_count)}
                {resource.file_size && <span className="text-muted text-sm">{formatFileSize(resource.file_size)}</span>}
            </div>
            <div className="resource-card-footer">
                <span className="text-muted text-sm">
                    {resource.user?.name || 'Unknown'}
                    {' · '}
                    {relativeTime(resource.created_at)}
                </span>
                <Link className="btn btn-primary btn-sm" to={`/resources/${resource.id}`}>
                    Details
                </Link>
            </div>
        </Card>
    );
}

export default function ResourcesPage() {
    const [page, setPage] = React.useState(1);
    const [typeFilter, setTypeFilter] = React.useState('');
    const [categoryFilter, setCategoryFilter] = React.useState('');
    const [search, setSearch] = React.useState('');
    const [searchInput, setSearchInput] = React.useState('');
    const [showUpload, setShowUpload] = React.useState(false);
    const [aiCategorySuggestion, setAiCategorySuggestion] = React.useState(null);
    const [aiTagSuggestions, setAiTagSuggestions] = React.useState([]);
    const toast = useToast();

    const typeParam = typeFilter ? `&type=${encodeURIComponent(typeFilter)}` : '';
    const catParam = categoryFilter ? `&category_id=${encodeURIComponent(categoryFilter)}` : '';
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';

    const {
        loading,
        error,
        data,
        unauthorized,
        pagination,
        reload,
    } = useApiData(`/api/v1/resources?page=${page}${typeParam}${catParam}${searchParam}`);

    const resources = data ?? [];

    const { data: categories } = useApiData('/api/v1/resource-categories');
    const cats = Array.isArray(categories) ? categories : [];

    function handleSearchSubmit(e) {
        e?.preventDefault();
        setSearch(searchInput);
        setPage(1);
    }

    return (
        <div className="resources-page">
            <div className="page-header">
                <h1>Resource Hub</h1>
                <p>Browse and share study materials, templates, and tools.</p>
            </div>

            <div className="resources-layout">
                <aside className="resources-sidebar">
                    <div className="resources-sidebar-section">
                        <h4 className="resources-sidebar-title">Categories</h4>
                        <button
                            className={`resources-cat-btn ${!categoryFilter ? 'active' : ''}`}
                            onClick={() => { setCategoryFilter(''); setPage(1); }}
                            type="button"
                        >
                            All Categories
                        </button>
                        {cats.map((cat) => (
                            <button
                                key={cat.id}
                                className={`resources-cat-btn ${categoryFilter === String(cat.id) ? 'active' : ''}`}
                                onClick={() => { setCategoryFilter(String(cat.id)); setPage(1); }}
                                type="button"
                            >
                                {cat.icon && <span>{cat.icon}</span>} {cat.name}
                                {cat.resources_count > 0 && (
                                    <span className="text-muted text-sm"> ({cat.resources_count})</span>
                                )}
                            </button>
                        ))}
                    </div>
                </aside>

                <div className="resources-main">
                    <div className="resources-toolbar">
                        <form onSubmit={handleSearchSubmit} className="resources-search-form">
                            <input
                                className="form-input"
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search resources..."
                            />
                        </form>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowUpload(true)}
                            type="button"
                        >
                            + Upload
                        </button>
                    </div>

                    <div className="tabs" style={{ marginBottom: '1rem' }}>
                        {RESOURCE_TYPES.map((t) => (
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

                    {loading || error || unauthorized ? (
                        <SectionState loading={loading} error={error} unauthorized={unauthorized} emptyLabel="" />
                    ) : resources.length === 0 ? (
                        <EmptyState icon="📚" sub="Be the first to share a resource.">
                            No resources found
                        </EmptyState>
                    ) : (
                        <div className="resources-grid">
                            {resources.map((resource) => (
                                <ResourceCard key={resource.id} resource={resource} />
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
            </div>

            {aiCategorySuggestion && (
                <Modal title="AI Category Suggestion" onClose={() => setAiCategorySuggestion(null)}>
                    <p>The AI suggests categorizing this resource as:</p>
                    <div style={{ padding: '0.75rem 0', fontWeight: 600, fontSize: '1.1rem' }}>
                        {aiCategorySuggestion}
                    </div>
                    <p className="text-muted text-sm">This suggestion will be reviewed by an admin.</p>
                    <div className="flex flex-center gap-2" style={{ marginTop: '1rem' }}>
                        <button className="btn btn-primary" onClick={() => setAiCategorySuggestion(null)} type="button">
                            Got it
                        </button>
                    </div>
                </Modal>
            )}

            {showUpload && (
                <UploadResourceModal
                    categories={cats}
                    onClose={() => setShowUpload(false)}
                    onCreated={(r) => {
                        setShowUpload(false);
                        reload();
                        toast.success('Resource uploaded.');
                        if (r.ai_category) {
                            setAiCategorySuggestion(r.ai_category);
                        }
                    }}
                    toast={toast}
                />
            )}
        </div>
    );
}

function UploadResourceModal({ categories, onClose, onCreated, toast }) {
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [type, setType] = React.useState('pdf');
    const [categoryId, setCategoryId] = React.useState('');
    const [tags, setTags] = React.useState('');
    const [file, setFile] = React.useState(null);
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        if (!title.trim()) { setError('Title is required.'); return; }
        if (!file) { setError('File is required.'); return; }
        setSubmitting(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            if (description.trim()) formData.append('description', description.trim());
            formData.append('type', type);
            if (categoryId) formData.append('category_id', categoryId);
            if (tags.trim()) {
                const tagArr = tags.split(',').map((t) => t.trim()).filter(Boolean);
                tagArr.forEach((t) => formData.append('tags[]', t));
            }
            formData.append('file', file);
            const res = await window.axios.post('/api/v1/resources', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onCreated(res.data);
        } catch (err) {
            setError(err?.response?.data?.message || 'Could not upload resource.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Modal
            title="Upload Resource"
            onClose={onClose}
            footer={
                <>
                    <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" type="button" disabled={submitting || !title.trim() || !file} onClick={handleSubmit}>
                        {submitting ? 'Uploading...' : 'Upload'}
                    </button>
                </>
            }
        >
            {error && <div className="form-error" style={{ marginBottom: '0.5rem' }}>{error}</div>}
            <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resource title" />
            </div>
            <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" rows="3" />
            </div>
            <div className="form-group">
                <label className="form-label">Type *</label>
                <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                    <option value="ebook">E-Book</option>
                    <option value="source_code">Source Code</option>
                    <option value="template">Template</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">No category</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.icon ? `${cat.icon} ` : ''}{cat.name}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Tags (comma separated)</label>
                <input className="form-input" type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. php, laravel, tutorial" />
            </div>
            <div className="form-group">
                <label className="form-label">File *</label>
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ fontSize: '0.85rem' }} />
                <div className="text-muted text-sm" style={{ marginTop: '0.25rem' }}>Max 10 MB</div>
            </div>
        </Modal>
    );
}
