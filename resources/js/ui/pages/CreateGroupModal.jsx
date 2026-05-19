import React from 'react';
import { useApiData } from './common';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';

function MemberRow({ user, isSelected, onToggle }) {
    return (
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }}>
            <input type="checkbox" checked={isSelected} onChange={onToggle} />
            <Avatar name={user.name} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{user.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{user.email}</div>
            </div>
            <div className="flex flex-wrap gap-1">
                {user.round && <span className="badge badge-default" style={{ fontSize: '0.7rem' }}>R{user.round}</span>}
                {user.batch && <span className="badge badge-default" style={{ fontSize: '0.7rem' }}>B{user.batch}</span>}
            </div>
        </label>
    );
}

export default function CreateGroupModal({ user, onClose, onCreated, toast }) {
    const [name, setName] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [isPrivate, setIsPrivate] = React.useState(false);
    const [avatarFile, setAvatarFile] = React.useState(null);
    const [avatarPreview, setAvatarPreview] = React.useState(null);
    const [search, setSearch] = React.useState('');
    const [selectedIds, setSelectedIds] = React.useState([]);
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState('');
    const peopleState = useApiData(`/api/v1/users?search=${encodeURIComponent(search)}`);

    const people = Array.isArray(peopleState.data) ? peopleState.data : [];

    function toggleUser(id) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    function handleAvatarChange(e) {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    }

    React.useEffect(() => {
        return () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); };
    }, [avatarPreview]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim()) { setError('Group name is required.'); return; }
        setSubmitting(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('name', name.trim());
            if (description.trim()) formData.append('description', description.trim());
            formData.append('is_private', isPrivate ? '1' : '0');
            if (avatarFile) formData.append('avatar', avatarFile);
            selectedIds.forEach((id) => formData.append('user_ids[]', id));
            const res = await window.axios.post('/api/v1/groups', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onCreated(res.data);
            toast.success('Group created successfully.');
        } catch (err) {
            setError(err?.response?.data?.message || 'Could not create group.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Modal
            title="Create Group"
            onClose={onClose}
            footer={
                <>
                    <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" type="button" disabled={submitting || !name.trim()} onClick={handleSubmit}>
                        {submitting ? 'Creating...' : 'Create Group'}
                    </button>
                </>
            }
        >
            {error && <div className="form-error" style={{ marginBottom: '0.5rem' }}>{error}</div>}
            <div className="form-group">
                <label className="form-label">Group Name *</label>
                <input className="form-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter a name for your group" />
            </div>
            <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this group about?" rows="2" />
            </div>
            <div className="form-group">
                <label className="form-label">Group Avatar</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
                    ) : (
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--muted)' }}>📷</div>
                    )}
                    <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ fontSize: '0.85rem' }} />
                </div>
            </div>
            <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                    <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
                    Private group
                </label>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Private groups are hidden from the directory and require invitation.</div>
            </div>
            <div className="form-group">
                <label className="form-label">Add Members</label>
                <input className="form-input" type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users by name or email..." />
            </div>
            {peopleState.loading ? (
                <Spinner />
            ) : people.length > 0 ? (
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    {people.map((u) => (
                        <MemberRow key={u.id} user={u} isSelected={selectedIds.includes(u.id)} onToggle={() => toggleUser(u.id)} />
                    ))}
                </div>
            ) : search ? (
                <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>No users found</div>
            ) : null}
            {selectedIds.length > 0 && (
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                    {selectedIds.length} member{selectedIds.length !== 1 ? 's' : ''} selected
                </div>
            )}
        </Modal>
    );
}
