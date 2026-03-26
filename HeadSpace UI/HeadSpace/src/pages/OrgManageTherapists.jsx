import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api_Base } from './Api';
import './OrgManageTherapists.css';

function OrgManageTherapists() {
    const navigate = useNavigate();
    const [therapists, setTherapists] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTherapists();
    }, []);

    const fetchTherapists = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                navigate('/OrgAdminLogin');
                return;
            }

            const response = await fetch(`${Api_Base}/org-admin/therapists/`, {
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
            console.log('📋 Therapists data:', data);
            setTherapists(data.therapists || []);
        } catch (error) {
            console.error('Error fetching therapists:', error);
            setError('Failed to load therapists');
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
        if (!confirm('Are you sure you want to deactivate this therapist?')) return;
        
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${Api_Base}/org-admin/therapists/${therapistId}/deactivate/`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                alert('✅ Therapist deactivated successfully!');
                fetchTherapists(); // Refresh list
            } else {
                const data = await response.json();
                alert(`Error: ${data.error || 'Failed to deactivate therapist'}`);
            }
        } catch (error) {
            console.error('Error deactivating therapist:', error);
            alert('Network error. Please try again.');
        }
    };

    const handleActivate = async (therapistId) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${Api_Base}/org-admin/therapists/${therapistId}/activate/`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                alert('✅ Therapist activated successfully!');
                fetchTherapists(); // Refresh list
            } else {
                const data = await response.json();
                alert(`Error: ${data.error || 'Failed to activate therapist'}`);
            }
        } catch (error) {
            console.error('Error activating therapist:', error);
            alert('Network error. Please try again.');
        }
    };

    // Calculate stats from real data
    const activeTherapists = therapists.filter(t => t.is_active).length;
    const inactiveTherapists = therapists.filter(t => !t.is_active).length;
    const avgRating = therapists.length > 0 
        ? (therapists.reduce((sum, t) => sum + (t.rating || 0), 0) / therapists.length).toFixed(1)
        : '0.0';

    if (isLoading) {
        return (
            <div className="manage-therapists-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading therapists...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="manage-therapists-container">
            <div className="page-header">
                <div>
                    <h1>Manage Therapists</h1>
                    <p className="page-subtitle">Add and oversee your mental health professionals</p>
                </div>
                <button className="add-therapist-btn" onClick={() => setShowAddModal(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Therapist
                </button>
            </div>

            {error && (
                <div className="error-banner">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    {error}
                    <button onClick={fetchTherapists}>Retry</button>
                </div>
            )}

            {/* Stats Overview - Real Data */}
            <div className="therapist-stats">
                <div className="stat-box">
                    <p className="stat-label">Total Therapists</p>
                    <p className="stat-number">{therapists.length}</p>
                </div>
                <div className="stat-box">
                    <p className="stat-label">Active</p>
                    <p className="stat-number green">{activeTherapists}</p>
                </div>
                <div className="stat-box">
                    <p className="stat-label">Inactive</p>
                    <p className="stat-number red">{inactiveTherapists}</p>
                </div>
                <div className="stat-box">
                    <p className="stat-label">Avg Rating</p>
                    <p className="stat-number">{avgRating}</p>
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

            {/* Therapists List */}
            {filteredTherapists.length > 0 ? (
                <div className="therapists-grid">
                    {filteredTherapists.map(therapist => (
                        <TherapistCard 
                            key={therapist.id} 
                            therapist={therapist}
                            onDeactivate={handleDeactivate}
                            onActivate={handleActivate}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <p>{searchQuery || filterStatus !== 'all' ? 'No therapists found' : 'No therapists yet'}</p>
                    {therapists.length === 0 && (
                        <button className="add-therapist-btn" onClick={() => setShowAddModal(true)}>
                            Add Your First Therapist
                        </button>
                    )}
                </div>
            )}

            {/* Add Therapist Modal */}
            {showAddModal && (
                <AddTherapistModal 
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

function TherapistCard({ therapist, onDeactivate, onActivate }) {
    return (
        <div className={`therapist-card ${!therapist.is_active ? 'inactive' : ''}`}>
            <div className="therapist-header">
                <div className="therapist-avatar">
                    {therapist.firstName[0]}{therapist.lastName[0]}
                </div>
                <div className="therapist-info">
                    <h3>Dr. {therapist.firstName} {therapist.lastName}</h3>
                    <p className="therapist-email">{therapist.email}</p>
                </div>
                <span className={`status-badge ${therapist.is_active ? 'active' : 'inactive'}`}>
                    {therapist.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>

            <div className="therapist-details">
                <div className="detail-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <span>{therapist.phoneNumber}</span>
                </div>
                <div className="detail-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>{therapist.specialty_1 || 'General'}</span>
                </div>
            </div>

            <div className="specialties-tags">
                {therapist.specialty_1 && <span className="tag">{therapist.specialty_1}</span>}
                {therapist.specialty_2 && <span className="tag">{therapist.specialty_2}</span>}
                {therapist.specialty_3 && <span className="tag">{therapist.specialty_3}</span>}
            </div>

            <div className="therapist-stats">
                <div className="stat">
                    <span className="stat-value">{therapist.sessions_count}</span>
                    <span className="stat-label">Sessions</span>
                </div>
                <div className="stat">
                    <span className="stat-value">⭐ {therapist.rating || '0.0'}</span>
                    <span className="stat-label">Rating</span>
                </div>
                <div className="stat">
                    <span className="stat-value">{therapist.joined_date || 'N/A'}</span>
                    <span className="stat-label">Joined</span>
                </div>
            </div>

            <div className="therapist-actions">
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

function AddTherapistModal({ onClose, onSuccess }) {
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

// OrgManageTherapists.jsx - Update AddTherapistModal handleSubmit

const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${Api_Base}/org-admin/therapists/add/`, {
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
                `✅ Therapist added successfully!\n\n` +
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
                    <h2>Add New Therapist</h2>
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

                <form onSubmit={handleSubmit} className="therapist-form">
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
                            <label>Phone Number *</label>
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

export default OrgManageTherapists;