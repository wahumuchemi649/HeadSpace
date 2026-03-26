// OrgAdminDashboard.jsx - UPDATED VERSION

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api_Base } from './Api';
import { Link } from 'react-router-dom';
import './orgDashboard.css';
import { MdPeople, MdSettings } from 'react-icons/md';

function OrgAdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        therapists: 0,
        members: 0,
        sessions: 0,
        new_members: 0,
        completed_sessions: 0,
        avg_rating: 0
    });
    const [orgInfo, setOrgInfo] = useState({
        name: '',
        code: '',
        type: ''
    });
    const [activeSection, setActiveSection] = useState('dashboard');
    const [showChangeCodeModal, setShowChangeCodeModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if logged in
        const token = localStorage.getItem('access_token');
        const userType = localStorage.getItem('user_type');
        
        if (!token || userType !== 'org_admin') {
            console.log('Not authenticated as org admin');
            navigate('/org-admin/login');
            return;
        }

        fetchDashboardData();
    }, [navigate]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                navigate('/org-admin/login');
                return;
            }

            const response = await fetch(`${Api_Base}/org-admin/dashboard/`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    console.error('Unauthorized - clearing session');
                    localStorage.clear();
                    navigate('/org-admin/login');
                    return;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 Dashboard data:', data);  // Debug log
            
            setStats(data.stats);
            setOrgInfo(data.organization);
            
            // Store org info in localStorage for use in other pages
            localStorage.setItem('org_name', data.organization.name);
            localStorage.setItem('org_id', data.organization.id);
            localStorage.setItem('org_code', data.organization.code);
            
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            setError('Failed to load dashboard data');
            
            // Set empty data on error
            setStats({
                therapists: 0,
                members: 0,
                sessions: 0,
                new_members: 0,
                completed_sessions: 0,
                avg_rating: 0
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_type');
        localStorage.removeItem('org_name');
        localStorage.removeItem('org_id');
        localStorage.removeItem('org_code');
        navigate('/org-admin/login');
    };

    const handleCopyCode = () => {
        if (orgInfo.code) {
            navigator.clipboard.writeText(orgInfo.code);
            alert('✅ Organization code copied to clipboard!');
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="org-admin-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="org-admin-container">
                <div className="error-container">
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{width: '64px', height: '64px', color: '#EF4444'}}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <h2>{error}</h2>
                    <button onClick={fetchDashboardData} className="retry-btn">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="org-admin-container">
            {/* Sidebar */}
            <aside className="org-sidebar">
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                        </div>
                        <div>
                            <h2>{orgInfo.name || 'Loading...'}</h2>
                            <p className="sidebar-subtitle">Admin Portal</p>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <button 
                        className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveSection('dashboard')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"/>
                        </svg>
                        Dashboard
                    </button>
                    
                    <Link to='/OrgManageTherapists' className="nav-item">
                        <MdPeople size={24} color='#555' />
                        Therapists
                    </Link>
                    
                    <Link to='/OrgViewMembers' className="nav-item">
                        <MdPeople size={24} color='#555' />
                        Members
                    </Link>
                    
                    <Link to='/OrgSettings' className="nav-item">
                        <MdSettings size={24} color='#555' />
                        Settings
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="org-main">
                {/* Top Header */}
                <header className="org-header">
                    <div className="header-left">
                        <h1>Dashboard Overview</h1>
                    </div>
                    <div className="header-right">
                        <div className="admin-profile">
                            <div>
                                <p className="admin-name">Organization Admin</p>
                                <p className="admin-role">{orgInfo.type || 'Admin'}</p>
                            </div>
                        </div>
                        <button className="logout-btn" onClick={handleLogout}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                <polyline points="16 17 21 12 16 7"/>
                                <line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Dashboard Content */}
                {activeSection === 'dashboard' && (
                    <div className="dashboard-content">
                        {/* Stats Grid */}
                        <div className="stats-grid">
                            <div className="stat-card blue">
                                <div className="stat-icon">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="stat-label">Therapists</p>
                                    <h2 className="stat-value">{stats.therapists}</h2>
                                </div>
                            </div>

                            <div className="stat-card purple">
                                <div className="stat-icon">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="stat-label">Members</p>
                                    <h2 className="stat-value">{stats.members}</h2>
                                </div>
                            </div>

                            <div className="stat-card green">
                                <div className="stat-icon">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                        <line x1="8" y1="2" x2="8" y2="6"/>
                                        <line x1="3" y1="10" x2="21" y2="10"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="stat-label">Sessions</p>
                                    <h2 className="stat-value">{stats.sessions}</h2>
                                </div>
                            </div>
                        </div>

                        {/* Organization Code Card */}
                        <div className="code-card">
                            <div className="code-header">
                                <h3>🔑 Organization Code</h3>
                                <button className="change-code-btn" onClick={() => setShowChangeCodeModal(true)}>
                                    Change Code
                                </button>
                            </div>
                            <div className="code-display">
                                <div className="code-value">{orgInfo.code || 'Loading...'}</div>
                                <button className="copy-btn" onClick={handleCopyCode} disabled={!orgInfo.code}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                    </svg>
                                    Copy
                                </button>
                            </div>
                            <p className="code-help">💡 Share this code with your members to give them access to HeadSpace</p>
                        </div>

                        {/* Recent Activity */}
                        <div className="activity-card">
                            <h3>📈 This Month</h3>
                            <div className="activity-list">
                                <div className="activity-item">
                                    <span className="activity-dot green"></span>
                                    <p><strong>{stats.new_members}</strong> new members joined</p>
                                </div>
                                <div className="activity-item">
                                    <span className="activity-dot blue"></span>
                                    <p><strong>{stats.completed_sessions}</strong> sessions completed</p>
                                </div>
                                <div className="activity-item">
                                    <span className="activity-dot purple"></span>
                                    <p>Average therapist rating: <strong>{stats.avg_rating > 0 ? `${stats.avg_rating}/5.0` : 'Not available'}</strong></p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Change Code Modal */}
            {showChangeCodeModal && (
                <ChangeCodeModal 
                    currentCode={orgInfo.code}
                    onClose={() => setShowChangeCodeModal(false)}
                    onSuccess={(newCode) => {
                        setOrgInfo({...orgInfo, code: newCode});
                        localStorage.setItem('org_code', newCode);
                        setShowChangeCodeModal(false);
                    }}
                />
            )}
        </div>
    );
}




function ChangeCodeModal({ currentCode, onClose, onSuccess }) {
    const [newCode, setNewCode] = useState(currentCode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${Api_Base}/org-admin/update-code/`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: newCode.toUpperCase() })
            });

            const data = await response.json();

            if (response.ok) {
                alert('✅ Organization code updated successfully!');
                onSuccess(newCode.toUpperCase());
            } else {
                setError(data.error || 'Failed to update code');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Change Organization Code</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {error && (
                        <div className="error-banner">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label>Current Code</label>
                        <input type="text" value={currentCode} disabled />
                    </div>

                    <div className="form-group">
                        <label>New Code</label>
                        <input 
                            type="text"
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                            placeholder="e.g., UON2024"
                            maxLength={20}
                            required
                        />
                        <small>Code must be 4-20 characters (letters, numbers, hyphens only)</small>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Updating...' : 'Update Code'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default OrgAdminDashboard;