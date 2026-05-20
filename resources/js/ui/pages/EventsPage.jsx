import React from 'react';
import { Link } from 'react-router-dom';
import { SectionState, useApiData } from './common';
import Badge from '../components/Badge';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

const EVENT_TYPES = [
    { key: '', label: 'All' },
    { key: 'workshop', label: 'Workshop' },
    { key: 'seminar', label: 'Seminar' },
    { key: 'hackathon', label: 'Hackathon' },
    { key: 'career_fair', label: 'Career Fair' },
    { key: 'training', label: 'Training' },
    { key: 'alumni_meetup', label: 'Alumni Meetup' },
    { key: 'other', label: 'Other' },
];

const STATUS_VARIANTS = {
    published: 'default',
    draft: 'student',
    cancelled: 'danger',
    completed: 'admin',
};

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function EventCard({ event }) {
    const isRegistered = event.user_registration && event.user_registration.status !== 'cancelled';
    const [showQr, setShowQr] = React.useState(false);

    return (
        <Card hover>
            {event.image && (
                <div className="event-card-image">
                    <img src={event.image} alt={event.title} />
                </div>
            )}
            <div className="event-card-body">
                <div className="event-card-header">
                    <Badge variant={STATUS_VARIANTS[event.status] || 'default'}>
                        {event.status}
                    </Badge>
                    <Badge variant="default">{event.event_type.replace('_', ' ')}</Badge>
                </div>
                <h3 className="event-card-title">{event.title}</h3>
                <div className="event-card-meta">
                    <span>{formatDate(event.start_date)}</span>
                    {event.location && <span>{event.location}</span>}
                    {event.online_url && <span>Online</span>}
                </div>
                <p className="event-card-description">
                    {event.description?.length > 150
                        ? event.description.slice(0, 150) + '...'
                        : event.description}
                </p>
                <div className="event-card-footer">
                    <span className="text-muted text-sm">
                        {event.registrations_count ?? 0}
                        {event.max_participants > 0
                            ? ` / ${event.max_participants}`
                            : ''} registered
                    </span>
                    <div className="flex flex-center gap-2">
                        {isRegistered && (
                            <button
                                className="btn btn-ghost btn-sm"
                                type="button"
                                onClick={(e) => { e.preventDefault(); setShowQr(true); }}
                            >
                                QR Code
                            </button>
                        )}
                        <Link className="btn btn-primary btn-sm" to={`/events/${event.id}`}>
                            Details
                        </Link>
                    </div>
                </div>
            </div>
            {showQr && event.user_registration?.qr_code && (
                <Modal title="Check-in QR Code" onClose={() => setShowQr(false)}>
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${event.user_registration.qr_code}`}
                            alt="QR Code"
                            style={{ maxWidth: 200, borderRadius: 8 }}
                        />
                        <p className="text-muted text-sm" style={{ marginTop: '0.5rem' }}>
                            Show this code at the event for check-in.
                        </p>
                    </div>
                </Modal>
            )}
        </Card>
    );
}

function CreateEventModal({ onClose, onCreated }) {
    const toast = useToast();
    const [busy, setBusy] = React.useState(false);
    const [form, setForm] = React.useState({
        title: '', description: '', event_type: 'workshop',
        location: '', online_url: '', max_participants: '',
        start_date: '', end_date: '',
    });

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setBusy(true);
        try {
            await window.axios.post('/api/v1/events', {
                ...form,
                max_participants: form.max_participants ? parseInt(form.max_participants) : null,
            });
            toast.success('Event created!');
            onCreated();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to create event.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal onClose={onClose} title="Create Event" width="600px">
            <form onSubmit={handleSubmit} className="stack-md">
                <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input className="form-input" name="title" value={form.title} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label className="form-label">Description *</label>
                    <textarea className="form-input" name="description" value={form.description} onChange={handleChange} rows={4} required />
                </div>
                <div className="grid-2" style={{ gap: '0.75rem' }}>
                    <div className="form-group">
                        <label className="form-label">Type *</label>
                        <select className="form-input" name="event_type" value={form.event_type} onChange={handleChange}>
                            {EVENT_TYPES.filter(t => t.key).map(t => (
                                <option key={t.key} value={t.key}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Max Participants</label>
                        <input className="form-input" type="number" name="max_participants" value={form.max_participants} onChange={handleChange} placeholder="Leave empty for unlimited" />
                    </div>
                </div>
                <div className="grid-2" style={{ gap: '0.75rem' }}>
                    <div className="form-group">
                        <label className="form-label">Start Date *</label>
                        <input className="form-input" type="datetime-local" name="start_date" value={form.start_date} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">End Date *</label>
                        <input className="form-input" type="datetime-local" name="end_date" value={form.end_date} onChange={handleChange} required />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-input" name="location" value={form.location} onChange={handleChange} placeholder="Physical location or venue" />
                </div>
                <div className="form-group">
                    <label className="form-label">Online URL</label>
                    <input className="form-input" type="url" name="online_url" value={form.online_url} onChange={handleChange} placeholder="Google Meet / Zoom link" />
                </div>
                <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={busy}>
                        {busy ? 'Creating...' : 'Create Event'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default function EventsPage() {
    const [page, setPage] = React.useState(1);
    const [typeFilter, setTypeFilter] = React.useState('');
    const [showCreate, setShowCreate] = React.useState(false);
    const toast = useToast();

    const typeParam = typeFilter ? `&type=${encodeURIComponent(typeFilter)}` : '';

    const {
        loading,
        error,
        data,
        unauthorized,
        pagination,
        reload,
    } = useApiData(`/api/v1/events?page=${page}${typeParam}`);

    const events = data ?? [];

    async function handleRegister(eventId) {
        try {
            await window.axios.post(`/api/v1/events/${eventId}/register`);
            toast.success('Registered for event.');
            reload();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not register.');
        }
    }

    return (
        <div className="events-page">
            <div className="page-header">
                <div>
                    <h1>Events</h1>
                    <p>Discover and register for workshops, seminars, and more.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Event</button>
            </div>

            <div className="events-toolbar">
                <div className="tabs">
                    {EVENT_TYPES.map((t) => (
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
            </div>

            {loading || error || unauthorized ? (
                <SectionState loading={loading} error={error} unauthorized={unauthorized} emptyLabel="" />
            ) : events.length === 0 ? (
                <EmptyState icon="📅" sub="Check back later for upcoming events.">
                    No events found
                </EmptyState>
            ) : (
                <div className="events-grid">
                    {events.map((event) => (
                        <EventCard key={event.id} event={event} />
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

            {showCreate && (
                <CreateEventModal
                    onClose={() => setShowCreate(false)}
                    onCreated={reload}
                />
            )}
        </div>
    );
}
