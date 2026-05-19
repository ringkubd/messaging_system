import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SectionState, useApiData, relativeTime } from './common';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

const STATUS_VARIANTS = {
    published: 'default',
    draft: 'student',
    cancelled: 'danger',
    completed: 'admin',
};

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function EventDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [actionBusy, setActionBusy] = React.useState(false);
    const [showQr, setShowQr] = React.useState(false);

    const {
        loading,
        error,
        data: event,
        unauthorized,
        reload,
    } = useApiData(`/api/v1/events/${id}`);

    async function handleRegister() {
        setActionBusy(true);
        try {
            await window.axios.post(`/api/v1/events/${id}/register`);
            toast.success('Registered for event.');
            reload();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not register.');
        } finally {
            setActionBusy(false);
        }
    }

    async function handleCancelRegistration() {
        setActionBusy(true);
        try {
            await window.axios.delete(`/api/v1/events/${id}/register`);
            toast.success('Registration cancelled.');
            reload();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not cancel.');
        } finally {
            setActionBusy(false);
        }
    }

    if (loading || error || unauthorized) {
        return (
            <div className="event-detail-page">
                <SectionState loading={loading} error={error} unauthorized={unauthorized} emptyLabel="" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="event-detail-page">
                <div className="empty-state">
                    <div className="empty-state-icon">📅</div>
                    <div className="empty-state-text">Event not found.</div>
                </div>
            </div>
        );
    }

    const isRegistered = event.user_registration && event.user_registration.status !== 'cancelled';
    const registrationCount = event.registrations_count ?? 0;
    const isFull = event.max_participants > 0 && registrationCount >= event.max_participants;
    const canRegister = event.status === 'published' && !isRegistered && !isFull;

    return (
        <div className="event-detail-page">
            <div className="event-detail-header">
                {event.image && (
                    <div className="event-detail-image">
                        <img src={event.image} alt={event.title} />
                    </div>
                )}
                <div className="event-detail-info">
                    <div className="event-detail-badges">
                        <Badge variant={STATUS_VARIANTS[event.status] || 'default'}>
                            {event.status}
                        </Badge>
                        <Badge variant="default">
                            {event.event_type.replace('_', ' ')}
                        </Badge>
                    </div>
                    <h1>{event.title}</h1>

                    <div className="event-detail-meta">
                        <div className="event-detail-meta-item">
                            <span className="event-detail-meta-label">Start</span>
                            <span>{formatDate(event.start_date)}</span>
                        </div>
                        <div className="event-detail-meta-item">
                            <span className="event-detail-meta-label">End</span>
                            <span>{formatDate(event.end_date)}</span>
                        </div>
                        {event.location && (
                            <div className="event-detail-meta-item">
                                <span className="event-detail-meta-label">Location</span>
                                <span>{event.location}</span>
                            </div>
                        )}
                        {event.online_url && (
                            <div className="event-detail-meta-item">
                                <span className="event-detail-meta-label">Online</span>
                                <a href={event.online_url} target="_blank" rel="noopener noreferrer">
                                    Join Link
                                </a>
                            </div>
                        )}
                        <div className="event-detail-meta-item">
                            <span className="event-detail-meta-label">Capacity</span>
                            <span>
                                {registrationCount}
                                {event.max_participants > 0 ? ` / ${event.max_participants}` : ''} registered
                            </span>
                        </div>
                    </div>

                    <Card>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{event.description}</p>
                    </Card>

                    <div className="event-detail-actions" style={{ marginTop: '1rem' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate('/events')}
                            type="button"
                        >
                            ← Back to Events
                        </button>

                        {canRegister && (
                            <button
                                className="btn btn-primary"
                                onClick={handleRegister}
                                disabled={actionBusy}
                                type="button"
                            >
                                {actionBusy ? 'Registering...' : 'Register'}
                            </button>
                        )}

                        {isRegistered && (
                            <>
                                <Badge variant="admin">Registered</Badge>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setShowQr(true)}
                                    type="button"
                                >
                                    Show QR Code
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={handleCancelRegistration}
                                    disabled={actionBusy}
                                    type="button"
                                >
                                    {actionBusy ? 'Cancelling...' : 'Cancel Registration'}
                                </button>
                            </>
                        )}

                        {isFull && !isRegistered && (
                            <span className="text-muted">Event is full.</span>
                        )}

                        {event.status !== 'published' && !isRegistered && (
                            <span className="text-muted">Registration is not open.</span>
                        )}
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
        </div>
    );
}
