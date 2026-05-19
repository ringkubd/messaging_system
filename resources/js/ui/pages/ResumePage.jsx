import React from 'react';
import { useToast } from '../components/Toast';
import Spinner from '../components/Spinner';

const API_BASE = '/api/v1';

function SectionHeader({ title, onAdd }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
            {onAdd && <button type="button" className="btn btn-secondary btn-sm" onClick={onAdd}>+ Add</button>}
        </div>
    );
}

function EditableField({ label, name, value, onChange, multiline, placeholder, type }) {
    const inputProps = {
        className: 'form-input',
        name,
        value: value || '',
        onChange: (e) => onChange(name, e.target.value),
        placeholder,
    };
    if (type === 'url') inputProps.type = 'url';
    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            {multiline ? (
                <textarea {...inputProps} rows={3} />
            ) : (
                <input {...inputProps} />
            )}
        </div>
    );
}

function SkillsEditor({ skills, onChange }) {
    const [input, setInput] = React.useState('');

    function addSkill() {
        const trimmed = input.trim();
        if (!trimmed) return;
        if (!skills.includes(trimmed)) {
            onChange([...skills, trimmed]);
        }
        setInput('');
    }

    function removeSkill(skill) {
        onChange(skills.filter((s) => s !== skill));
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    }

    return (
        <div>
            <SectionHeader title="Skills" />
            <div className="tag-input-row" style={{ marginBottom: '0.5rem' }}>
                <input className="form-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type a skill and press Enter" />
                <button type="button" className="btn btn-primary btn-sm" onClick={addSkill}>Add</button>
            </div>
            <div className="flex flex-wrap gap-1">
                {skills.map((skill, i) => (
                    <span key={i} className="badge badge-default" style={{ cursor: 'pointer', paddingRight: '0.25rem' }}>
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.25rem', fontSize: '0.8rem', color: 'inherit', padding: 0, lineHeight: 1 }}>&times;</button>
                    </span>
                ))}
                {skills.length === 0 && <span className="text-sm text-muted">No skills added yet.</span>}
            </div>
        </div>
    );
}

