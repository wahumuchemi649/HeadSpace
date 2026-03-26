// OrgViewMembers.jsx - REAL DATA VERSION

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api_Base } from './Api';
import './orgMembers.css';

function OrgViewMembers() {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                navigate('/org-admin/login');
                return;
            }

            const response = await fetch(`${Api_Base}/org-admin/members/`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.clear();
                    navigate('/org-admin/login');
                    return;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('👥 Members data:', data);
            setMembers(data.members || []);
        } catch (error) {
            console.error('Error fetching members:', error);
            setError('Failed to load members');
            setMembers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredMembers = members.filter(member => {
        const matchesSearch = 
            member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = 
            filterStatus === 'all' || 
            member.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    // Calculate stats from real data
    const activeMembers = members.filter(m => m.status === 'active').length;
    const membersWithSessions = members.filter(m => m.sessions_count > 0).length;
    const totalSessions = members.reduce((sum, m) => sum + (m.sessions_count || 0), 0);

    const handleExportCSV = () => {
        // Create CSV content
        const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Joined Date', 'Status', 'Sessions'];
        const rows = members.map(m => [
            m.firstName,
            m.lastName,
            m.email,
            m.phone,
            m.joined_date,
            m.status,
            m.sessions_count
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `members_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className="view-members-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading members...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="view-members-container">
            <div className="page-header">
                <div>
                    <h1>Members</h1>
                    <p className="page-subtitle">View and manage your organization's members</p>
                </div>
                <div className="header-actions">
                    <button className="secondary-btn" onClick={() => setShowBulkImport(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        Bulk Import
                    </button>
                    <button className="export-btn" onClick={handleExportCSV}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Export CSV
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-banner">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    {error}
                    <button onClick={fetchMembers}>Retry</button>
                </div>
            )}

            {/* Stats Overview - Real Data */}
            <div className="members-stats">
                <div className="stat-box">
                    <div className="stat-icon blue">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                        </svg>
                    </div>
                    <div>
                        <p className="stat-label">Total Members</p>
                        <p className="stat-number">{members.length}</p>
                    </div>
                </div>

                <div className="stat-box">
                    <div className="stat-icon green">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                    </div>
                    <div>
                        <p className="stat-label">Active Members</p>
                        <p className="stat-number">{activeMembers}</p>
                    </div>
                </div>

                <div className="stat-box">
                    <div className="stat-icon purple">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                    </div>
                    <div>
                        <p className="stat-label">With Sessions</p>
                        <p className="stat-number">{membersWithSessions}</p>
                    </div>
                </div>

                <div className="stat-box">
                    <div className="stat-icon orange">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                    </div>
                    <div>
                        <p className="stat-label">Total Sessions</p>
                        <p className="stat-number">{totalSessions}</p>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="search-filter-bar">
                <div className="search-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input 
                        type="text"
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select 
                    className="filter-dropdown"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="all">All Members</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {/* Members Table */}
            {filteredMembers.length > 0 ? (
                <div className="members-table-container">
                    <table className="members-table">
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Contact</th>
                                <th>Joined Date</th>
                                <th>Status</th>
                                <th>Sessions</th>
                                <th>Last Session</th>
                                <th>Therapist</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map(member => (
                                <tr key={member.id}>
                                    <td>
                                        <div className="member-cell">
                                            <div className="member-avatar">
                                                {member.firstName[0]}{member.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="member-name">{member.firstName} {member.lastName}</p>
                                                <p className="member-email">{member.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{member.phone || '—'}</td>
                                    <td>
                                        {member.joined_date ? 
                                            new Date(member.joined_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                            : '—'
                                        }
                                    </td>
                                    <td>
                                        <span className={`status-pill ${member.status}`}>
                                            {member.status === 'active' ? '● Active' : '○ Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="session-count">{member.sessions_count || 0}</span>
                                    </td>
                                    <td>
                                        {member.last_session ? 
                                            new Date(member.last_session).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                                            : <span className="no-data">—</span>
                                        }
                                    </td>
                                    <td>
                                        {member.therapist ? 
                                            <span className="therapist-name">{member.therapist}</span>
                                            : <span className="no-data">Not assigned</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <p>{searchQuery || filterStatus !== 'all' ? 'No members found' : 'No members yet'}</p>
                    {members.length === 0 && (
                        <button className="secondary-btn" onClick={() => setShowBulkImport(true)}>
                            Import Your First Members
                        </button>
                    )}
                </div>
            )}

            {/* Bulk Import Modal */}
            {showBulkImport && (
                <BulkImportModal 
                    onClose={() => setShowBulkImport(false)}
                    onSuccess={() => {
                        setShowBulkImport(false);
                        fetchMembers();
                    }}
                />
            )}
        </div>
    );
}

function BulkImportModal({ onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
        setResult(null);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        setError('');
        setResult(null);

        try {
            const token = localStorage.getItem('access_token');
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${Api_Base}/org-admin/members/bulk-import/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Don't set Content-Type - let browser set it with boundary for FormData
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data);
                alert(`✅ Successfully imported ${data.imported} members!${data.errors.length > 0 ? `\n\n⚠️ ${data.errors.length} errors occurred. Check console for details.` : ''}`);
                
                if (data.errors.length > 0) {
                    console.log('Import errors:', data.errors);
                }
                
                // Close modal after short delay
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setError(data.error || 'Failed to import members');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            setError('Network error. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const downloadTemplate = () => {
        const template = 'First Name,Last Name,Email,Phone\nJohn,Doe,john.doe@example.com,+254712345678\nJane,Smith,jane.smith@example.com,+254723456789';
        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'members_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Bulk Import Members</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="error-banner">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        {error}
                    </div>
                )}

                {result && (
                    <div className="success-banner">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <div>
                            <p><strong>Import Complete!</strong></p>
                            <p>{result.imported} members imported successfully</p>
                            {result.errors.length > 0 && (
                                <p className="error-text">{result.errors.length} errors occurred</p>
                            )}
                        </div>
                    </div>
                )}

                <form onSubmit={handleUpload} className="modal-form">
                    <div className="info-box">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 16v-4"/>
                            <path d="M12 8h.01"/>
                        </svg>
                        <div>
                            <p><strong>CSV Format Required</strong></p>
                            <p>Your CSV should have columns: First Name, Last Name, Email, Phone</p>
                            <button type="button" className="link-btn" onClick={downloadTemplate}>
                                Download template CSV
                            </button>
                        </div>
                    </div>

                    <div className="upload-area">
                        <input 
                            type="file"
                            id="csv-upload"
                            accept=".csv"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="csv-upload" className="upload-label">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/>
                                <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            <p>{file ? file.name : 'Click to upload CSV file'}</p>
                            <span>or drag and drop</span>
                        </label>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={!file || isUploading}>
                            {isUploading ? 'Uploading...' : 'Import Members'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default OrgViewMembers;