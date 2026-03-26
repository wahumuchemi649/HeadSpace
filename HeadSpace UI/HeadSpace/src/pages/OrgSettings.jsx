// OrgSettings.jsx - COMPLETE VERSION WITH PUBLIC BOOKING

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api_Base } from './Api';
import './OrgSettings.css';
import { FaEye,FaEyeSlash} from 'react-icons/fa';

function OrgSettings() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('organization');
    const [orgData, setOrgData] = useState({
        name: '',
        code: '',
        type: '',
        contact_email: '',
        contact_phone: '',
        max_members: 0,
        allow_self_registration: true,
        require_admin_approval: false,
        // Public booking settings
        accept_public_patients: false,
        public_session_rate: 4000
    });
    const [adminData, setAdminData] = useState({
        full_name: '',
        email: '',
        phone: ''
    });
    const [notifications, setNotifications] = useState({
        new_member: true,
        new_session: true,
        session_cancelled: true,
        weekly_report: false,
        monthly_report: true
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                navigate('/OrgAdminLogin');
                return;
            }

            // Fetch organization settings
            const response = await fetch(`${Api_Base}/org-admin/settings/`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.clear();
                    navigate('/OrgAdminLogin');
                    return;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('⚙️ Settings data:', data);
            
            // Set organization data
            setOrgData({
                name: data.organization.name,
                code: data.organization.code,
                type: data.organization.type,
                contact_email: data.organization.contact_email,
                contact_phone: data.organization.contact_phone,
                max_members: data.organization.max_members,
                allow_self_registration: data.organization.allow_self_registration,
                require_admin_approval: data.organization.require_admin_approval,
                accept_public_patients: data.organization.accept_public_patients || false,
                public_session_rate: data.organization.public_session_rate || 4000
            });

            // Set admin data from localStorage and API
            const userEmail = localStorage.getItem('user_email') || data.organization.contact_email;
            setAdminData({
                full_name: localStorage.getItem('admin_name') || 'Admin User',
                email: userEmail,
                phone: data.organization.contact_phone
            });

            // Fetch notification preferences
            await fetchNotificationPreferences();

        } catch (error) {
            console.error('Error fetching settings:', error);
            setError('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchNotificationPreferences = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${Api_Base}/org-admin/notifications/`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.preferences) {
                    setNotifications(data.preferences);
                }
            }
        } catch (error) {
            console.log('Using default notification preferences');
        }
    };

    const handleSaveOrganization = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccessMessage('');

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${Api_Base}/org-admin/settings/update/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contact_email: orgData.contact_email,
                    contact_phone: orgData.contact_phone,
                    allow_self_registration: orgData.allow_self_registration,
                    require_admin_approval: orgData.require_admin_approval,
                    accept_public_patients: orgData.accept_public_patients,
                    public_session_rate: orgData.public_session_rate
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage('✅ Organization settings updated successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
                
                // Update localStorage
                localStorage.setItem('org_name', orgData.name);
            } else {
                setError(data.error || 'Failed to update organization settings');
            }
        } catch (error) {
            console.error('Error saving organization:', error);
            setError('Network error. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAdmin = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccessMessage('');

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${Api_Base}/org-admin/profile/update/`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(adminData)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage('✅ Admin profile updated successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
                
                // Update localStorage
                localStorage.setItem('admin_name', adminData.full_name);
                localStorage.setItem('user_email', adminData.email);
            } else {
                setError(data.error || 'Failed to update admin profile');
            }
        } catch (error) {
            console.error('Error saving admin:', error);
            setError('Network error. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveNotifications = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccessMessage('');

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${Api_Base}/org-admin/notifications/update/`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(notifications)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage('✅ Notification preferences updated successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(data.error || 'Failed to update notification preferences');
            }
        } catch (error) {
            console.error('Error saving notifications:', error);
            setError('Network error. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="settings-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-container">
            <div className="page-header">
                <div>
                    <h1>Settings</h1>
                    <p className="page-subtitle">Manage your organization and account settings</p>
                </div>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="success-banner">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    {successMessage}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="error-banner">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    {error}
                    <button onClick={fetchSettings}>Retry</button>
                </div>
            )}

            {/* Tabs */}
            <div className="settings-tabs">
                <button 
                    className={`tab ${activeTab === 'organization' ? 'active' : ''}`}
                    onClick={() => setActiveTab('organization')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    </svg>
                    Organization
                </button>
                <button 
                    className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
                    onClick={() => setActiveTab('admin')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Admin Profile
                </button>
                <button 
                    className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notifications')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    Notifications
                </button>
                <button 
                    className={`tab ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Security
                </button>
            </div>

            {/* Tab Content */}
            <div className="settings-content">
                {activeTab === 'organization' && (
                    <OrganizationSettings 
                        data={orgData}
                        setData={setOrgData}
                        onSave={handleSaveOrganization}
                        isSaving={isSaving}
                    />
                )}
                
                {activeTab === 'admin' && (
                    <AdminProfileSettings 
                        data={adminData}
                        setData={setAdminData}
                        onSave={handleSaveAdmin}
                        isSaving={isSaving}
                    />
                )}
                
                {activeTab === 'notifications' && (
                    <NotificationSettings 
                        data={notifications}
                        setData={setNotifications}
                        onSave={handleSaveNotifications}
                        isSaving={isSaving}
                    />
                )}
                
                {activeTab === 'security' && (
                    <SecuritySettings />
                )}
            </div>
        </div>
    );
}

// ============================================
// ORGANIZATION SETTINGS
// ============================================

function OrganizationSettings({ data, setData, onSave, isSaving }) {
    const [showChangeCode, setShowChangeCode] = useState(false);
    const [newCode, setNewCode] = useState(data.code);
    const [isChangingCode, setIsChangingCode] = useState(false);

    const handleChangeCode = async () => {
        if (!newCode || newCode.length < 4) {
            alert('❌ Code must be at least 4 characters');
            return;
        }

        setIsChangingCode(true);

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

            const responseData = await response.json();

            if (response.ok) {
                setData({ ...data, code: newCode.toUpperCase() });
                localStorage.setItem('org_code', newCode.toUpperCase());
                setShowChangeCode(false);
                alert('✅ Organization code updated successfully!');
            } else {
                alert(`Error: ${responseData.error || 'Failed to update code'}`);
            }
        } catch (error) {
            console.error('Error changing code:', error);
            alert('Network error. Please try again.');
        } finally {
            setIsChangingCode(false);
        }
    };

    useEffect(() => {
        setNewCode(data.code);
    }, [data.code]);

    return (
        <div className="settings-section">
            <div className="section-header">
                <h2>Organization Information</h2>
                <p>Manage your organization's details and settings</p>
            </div>

            <form onSubmit={onSave} className="settings-form">
                {/* Basic Info */}
                <div className="form-group">
                    <label>Organization Name</label>
                    <input 
                        type="text"
                        value={data.name}
                        onChange={(e) => setData({ ...data, name: e.target.value })}
                        placeholder="e.g., University of Nairobi"
                        required
                        disabled
                    />
                    <small>Contact support to change your organization name</small>
                </div>

                <div className="form-group">
                    <label>Organization Type</label>
                    <select 
                        value={data.type}
                        onChange={(e) => setData({ ...data, type: e.target.value })}
                        required
                        disabled
                    >
                        <option value="">Select type...</option>
                        <option value="university">University</option>
                        <option value="company">Company</option>
                        <option value="ngo_free">NGO (Free)</option>
                        <option value="ngo_subsidized">NGO (Subsidized)</option>
                        <option value="government">Government</option>
                    </select>
                    <small>Contact support to change your organization type</small>
                </div>

                <div className="code-section">
                    <label>Organization Code</label>
                    <div className="code-display-box">
                        <div className="code-value-large">{data.code}</div>
                        <button 
                            type="button"
                            className="change-code-btn-inline"
                            onClick={() => setShowChangeCode(!showChangeCode)}
                        >
                            Change Code
                        </button>
                    </div>
                    {showChangeCode && (
                        <div className="code-change-form">
                            <input 
                                type="text"
                                value={newCode}
                                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                placeholder="Enter new code"
                                maxLength={20}
                                minLength={4}
                            />
                            <div className="code-actions">
                                <button 
                                    type="button" 
                                    onClick={() => setShowChangeCode(false)}
                                    disabled={isChangingCode}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleChangeCode} 
                                    className="save-code-btn"
                                    disabled={isChangingCode}
                                >
                                    {isChangingCode ? 'Saving...' : 'Save Code'}
                                </button>
                            </div>
                        </div>
                    )}
                    <small>Members use this code to join your organization</small>
                </div>

                {/* Contact Info */}
                <div className="form-row">
                    <div className="form-group">
                        <label>Contact Email</label>
                        <input 
                            type="email"
                            value={data.contact_email}
                            onChange={(e) => setData({ ...data, contact_email: e.target.value })}
                            placeholder="contact@organization.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Contact Phone</label>
                        <input 
                            type="tel"
                            value={data.contact_phone}
                            onChange={(e) => setData({ ...data, contact_phone: e.target.value })}
                            placeholder="+254 712 345 678"
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Maximum Members</label>
                    <input 
                        type="number"
                        value={data.max_members}
                        onChange={(e) => setData({ ...data, max_members: parseInt(e.target.value) || 0 })}
                        min="0"
                        required
                        disabled
                    />
                    <small>Contact support to increase this limit</small>
                </div>

                {/* Member Settings */}
                <div className="settings-toggles">
                    <div className="toggle-item">
                        <div>
                            <h4>Allow Self-Registration</h4>
                            <p>Members can join using the organization code</p>
                        </div>
                        <label className="toggle-switch">
                            <input 
                                type="checkbox"
                                checked={data.allow_self_registration}
                                onChange={(e) => setData({ ...data, allow_self_registration: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="toggle-item">
                        <div>
                            <h4>Require Admin Approval</h4>
                            <p>New members need approval before accessing services</p>
                        </div>
                        <label className="toggle-switch">
                            <input 
                                type="checkbox"
                                checked={data.require_admin_approval}
                                onChange={(e) => setData({ ...data, require_admin_approval: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                {/* PUBLIC BOOKING SETTINGS */}
                <div className="public-booking-section">
                    <div className="section-divider">
                        <h3>🌐 Public Booking Settings</h3>
                        <p>Control whether non-members can book sessions with your therapists</p>
                    </div>

                    <div className="settings-toggles">
                        <div className="toggle-item highlight">
                            <div>
                                <h4>Accept Public Patients</h4>
                                <p>Allow people outside your organization to book paid sessions</p>
                            </div>
                            <label className="toggle-switch">
                                <input 
                                    type="checkbox"
                                    checked={data.accept_public_patients}
                                    onChange={(e) => setData({ ...data, accept_public_patients: e.target.checked })}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    {data.accept_public_patients && (
                        <div className="public-rate-section">
                            <div className="form-group">
                                <label>Public Session Rate (KES)</label>
                                <div className="input-with-currency">
                                    <span className="currency-label">KES</span>
                                    <input 
                                        type="number"
                                        value={data.public_session_rate}
                                        onChange={(e) => setData({ ...data, public_session_rate: parseFloat(e.target.value) })}
                                        min="1000"
                                        step="500"
                                        required
                                    />
                                </div>
                                <small>Fee charged to non-members per session (Recommended: KES 3,000 - 5,000)</small>
                            </div>

                            <div className="info-box success">
                                <div className="info-icon">✅</div>
                                <div>
                                    <strong>Public Booking Enabled</strong>
                                    <ul>
                                        <li>Your members: Sessions remain <strong>FREE</strong> (covered by subscription)</li>
                                        <li>Public patients: Pay <strong>KES {data.public_session_rate.toLocaleString()}</strong> per session</li>
                                        <li>Your therapists will be visible to independent patients and other organizations</li>
                                        <li>You earn additional revenue from public bookings</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {!data.accept_public_patients && (
                        <div className="info-box neutral">
                            <div className="info-icon">ℹ️</div>
                            <div>
                                <strong>Public Booking Disabled</strong>
                                <p>Your therapists are only visible to your organization members. Enable to:</p>
                                <ul>
                                    <li>Earn additional revenue from public patients</li>
                                    <li>Give your therapists more exposure</li>
                                    <li>Provide services to the broader community</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ============================================
// ADMIN PROFILE SETTINGS
// ============================================

function AdminProfileSettings({ data, setData, onSave, isSaving }) {
    return (
        <div className="settings-section">
            <div className="section-header">
                <h2>Admin Profile</h2>
                <p>Update your personal information</p>
            </div>

            <form onSubmit={onSave} className="settings-form">
                <div className="form-group">
                    <label>Full Name</label>
                    <input 
                        type="text"
                        value={data.full_name}
                        onChange={(e) => setData({ ...data, full_name: e.target.value })}
                        placeholder="John Doe"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Email Address</label>
                    <input 
                        type="email"
                        value={data.email}
                        onChange={(e) => setData({ ...data, email: e.target.value })}
                        placeholder="admin@email.com"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Phone Number</label>
                    <input 
                        type="tel"
                        value={data.phone}
                        onChange={(e) => setData({ ...data, phone: e.target.value })}
                        placeholder="+254 712 345 678"
                        required
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Update Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ============================================
// NOTIFICATION SETTINGS
// ============================================

function NotificationSettings({ data, setData, onSave, isSaving }) {
    return (
        <div className="settings-section">
            <div className="section-header">
                <h2>Notification Preferences</h2>
                <p>Choose what email notifications you want to receive</p>
            </div>

            <form onSubmit={onSave} className="settings-form">
                <div className="settings-toggles">
                    <div className="toggle-item">
                        <div>
                            <h4>New Member Joined</h4>
                            <p>Get notified when a new member joins your organization</p>
                        </div>
                        <label className="toggle-switch">
                            <input 
                                type="checkbox"
                                checked={data.new_member}
                                onChange={(e) => setData({ ...data, new_member: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="toggle-item">
                        <div>
                            <h4>New Session Booked</h4>
                            <p>Get notified when a member books a therapy session</p>
                        </div>
                        <label className="toggle-switch">
                            <input 
                                type="checkbox"
                                checked={data.new_session}
                                onChange={(e) => setData({ ...data, new_session: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="toggle-item">
                        <div>
                            <h4>Session Cancelled</h4>
                            <p>Get notified when a session is cancelled</p>
                        </div>
                        <label className="toggle-switch">
                            <input 
                                type="checkbox"
                                checked={data.session_cancelled}
                                onChange={(e) => setData({ ...data, session_cancelled: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="toggle-item">
                        <div>
                            <h4>Weekly Report</h4>
                            <p>Receive a weekly summary of platform activity</p>
                        </div>
                        <label className="toggle-switch">
                            <input 
                                type="checkbox"
                                checked={data.weekly_report}
                                onChange={(e) => setData({ ...data, weekly_report: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="toggle-item">
                        <div>
                            <h4>Monthly Report</h4>
                            <p>Receive a monthly analytics and usage report</p>
                        </div>
                        <label className="toggle-switch">
                            <input 
                                type="checkbox"
                                checked={data.monthly_report}
                                onChange={(e) => setData({ ...data, monthly_report: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ============================================
// SECURITY SETTINGS
// ============================================

function SecuritySettings() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChanging, setIsChanging] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            alert('❌ Passwords do not match!');
            return;
        }

        if (newPassword.length < 8) {
            alert('❌ Password must be at least 8 characters long!');
            return;
        }

        setIsChanging(true);

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${Api_Base}/org-admin/change-password/`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('✅ Password changed successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                alert(`Error: ${data.error || 'Failed to change password'}`);
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Network error. Please try again.');
        } finally {
            setIsChanging(false);
        }
    };

    return (
        <div className="settings-section">
            <div className="section-header">
                <h2>Security Settings</h2>
                <p>Manage your account security and password</p>
            </div>

            <form onSubmit={handleChangePassword} className="settings-form">
                <div className="security-notice">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                    </svg>
                    <div>
                        <h4>Change Password</h4>
                        <p>Choose a strong password with at least 8 characters</p>
                    </div>
                </div>

                <div className="form-group">
                    <label>Current Password</label>
                    <input 
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                        
                    />
                     <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)} >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                </div>

                <div className="form-group">
                    <label>New Password</label>
                    <input 
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        minLength={8}
                        required
                    />
                    <small>Must be at least 8 characters long</small>
                    <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)} >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                </div>

                <div className="form-group">
                    <label>Confirm New Password</label>
                    <input 
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        minLength={8}
                        required
                    />
                      <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)} >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                </div>

                <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={isChanging}>
                        {isChanging ? 'Changing...' : 'Change Password'}
                    </button>
                </div>
            </form>

            <div className="danger-zone">
                <h3>Danger Zone</h3>
                <div className="danger-item">
                    <div>
                        <h4>Deactivate Organization</h4>
                        <p>Temporarily disable your organization account</p>
                    </div>
                    <button className="danger-btn" onClick={() => alert('Contact support to deactivate your organization')}>
                        Deactivate
                    </button>
                </div>
            </div>
        </div>
    );
}

export default OrgSettings;