function ExperienceEditor({ experience, onChange }) {
    function handleChange(index, field, value) {
        const updated = experience.map((entry, i) => i === index ? { ...entry, [field]: value } : entry);
        onChange(updated);
    }

    function addEntry() {
        onChange([...experience, { company: '', role: '', start_date: '', end_date: '', description: '' }]);
    }

    function removeEntry(index) {
        onChange(experience.filter((_, i) => i !== index));
    }

    return (
        <div>
            <SectionHeader title="Experience" onAdd={addEntry} />
            {experience.length === 0 ? (
                <p className="text-sm text-muted">No experience entries yet.</p>
            ) : (
                experience.map((entry, i) => (
                    <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.5rem' }}>
                        <div className="grid-2" style={{ gap: '0.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Company</label>
                                <input className="form-input" value={entry.company || ''} onChange={(e) => handleChange(i, 'company', e.target.value)} placeholder="Company name" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <input className="form-input" value={entry.role || ''} onChange={(e) => handleChange(i, 'role', e.target.value)} placeholder="Job title" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Start Date</label>
                                <input className="form-input" value={entry.start_date || ''} onChange={(e) => handleChange(i, 'start_date', e.target.value)} placeholder="e.g. Jan 2020" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Date</label>
                                <input className="form-input" value={entry.end_date || ''} onChange={(e) => handleChange(i, 'end_date', e.target.value)} placeholder="e.g. Dec 2022" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="form-input" value={entry.description || ''} onChange={(e) => handleChange(i, 'description', e.target.value)} rows={2} placeholder="Brief description" />
                        </div>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeEntry(i)} style={{ marginTop: '0.25rem' }}>Remove</button>
                    </div>
                ))
            )}
        </div>
    );
}

function EducationEditor({ education, onChange }) {
    function handleChange(index, field, value) {
        const updated = education.map((entry, i) => i === index ? { ...entry, [field]: value } : entry);
        onChange(updated);
    }

    return (
        <div>
            <SectionHeader title="Education" />
            {education.length === 0 ? (
                <p className="text-sm text-muted">No education info. Add your round, batch, and course in profile settings.</p>
            ) : (
                education.map((entry, i) => (
                    <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">Institution</label>
                            <input className="form-input" value={entry.institution || ''} onChange={(e) => handleChange(i, 'institution', e.target.value)} placeholder="Institution name" />
                        </div>
                        <div className="grid-3" style={{ gap: '0.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Course</label>
                                <input className="form-input" value={entry.course || ''} onChange={(e) => handleChange(i, 'course', e.target.value)} placeholder="e.g. Web Development" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Round</label>
                                <input className="form-input" value={entry.round || ''} onChange={(e) => handleChange(i, 'round', e.target.value)} placeholder="e.g. 2024" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Batch</label>
                                <input className="form-input" value={entry.batch || ''} onChange={(e) => handleChange(i, 'batch', e.target.value)} placeholder="e.g. 4" />
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

function CertificationsEditor({ certifications, onChange }) {
    function handleChange(index, field, value) {
        const updated = certifications.map((entry, i) => i === index ? { ...entry, [field]: value } : entry);
        onChange(updated);
    }

    function addEntry() {
        onChange([...certifications, { name: '', issuer: '', date: '', url: '' }]);
    }

    function removeEntry(index) {
        onChange(certifications.filter((_, i) => i !== index));
    }

    return (
        <div>
            <SectionHeader title="Certifications" onAdd={addEntry} />
            {certifications.length === 0 ? (
                <p className="text-sm text-muted">No certifications added yet.</p>
            ) : (
                certifications.map((entry, i) => (
                    <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.5rem' }}>
                        <div className="grid-2" style={{ gap: '0.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input className="form-input" value={entry.name || ''} onChange={(e) => handleChange(i, 'name', e.target.value)} placeholder="Certification name" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Issuer</label>
                                <input className="form-input" value={entry.issuer || ''} onChange={(e) => handleChange(i, 'issuer', e.target.value)} placeholder="Issuing organization" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Date</label>
                                <input className="form-input" value={entry.date || ''} onChange={(e) => handleChange(i, 'date', e.target.value)} placeholder="e.g. Jan 2024" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">URL</label>
                                <input className="form-input" type="url" value={entry.url || ''} onChange={(e) => handleChange(i, 'url', e.target.value)} placeholder="https://..." />
                            </div>
                        </div>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeEntry(i)} style={{ marginTop: '0.25rem' }}>Remove</button>
                    </div>
                ))
            )}
        </div>
    );
}

function ProjectsEditor({ projects, onChange }) {
    function handleChange(index, field, value) {
        const updated = projects.map((entry, i) => i === index ? { ...entry, [field]: value } : entry);
        onChange(updated);
    }

    function addEntry() {
        onChange([...projects, { name: '', description: '', url: '', technologies: [] }]);
    }

    function removeEntry(index) {
        onChange(projects.filter((_, i) => i !== index));
    }

    function addTechnology(projIndex, tech) {
        const trimmed = tech.trim();
        if (!trimmed) return;
        const updated = projects.map((entry, i) => {
            if (i !== projIndex) return entry;
            const techs = entry.technologies || [];
            if (techs.includes(trimmed)) return entry;
            return { ...entry, technologies: [...techs, trimmed] };
        });
        onChange(updated);
    }

    function removeTechnology(projIndex, tech) {
        const updated = projects.map((entry, i) => {
            if (i !== projIndex) return entry;
            return { ...entry, technologies: (entry.technologies || []).filter((t) => t !== tech) };
        });
        onChange(updated);
    }

    return (
        <div>
            <SectionHeader title="Projects" onAdd={addEntry} />
            {projects.length === 0 ? (
                <p className="text-sm text-muted">No projects added yet.</p>
            ) : (
                projects.map((entry, i) => (
                    <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.5rem' }}>
                        <div className="grid-2" style={{ gap: '0.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Project Name</label>
                                <input className="form-input" value={entry.name || ''} onChange={(e) => handleChange(i, 'name', e.target.value)} placeholder="Project name" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">URL</label>
                                <input className="form-input" type="url" value={entry.url || ''} onChange={(e) => handleChange(i, 'url', e.target.value)} placeholder="https://..." />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="form-input" value={entry.description || ''} onChange={(e) => handleChange(i, 'description', e.target.value)} rows={2} placeholder="Brief description" />
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <label className="form-label">Technologies</label>
                            <div className="flex flex-wrap gap-1" style={{ marginBottom: '0.35rem' }}>
                                {(entry.technologies || []).map((tech, ti) => (
                                    <span key={ti} className="badge badge-default" style={{ cursor: 'pointer', paddingRight: '0.25rem' }}>
                                        {tech}
                                        <button type="button" onClick={() => removeTechnology(i, tech)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.25rem', fontSize: '0.8rem', color: 'inherit', padding: 0, lineHeight: 1 }}>&times;</button>
                                    </span>
                                ))}
                            </div>
                            <TechInput onAdd={(tech) => addTechnology(i, tech)} />
                        </div>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeEntry(i)}>Remove</button>
                    </div>
                ))
            )}
        </div>
    );
}

function TechInput({ onAdd }) {
    const [val, setVal] = React.useState('');

    function handleSubmit(e) {
        e.preventDefault();
        if (!val.trim()) return;
        onAdd(val.trim());
        setVal('');
    }

    return (
        <form onSubmit={handleSubmit} className="tag-input-row">
            <input className="form-input" value={val} onChange={(e) => setVal(e.target.value)} placeholder="Add technology" style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary btn-sm">+</button>
        </form>
    );
}

function LinksEditor({ linkedin_url, github_url, portfolio_url, onChange }) {
    return (
        <div>
            <SectionHeader title="Links" />
            <div className="grid-3" style={{ gap: '0.5rem' }}>
                <div className="form-group">
                    <label className="form-label">LinkedIn URL</label>
                    <input className="form-input" type="url" value={linkedin_url || ''} onChange={(e) => onChange('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="form-group">
                    <label className="form-label">GitHub URL</label>
                    <input className="form-input" type="url" value={github_url || ''} onChange={(e) => onChange('github_url', e.target.value)} placeholder="https://github.com/..." />
                </div>
                <div className="form-group">
                    <label className="form-label">Portfolio URL</label>
                    <input className="form-input" type="url" value={portfolio_url || ''} onChange={(e) => onChange('portfolio_url', e.target.value)} placeholder="https://..." />
                </div>
            </div>
        </div>
    );
}

function ResumePreview({ data }) {
    const { name, email, phone, address, bio, avatar, skills, experience, education, certifications, projects, linkedin_url, github_url, portfolio_url } = data;

    const contactItems = [email, phone, address].filter(Boolean);
    const linkItems = [];
    if (linkedin_url) linkItems.push({ label: 'LinkedIn', url: linkedin_url });
    if (github_url) linkItems.push({ label: 'GitHub', url: github_url });
    if (portfolio_url) linkItems.push({ label: 'Portfolio', url: portfolio_url });

    return (
        <div className="resume-preview">
            <div className="resume-preview-header">
                {avatar && <img src={avatar} alt={name} className="resume-preview-avatar" />}
                <div>
                    <h1 className="resume-preview-name">{name || 'Your Name'}</h1>
                    <div className="resume-preview-contact">
                        {contactItems.map((item, i) => (
                            <span key={i} className="resume-preview-contact-item">{item}</span>
                        ))}
                    </div>
                    {linkItems.length > 0 && (
                        <div className="resume-preview-links">
                            {linkItems.map((link, i) => (
                                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="resume-preview-link">{link.label}</a>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {bio && (
                <div className="resume-preview-section">
                    <h2 className="resume-preview-section-title">Professional Summary</h2>
                    <p className="resume-preview-text">{bio}</p>
                </div>
            )}

            {skills && skills.length > 0 && (
                <div className="resume-preview-section">
                    <h2 className="resume-preview-section-title">Skills</h2>
                    <div className="resume-preview-tags">
                        {skills.map((skill, i) => (
                            <span key={i} className="resume-preview-tag">{skill}</span>
                        ))}
                    </div>
                </div>
            )}

            {experience && experience.length > 0 && (
                <div className="resume-preview-section">
                    <h2 className="resume-preview-section-title">Experience</h2>
                    {experience.map((entry, i) => (
                        <div key={i} className="resume-preview-entry">
                            <div className="resume-preview-entry-header">
                                <div>
                                    <div className="resume-preview-entry-title">{entry.role || 'Role'}</div>
                                    <div className="resume-preview-entry-subtitle">{entry.company || 'Company'}</div>
                                </div>
                                <div className="resume-preview-entry-date">
                                    {[entry.start_date, entry.end_date].filter(Boolean).join(' – ') || ''}
                                </div>
                            </div>
                            {entry.description && <p className="resume-preview-text">{entry.description}</p>}
                        </div>
                    ))}
                </div>
            )}

            {education && education.length > 0 && (
                <div className="resume-preview-section">
                    <h2 className="resume-preview-section-title">Education</h2>
                    {education.map((entry, i) => (
                        <div key={i} className="resume-preview-entry">
                            <div className="resume-preview-entry-header">
                                <div>
                                    <div className="resume-preview-entry-title">{entry.institution || 'IsDB-BISEW'}</div>
                                    <div className="resume-preview-entry-subtitle">
                                        {[entry.course, entry.round ? `Round ${entry.round}` : '', entry.batch ? `Batch ${entry.batch}` : ''].filter(Boolean).join(' | ')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {certifications && certifications.length > 0 && (
                <div className="resume-preview-section">
                    <h2 className="resume-preview-section-title">Certifications</h2>
                    {certifications.map((entry, i) => (
                        <div key={i} className="resume-preview-entry">
                            <div className="resume-preview-entry-header">
                                <div>
                                    <div className="resume-preview-entry-title">
                                        {entry.url ? (
                                            <a href={entry.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>{entry.name || 'Certification'}</a>
                                        ) : (entry.name || 'Certification')}
                                    </div>
                                    <div className="resume-preview-entry-subtitle">{entry.issuer || ''}</div>
                                </div>
                                {entry.date && <div className="resume-preview-entry-date">{entry.date}</div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {projects && projects.length > 0 && (
                <div className="resume-preview-section">
                    <h2 className="resume-preview-section-title">Projects</h2>
                    {projects.map((entry, i) => (
                        <div key={i} className="resume-preview-entry">
                            <div className="resume-preview-entry-header">
                                <div>
                                    <div className="resume-preview-entry-title">
                                        {entry.url ? (
                                            <a href={entry.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>{entry.name || 'Project'}</a>
                                        ) : (entry.name || 'Project')}
                                    </div>
                                </div>
                            </div>
                            {entry.description && <p className="resume-preview-text">{entry.description}</p>}
                            {entry.technologies && entry.technologies.length > 0 && (
                                <div className="resume-preview-tags" style={{ marginTop: '0.35rem' }}>
                                    {entry.technologies.map((tech, ti) => (
                                        <span key={ti} className="resume-preview-tag">{tech}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ResumeEditor({ data, onChange, onSave, saving }) {
    function handleFieldChange(field, value) {
        onChange({ ...data, [field]: value });
    }

    function handleLinksChange(field, value) {
        onChange({ ...data, [field]: value });
    }

    return (
        <div className="stack stack-md">
            <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                <SectionHeader title="Personal Info" />
                <div className="grid-2" style={{ gap: '0.75rem' }}>
                    <EditableField label="Full Name" name="name" value={data.name} onChange={handleFieldChange} placeholder="Your full name" />
                    <EditableField label="Email" name="email" type="email" value={data.email} onChange={handleFieldChange} placeholder="your@email.com" />
                    <EditableField label="Phone" name="phone" value={data.phone} onChange={handleFieldChange} placeholder="+880..." />
                    <EditableField label="Address" name="address" value={data.address} onChange={handleFieldChange} placeholder="Your address" />
                </div>
            </div>

            <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                <SectionHeader title="Professional Summary" />
                <EditableField label="Bio" name="bio" value={data.bio} onChange={handleFieldChange} multiline placeholder="Brief professional summary" />
            </div>

            <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                <SkillsEditor skills={data.skills || []} onChange={(skills) => onChange({ ...data, skills })} />
            </div>

            <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                <ExperienceEditor experience={data.experience || []} onChange={(experience) => onChange({ ...data, experience })} />
            </div>

            <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                <EducationEditor education={data.education || []} onChange={(education) => onChange({ ...data, education })} />
            </div>

            <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                <CertificationsEditor certifications={data.certifications || []} onChange={(certifications) => onChange({ ...data, certifications })} />
            </div>

            <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                <ProjectsEditor projects={data.projects || []} onChange={(projects) => onChange({ ...data, projects })} />
            </div>

            <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                <LinksEditor linkedin_url={data.linkedin_url} github_url={data.github_url} portfolio_url={data.portfolio_url} onChange={handleLinksChange} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Resume'}
                </button>
            </div>
        </div>
    );
}

export default function ResumePage({ user }) {
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [data, setData] = React.useState(null);
    const [originalData, setOriginalData] = React.useState(null);
    const [mode, setMode] = React.useState('preview');
    const toast = useToast();

    React.useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                const res = await window.axios.get(`${API_BASE}/resume`);
                if (mounted) {
                    setData(res.data);
                    setOriginalData(res.data);
                }
            } catch {
                if (mounted) toast.error('Failed to load resume data.');
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, []);

    async function handleSave() {
        setSaving(true);
        try {
            const userPayload = {
                name: data.name,
                email: data.email,
                phone: data.phone || null,
                address: data.address || null,
                bio: data.bio || null,
                round: data.round || null,
                batch: data.batch || null,
                course: data.course || null,
            };
            await window.axios.put(`${API_BASE}/me`, userPayload);

            const profilePayload = {
                linkedin_url: data.linkedin_url || null,
                github_url: data.github_url || null,
                portfolio_url: data.portfolio_url || null,
                skills: (data.skills || []).length > 0 ? data.skills : null,
                experience: (data.experience || []).length > 0 ? data.experience : null,
                certifications: (data.certifications || []).length > 0 ? data.certifications : null,
                projects: (data.projects || []).length > 0 ? data.projects : null,
            };
            await window.axios.put(`${API_BASE}/profile`, profilePayload);

            toast.success('Resume saved successfully');
            setOriginalData({ ...data });
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to save resume.');
        } finally {
            setSaving(false);
        }
    }

    function handlePrint() {
        window.print();
    }

    if (loading) {
        return (
            <div className="resume-page">
                <div className="page-header">
                    <h1>Resume Builder</h1>
                </div>
                <Spinner />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="resume-page">
                <div className="page-header">
                    <h1>Resume Builder</h1>
                </div>
                <p className="text-muted">Could not load resume data. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="resume-page">
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Resume Builder</h1>
                        <p>Build and preview your professional resume</p>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" className={`btn ${mode === 'preview' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('preview')}>
                            Preview
                        </button>
                        <button type="button" className={`btn ${mode === 'edit' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('edit')}>
                            Edit
                        </button>
                        {mode === 'preview' && (
                            <button type="button" className="btn btn-secondary" onClick={handlePrint}>
                                Print
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {mode === 'edit' ? (
                <ResumeEditor data={data} onChange={setData} onSave={handleSave} saving={saving} />
            ) : (
                <ResumePreview data={data} />
            )}
        </div>
    );
}
