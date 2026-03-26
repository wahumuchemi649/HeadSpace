// SuperAdminDashboard.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api_Base } from './Api';
import './superadmin.css';
import { Link } from 'react-router-dom';
import { MdHome, MdSettings, MdDashboard, MdMonitorHeart, MdSearch, MdLogout, MdPeople,MdCalculate} from 'react-icons/md';
import { MdMonetizationOn} from 'react-icons/md';
// SuperAdminDashboard.jsx - Update OrganizationsSection

function OrganizationsSection() {
    const [organizations, setOrganizations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${Api_Base}/super-admin/organizations/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('🏢 Organizations:', data);  // Debug log
            setOrganizations(data);
        } catch (error) {
            console.error('Error fetching organizations:', error);
            setOrganizations([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredOrgs = organizations.filter(org => {
        const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || org.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="dashboard-content">
            <div className="content-header-with-action">
                <div>
                    <h1>Organizations</h1>
                    <p className="content-subtitle">{organizations.length} total organizations</p>
                </div>
                <button className="add-org-btn" onClick={() => setShowAddModal(true)}>
                    <MdHome size={24} color='#555' />
                    Add New Org
                </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="search-filter-bar">
                <div className="search-box">
                    <MdSearch size={24} color='#555' />
                    <input 
                        type="text"
                        placeholder="Search organizations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select 
                    className="filter-dropdown"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="all">All Types</option>
                    <option value="university">University</option>
                    <option value="company">Company</option>
                    <option value="ngo_free">NGO (Free)</option>
                    <option value="ngo_subsidized">NGO (Subsidized)</option>
                    <option value="government">Government</option>
                </select>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="loading-state">
                    <p>Loading organizations...</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredOrgs.length === 0 && (
                <div className="empty-state">
                    <MdHome size={64} color='#D1D5DB' />
                    <p>No organizations found</p>
                    <button className="add-org-btn" onClick={() => setShowAddModal(true)}>
                        Add Your First Organization
                    </button>
                </div>
            )}

            {/* Organizations List */}
            {!isLoading && filteredOrgs.length > 0 && (
                <div className="organizations-list">
                    {filteredOrgs.map(org => (
                        <OrganizationCard key={org.id} organization={org} onUpdate={fetchOrganizations} />
                    ))}
                </div>
            )}

            {/* Add Organization Modal */}
            {showAddModal && (
                <AddOrganizationModal 
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchOrganizations();
                    }}
                />
            )}
        </div>
    );
}

function OrganizationCard({ organization, onUpdate }) {
    const [showMenu, setShowMenu] = useState(false);

    const handleView = () => {
        // Navigate to org details
        console.log('View org:', organization.id);
    };

    const handleEdit = () => {
        // Open edit modal
        console.log('Edit org:', organization.id);
    };

    const handleDeactivate = async () => {
        if (!confirm(`Deactivate ${organization.name}?`)) return;
        
        try {
            const token = localStorage.getItem('access_token');
            await fetch(`${Api_Base}/super-admin/organizations/${organization.id}/deactivate/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onUpdate();
        } catch (error) {
            console.error('Error deactivating org:', error);
        }
    };

    return (
        <div className="org-card">
            <div className="org-card-header">
                <div>
                    <h3 className="org-name">{organization.name}</h3>
                    <div className="org-meta">
                        <span className="org-type">Type: {organization.type_display}</span>
                        <span className="org-status-inline">
                            Status: <span className={`status-badge ${organization.is_active ? 'active' : 'inactive'}`}>
                                {organization.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </span>
                    </div>
                </div>
                <span className={`status-badge-large ${organization.is_active ? 'active' : 'inactive'}`}>
                    {organization.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>

            <div className="org-details-grid">
                <div className="org-detail-item">
                    <span className="detail-label">Code</span>
                    <span className="detail-value code">{organization.organization_code}</span>
                </div>
                <div className="org-detail-item">
                    <span className="detail-label">Members</span>
                    <span className="detail-value">{organization.member_count?.toLocaleString()}</span>
                </div>
                <div className="org-detail-item">
                    <span className="detail-label">Therapists</span>
                    <span className="detail-value">{organization.therapist_count}</span>
                </div>
                <div className="org-detail-item">
                    <span className="detail-label">Created</span>
                    <span className="detail-value">{organization.created_date}</span>
                </div>
            </div>

            <div className="org-subscription">
                <span className="subscription-badge">
                    {organization.pricing_model === 'free' ? 'Free Partner' : `Premium (KES ${organization.monthly_fee?.toLocaleString()}/month)`}
                </span>
            </div>

            <div className="org-actions">
                <button className="action-btn view" onClick={handleView}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    View
                </button>
                <button className="action-btn edit" onClick={handleEdit}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                </button>
                <button className="action-btn deactivate" onClick={handleDeactivate}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    Deactivate
                </button>
            </div>
        </div>
    );
}

function AddOrganizationModal({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        type: 'university',
        admin_email: '',
        admin_name: '',
        contact_phone: '',
        pricing_model: 'subscription',
        monthly_fee: 50000,
        max_members: 500
    });
    const [autoCode, setAutoCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Generate code when org name changes
    useEffect(() => {
        if (formData.name) {
            const words = formData.name.toUpperCase().split(' ');
            const initials = words.map(w => w[0]).join('').slice(0, 4);
            const year = new Date().getFullYear();
            setAutoCode(`${initials}${year}`);
        }
    }, [formData.name]);

// SuperAdminDashboard.jsx - Update handleSubmit in AddOrganizationModal

const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${Api_Base}/super-admin/organizations/create/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...formData,
                contact_email: formData.admin_email,  // Add this
                organization_code: autoCode
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert(
                `✅ Organization created successfully!\n\n` +
                `📧 A welcome email has been sent to ${formData.admin_email} with:\n` +
                `   • Login credentials\n` +
                `   • Organization code: ${data.organization_code}\n` +
                `   • Instructions to change password\n\n` +
                `Temporary Password: ${data.temp_password}\n` +
                `(Also included in the email)`
            );
            onSuccess();
        } else {
            alert(`Error: ${data.error || 'Failed to create organization'}`);
        }
    } catch (error) {
        console.error('Error creating org:', error);
        alert('Network error. Please try again.');
    } finally {
        setIsSubmitting(false);
    }
};

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create New Organization</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="org-form">
                    <div className="form-group">
                        <label>Organization Name</label>
                        <input 
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="e.g., University of Nairobi"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Organization Type</label>
                        <select 
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                        >
                            <option value="university">University</option>
                            <option value="company">Company</option>
                            <option value="ngo_free">NGO (Free Services)</option>
                            <option value="ngo_subsidized">NGO (Subsidized)</option>
                            <option value="government">Government Agency</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Auto-Generated Code</label>
                        <div className="code-display">
                            <input 
                                type="text"
                                value={autoCode}
                                onChange={(e) => setAutoCode(e.target.value.toUpperCase())}
                            />
                            <small>Click to customize</small>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Admin Email</label>
                            <input 
                                type="email"
                                value={formData.admin_email}
                                onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                                placeholder="admin@organization.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Admin Name</label>
                            <input 
                                type="text"
                                value={formData.admin_name}
                                onChange={(e) => setFormData({...formData, admin_name: e.target.value})}
                                placeholder="Dr. John Doe"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Contact Phone</label>
                        <input 
                            type="tel"
                            value={formData.contact_phone}
                            onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                            placeholder="+254 712 345 678"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Subscription Plan</label>
                            <select 
                                value={formData.pricing_model}
                                onChange={(e) => setFormData({...formData, pricing_model: e.target.value})}
                            >
                                <option value="free">Free (NGO Partner)</option>
                                <option value="subscription">Premium</option>
                            </select>
                        </div>

                        {formData.pricing_model === 'subscription' && (
                            <div className="form-group">
                                <label>Monthly Fee (KES)</label>
                                <input 
                                    type="number"
                                    value={formData.monthly_fee}
                                    onChange={(e) => setFormData({...formData, monthly_fee: parseInt(e.target.value)})}
                                    min="0"
                                    step="1000"
                                />
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Max Members</label>
                        <input 
                            type="number"
                            value={formData.max_members}
                            onChange={(e) => setFormData({...formData, max_members: parseInt(e.target.value)})}
                            min="10"
                            step="10"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Organization'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function SuperAdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        organizations: 0,
        therapists: 0,
        patients: 0,
        sessions: 0,
        revenue: 0,
        active: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [activeSection, setActiveSection] = useState('dashboard');

    useEffect(() => {
        fetchDashboardStats();
        fetchRecentActivity();
    }, []);

    // SuperAdminDashboard.jsx - Update fetchDashboardStats

const fetchDashboardStats = async () => {
    try {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
            console.error('No access token');
            navigate('/super-admin/login');
            return;
        }
        
        const response = await fetch(`${Api_Base}/super-admin/dashboard-stats/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.error('Unauthorized - redirecting to login');
                localStorage.clear();
                navigate('/super-admin/login');
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Dashboard Stats:', data);  // Debug log
        setStats(data);
    } catch (error) {
        console.error('Error fetching stats:', error);
        // Set default values on error
        setStats({
            organizations: 0,
            therapists: 0,
            patients: 0,
            sessions: 0,
            revenue: 0,
            active: 0
        });
    }
};

const fetchRecentActivity = async () => {
    try {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
            console.error('No access token');
            return;
        }
        
        const response = await fetch(`${Api_Base}/super-admin/recent-activity/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📋 Recent Activity:', data);  // Debug log
        setRecentActivity(data);
    } catch (error) {
        console.error('Error fetching activity:', error);
        setRecentActivity([]);
    }
};

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        navigate('/super-admin/login');
    };

    return (
        <div className="super-admin-container">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <MdMonitorHeart size={24} color='#3122bd' />
                        </div>
                        <div>
                            <h2>HeadSpace</h2>
                            <p className="sidebar-subtitle">Super Admin</p>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <button 
                        className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveSection('dashboard')}
                    >
                        <MdDashboard size={24} color='#555' />
                        Dashboard Overview
                    </button>

                    <button 
                        className={`nav-item ${activeSection === 'organizations' ? 'active' : ''}`}
                        onClick={() => setActiveSection('organizations')}
                    >
                       <MdHome size={24} color='#555' />
                        Organizations
                    </button>
                     <button 
                        className={`nav-item ${activeSection === 'therapists' ? 'active' : ''}`}
                        onClick={() => setActiveSection('therapists')}
                    >
                        <MdPeople size={24} color='#555' />
                        Independent Therapists
                    </button>
                    <Link to='/PlatformAnalytics' className={`nav-item ${activeSection === 'analytics' ? 'active' : ''}`}>
                        <MdDashboard size={24} color='#555' />
                        Platform Analytics
                    </Link>

                    <button 
                        className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveSection('settings')}
                    >
                        <MdSettings size={24} color='#555' />
                        System Settings
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                {/* Top Header */}
                <header className="admin-header">
                    <div className="header-left">
                        <div className="system-status">
                            <span className="status-dot"></span>
                            System Active
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="admin-profile">
                            <img src="/admin-avatar.png" alt="Admin" className="admin-avatar" />
                            <div>
                                <p className="admin-name">Admin User</p>
                                <p className="admin-role">Superadmin</p>
                            </div>
                        </div>
                        <button className="logout-btn" onClick={handleLogout}>
                            <MdLogout size={24} color='#555' />
                        </button>
                    </div>
                </header>

                {/* Dashboard Content */}
                {activeSection === 'dashboard' && (
                    <div className="dashboard-content">
                        <div className="content-header">
                            <h1>Platform Statistics</h1>
                            <p className="content-subtitle">Real-time overview of the HeadSpace platform</p>
                        </div>

                        {/* Platform Stats Cards */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon blue">
                                    <MdHome size={24} color='#555' />
                                </div>
                                <p className="stat-label">Organizations</p>
                                <h2 className="stat-value">{stats.organizations}</h2>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon purple">
                                    <MdPeople size={24} color='#555' />
                                </div>
                                <p className="stat-label">Therapists</p>
                                <h2 className="stat-value">{stats.therapists}</h2>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon pink">
                                    <MdPeople size={24} color='#555' />
                                </div>
                                <p className="stat-label">Patients</p>
                                <h2 className="stat-value">{stats.patients.toLocaleString()}</h2>
                            </div>
                        </div>

                        {/* This Month Stats */}
                        <h3 className="section-title">This Month</h3>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon green">
                                   <MdDashboard size={24} color='#555' />
                                </div>
                                <p className="stat-label">Sessions</p>
                                <h2 className="stat-value">{stats.sessions}</h2>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon teal">
                                    <MdMonetizationOn size={24} color='gold' />
                                </div>
                                <p className="stat-label">Revenue</p>
                                <h2 className="stat-value">KES {(stats.revenue / 1000000).toFixed(1)}M</h2>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon cyan">
                                    <MdCalculate size={24} color='#555' />
                                </div>
                                <p className="stat-label">Active</p>
                                <h2 className="stat-value">{stats.active}%</h2>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="recent-activity">
                            <h3 className="activity-title">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                                </svg>
                                Recent Activity
                            </h3>
                            <div className="activity-list">
                                {recentActivity.map((activity, index) => (
                                    <div key={index} className="activity-item">
                                        <span className="activity-dot"></span>
                                        <div>
                                            <p className="activity-text">{activity.text}</p>
                                            <span className="activity-time">{activity.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Organizations Section */}
                {activeSection === 'organizations' && (
                    <OrganizationsSection />
                )}
                 {/* NEW: Therapists Section */}
                {activeSection === 'therapists' && (
                    <SuperAdminTherapistsSection />
                )}
            </main>
        </div>
    );
}
function SuperAdminTherapistsSection() {
    const [therapists, setTherapists] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTherapists();
    }, []);

    const fetchTherapists = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${Api_Base}/super-admin/therapists/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('🩺 Independent Therapists:', data);
            setTherapists(data.therapists || []);
        } catch (error) {
            console.error('Error fetching therapists:', error);
            setTherapists([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTherapists = therapists.filter(therapist => {
        const matchesSearch = 
            therapist.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            therapist.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            therapist.email.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = 
            filterStatus === 'all' || 
            (filterStatus === 'active' && therapist.is_active) ||
            (filterStatus === 'inactive' && !therapist.is_active);
        
        return matchesSearch && matchesStatus;
    });

    const handleDeactivate = async (therapistId) => {
        if (!confirm('Deactivate this therapist?')) return;
        
        try {
            const token = localStorage.getItem('access_token');
            await fetch(`${Api_Base}/super-admin/therapists/${therapistId}/deactivate/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchTherapists();
        } catch (error) {
            console.error('Error deactivating therapist:', error);
        }
    };

    const handleActivate = async (therapistId) => {
        try {
            const token = localStorage.getItem('access_token');
            await fetch(`${Api_Base}/super-admin/therapists/${therapistId}/activate/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchTherapists();
        } catch (error) {
            console.error('Error activating therapist:', error);
        }
    };

    return (
        <div className="dashboard-content">
            <div className="content-header-with-action">
                <div>
                    <h1>Independent Therapists</h1>
                    <p className="content-subtitle">
                        {therapists.length} independent therapists (not affiliated with any organization)
                    </p>
                </div>
                <button className="add-org-btn" onClick={() => setShowAddModal(true)}>
                    <MdPeople size={24} color='#555' />
                    Add Independent Therapist
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{marginBottom: '30px'}}>
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <MdPeople size={24} color='#555' />
                    </div>
                    <p className="stat-label">Total Independent</p>
                    <h2 className="stat-value">{therapists.length}</h2>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <MdPeople size={24} color='#555' />
                    </div>
                    <p className="stat-label">Active</p>
                    <h2 className="stat-value">{therapists.filter(t => t.is_active).length}</h2>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red">
                        <MdPeople size={24} color='#555' />
                    </div>
                    <p className="stat-label">Inactive</p>
                    <h2 className="stat-value">{therapists.filter(t => !t.is_active).length}</h2>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="search-filter-bar">
                <div className="search-box">
                    <MdSearch size={24} color='#555' />
                    <input 
                        type="text"
                        placeholder="Search therapists..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select 
                    className="filter-dropdown"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="loading-state">
                    <p>Loading therapists...</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredTherapists.length === 0 && (
                <div className="empty-state">
                    <MdPeople size={64} color='#D1D5DB' />
                    <p>No independent therapists found</p>
                    <button className="add-org-btn" onClick={() => setShowAddModal(true)}>
                        Add Your First Independent Therapist
                    </button>
                </div>
            )}

            {/* Therapists List */}
            {!isLoading && filteredTherapists.length > 0 && (
                <div className="organizations-list">
                    {filteredTherapists.map(therapist => (
                        <IndependentTherapistCard 
                            key={therapist.id} 
                            therapist={therapist}
                            onActivate={handleActivate}
                            onDeactivate={handleDeactivate}
                        />
                    ))}
                </div>
            )}

            {/* Add Therapist Modal */}
            {showAddModal && (
                <AddIndependentTherapistModal 
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchTherapists();
                    }}
                />
            )}
        </div>
    );
}

// Therapist Card Component
function IndependentTherapistCard({ therapist, onActivate, onDeactivate }) {
    return (
        <div className="org-card">
            <div className="org-card-header">
                <div>
                    <h3 className="org-name">Dr. {therapist.firstName} {therapist.lastName}</h3>
                    <div className="org-meta">
                        <span className="org-type">Email: {therapist.email}</span>
                        <span className="org-type">Phone: {therapist.phoneNumber}</span>
                    </div>
                </div>
                <span className={`status-badge-large ${therapist.is_active ? 'active' : 'inactive'}`}>
                    {therapist.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>

            <div className="org-details-grid">
                <div className="org-detail-item">
                    <span className="detail-label">Primary Specialty</span>
                    <span className="detail-value">{therapist.specialty_1 || 'General'}</span>
                </div>
                <div className="org-detail-item">
                    <span className="detail-label">Secondary</span>
                    <span className="detail-value">{therapist.specialty_2 || '—'}</span>
                </div>
                <div className="org-detail-item">
                    <span className="detail-label">Sessions</span>
                    <span className="detail-value">{therapist.sessions_count || 0}</span>
                </div>
                <div className="org-detail-item">
                    <span className="detail-label">Joined</span>
                    <span className="detail-value">{therapist.joined_date || 'N/A'}</span>
                </div>
            </div>

            <div className="org-actions">
                <button className="action-btn view">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    View
                </button>
                <button className="action-btn edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                </button>
                {therapist.is_active ? (
                    <button className="action-btn deactivate" onClick={() => onDeactivate(therapist.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                        Deactivate
                    </button>
                ) : (
                    <button className="action-btn activate" onClick={() => onActivate(therapist.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        Activate
                    </button>
                )}
            </div>
        </div>
    );
}

// Add Independent Therapist Modal
function AddIndependentTherapistModal({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        specialty_1: '',
        specialty_2: '',
        specialty_3: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${Api_Base}/super-admin/therapists/add/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                alert(
                    `✅ Independent therapist added successfully!\n\n` +
                    `📧 A welcome email has been sent to ${formData.email}\n\n` +
                    `LOGIN INFORMATION:\n` +
                    `• They login using their phone number: ${formData.phoneNumber}\n` +
                    `• No password needed - they receive an OTP via SMS\n` +
                    `• Email contains complete instructions`
                );
                onSuccess();
            } else {
                setError(data.error || 'Failed to add therapist');
            }
        } catch (error) {
            console.error('Error adding therapist:', error);
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Independent Therapist</h2>
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

                <div className="info-box" style={{marginBottom: '20px', padding: '15px', background: '#EFF6FF', borderRadius: '8px'}}>
                    <p style={{margin: 0, color: '#1E40AF'}}>
                        <strong>ℹ️ Independent Therapist:</strong> This therapist will not be affiliated with any organization and can accept patients directly through the platform.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="org-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name *</label>
                            <input 
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                placeholder="e.g., Mary"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name *</label>
                            <input 
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                placeholder="e.g., Wanjiru"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Email *</label>
                            <input 
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                placeholder="therapist@email.com"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone Number * (Used for login)</label>
                            <input 
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                                placeholder="+254 712 345 678"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Primary Specialty *</label>
                        <select 
                            value={formData.specialty_1}
                            onChange={(e) => setFormData({...formData, specialty_1: e.target.value})}
                            required
                        >
                            <option value="">Select specialty...</option>
                            <option value="Anxiety & Stress">Anxiety & Stress</option>
                            <option value="Depression">Depression</option>
                            <option value="Trauma & PTSD">Trauma & PTSD</option>
                            <option value="Relationship Counseling">Relationship Counseling</option>
                            <option value="Family Therapy">Family Therapy</option>
                            <option value="Grief & Loss">Grief & Loss</option>
                            <option value="Addiction">Addiction</option>
                            <option value="Eating Disorders">Eating Disorders</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Secondary Specialty (Optional)</label>
                            <select 
                                value={formData.specialty_2}
                                onChange={(e) => setFormData({...formData, specialty_2: e.target.value})}
                            >
                                <option value="">Select specialty...</option>
                                <option value="CBT">Cognitive Behavioral Therapy</option>
                                <option value="DBT">Dialectical Behavior Therapy</option>
                                <option value="Mindfulness">Mindfulness</option>
                                <option value="Art Therapy">Art Therapy</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Third Specialty (Optional)</label>
                            <select 
                                value={formData.specialty_3}
                                onChange={(e) => setFormData({...formData, specialty_3: e.target.value})}
                            >
                                <option value="">Select specialty...</option>
                                <option value="Group Therapy">Group Therapy</option>
                                <option value="Child Psychology">Child Psychology</option>
                                <option value="Couples Therapy">Couples Therapy</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add Therapist'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SuperAdminDashboard;