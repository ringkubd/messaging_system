import React from 'react';
import { useApiData } from './common';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import SearchInput from '../components/SearchInput';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';

export default function DirectoryPage() {
    const [search, setSearch] = React.useState('');
    const [filters, setFilters] = React.useState({ round: '', batch: '', course: '', status: '' });

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filters.round) params.set('round', filters.round);
    if (filters.batch) params.set('batch', filters.batch);
    if (filters.course) params.set('course', filters.course);
    if (filters.status) params.set('status', filters.status);

    const { loading, error, data, unauthorized, pagination } = useApiData(`/api/v1/users?${params.toString()}`);

    function updateFilter(key, value) {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }

    return (
        <div>
            <div className="page-header">
                <h1>Members Directory</h1>
                <p>Find and connect with IsDB-BISEW scholars, alumni, and batchmates.</p>
            </div>

            <div className="filter-bar">
                <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." />
                <div className="form-group">
                    <input className="form-input" type="text" placeholder="Round" value={filters.round}
                        onChange={(e) => updateFilter('round', e.target.value)} />
                </div>
                <div className="form-group">
                    <input className="form-input" type="text" placeholder="Batch" value={filters.batch}
                        onChange={(e) => updateFilter('batch', e.target.value)} />
                </div>
                <div className="form-group">
                    <input className="form-input" type="text" placeholder="Course" value={filters.course}
                        onChange={(e) => updateFilter('course', e.target.value)} />
                </div>
                <div className="form-group">
                    <select className="form-input" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>

            {loading ? <Spinner /> : error ? <EmptyState icon="⚠️">{error}</EmptyState> : unauthorized ? <EmptyState icon="🔒">Please log in.</EmptyState> : data.length === 0 ? (
                <EmptyState icon="🔍" sub="Try adjusting your search or filters.">No members found</EmptyState>
            ) : (
                <>
                    <div className="directory-grid">
                        {data.map((member) => (
                            <div key={member.id} className="directory-card">
                                <div className="directory-card-top">
                                    <Avatar name={member.name} />
                                    <div className="directory-card-info">
                                        <div className="directory-card-name">{member.name}</div>
                                        <div className="directory-card-detail">{member.email}</div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {member.role !== 'user' && <Badge variant="admin">{member.role}</Badge>}
                                    {member.suspended_until ? <Badge variant="suspended">Suspended</Badge> : <Badge variant="active">Active</Badge>}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                                    {member.round && <span>Round {member.round} </span>}
                                    {member.batch && <span>Batch {member.batch} </span>}
                                    {member.course && <span>{member.course}</span>}
                                </div>
                                <div className="directory-card-actions">
                                    <button className="btn btn-secondary btn-sm" type="button">Message</button>
                                    <button className="btn btn-secondary btn-sm" type="button">View</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {pagination && (
                        <Pagination current={pagination.current} last={pagination.last} onChange={() => {}} />
                    )}
                </>
            )}
        </div>
    );
}
