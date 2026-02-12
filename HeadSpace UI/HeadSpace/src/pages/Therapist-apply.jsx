import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api_Base } from './Api';
import './therapist-apply.css';
import { MdRadioButtonChecked, MdCheckCircle } from 'react-icons/md';

const SPECIALTIES = [
    { value: 'anxiety_stress', label: 'Anxiety / Stress' },
    { value: 'depression', label: 'Depression' },
    { value: 'trauma_ptsd', label: 'Trauma / PTSD' },
    { value: 'relationship_issues', label: 'Relationship Issues' },
    { value: 'self_esteem', label: 'Self-esteem Issues' },
    { value: 'burnout', label: 'Burnout / Work-related Stress' },
    { value: 'grief_loss', label: 'Grief / Loss' },
    { value: 'family_problems', label: 'Family Problems' },
    { value: 'substance_use', label: 'Substance Use' },
    { value: 'academic_pressure', label: 'Academic Pressure' }
];

function TherapistApply() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        specialties: [],
        profile_pic: null,
        documents: []
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [profilePreview, setProfilePreview] = useState(null);

    const handleSpecialtyChange = (value) => {
        if (form.specialties.includes(value)) {
            setForm({
                ...form,
                specialties: form.specialties.filter(s => s !== value)
            });
        } else if (form.specialties.length < 3) {
            setForm({
                ...form,
                specialties: [...form.specialties, value]
            });
        } else {
            alert('You can select a maximum of 3 specialties');
        }
    };

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Profile picture must be less than 5MB');
                return;
            }
            
            setForm({ ...form, profile_pic: file });
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDocumentsChange = (e) => {
        const files = Array.from(e.target.files);
        
        // Validate total size (max 10MB total)
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        if (totalSize > 10 * 1024 * 1024) {
            alert('Total document size must be less than 10MB');
            return;
        }
        
        setForm({ ...form, documents: files });
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!form.first_name.trim()) newErrors.first_name = 'First name is required';
        if (!form.last_name.trim()) newErrors.last_name = 'Last name is required';
        if (!form.email.trim()) newErrors.email = 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
        if (form.specialties.length !== 3) {
            newErrors.specialties = 'Please select exactly 3 specialties';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('first_name', form.first_name.trim());
        formData.append('last_name', form.last_name.trim());
        formData.append('email', form.email.trim());
        formData.append('phone', form.phone.trim());
        
        form.specialties.forEach(s => formData.append('specialties', s));

        if (form.profile_pic) {
            formData.append('profile_pic', form.profile_pic);
        }

        form.documents.forEach(file => {
            formData.append('documents', file);
        });

        try {
            const res = await fetch(`${Api_Base}/therapist-apply/`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                alert('Application submitted successfully! We will contact you soon.');
                
                // Reset form
                setForm({
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: '',
                    specialties: [],
                    profile_pic: null,
                    documents: []
                });
                setProfilePreview(null);
                
                // Optionally redirect
                navigate('/');
            } else {
                alert(data.error || 'Submission failed. Please try again.');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Network error. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="apply-container">
            <header className="apply-header">
                <MdRadioButtonChecked size={60} color='#3d1d77'/>
                <h1>HeadSpace</h1>
                <p>Join Our Team of Licensed Therapists</p>
            </header>

            <form onSubmit={handleSubmit} className="apply-form">
                <h2>Therapist Application</h2>
                <p className="form-subtitle">
                    Help us make mental health care accessible. Fill out the form below to join our network.
                </p>

                <div className="form-section">
                    <h3>Personal Information</h3>
                    
                    <div className="form-group">
                        <label>First Name *</label>
                        <input
                            type="text"
                            placeholder="Enter your first name"
                            value={form.first_name}
                            onChange={e => setForm({ ...form, first_name: e.target.value })}
                            className={errors.first_name ? 'error' : ''}
                        />
                        {errors.first_name && <span className="error-text">{errors.first_name}</span>}
                    </div>

                    <div className="form-group">
                        <label>Last Name *</label>
                        <input
                            type="text"
                            placeholder="Enter your last name"
                            value={form.last_name}
                            onChange={e => setForm({ ...form, last_name: e.target.value })}
                            className={errors.last_name ? 'error' : ''}
                        />
                        {errors.last_name && <span className="error-text">{errors.last_name}</span>}
                    </div>

                    <div className="form-group">
                        <label>Email *</label>
                        <input
                            type="email"
                            placeholder="your.email@example.com"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            className={errors.email ? 'error' : ''}
                        />
                        {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label>Phone Number *</label>
                        <input
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                            className={errors.phone ? 'error' : ''}
                        />
                        {errors.phone && <span className="error-text">{errors.phone}</span>}
                    </div>
                </div>

                <div className="form-section">
                    <h3>Areas of Expertise</h3>
                    <p className="section-note">Select exactly 3 specialties</p>
                    
                    <div className="specialties-grid">
                        {SPECIALTIES.map(specialty => {
                            const isSelected = form.specialties.includes(specialty.value);
                            const isDisabled = !isSelected && form.specialties.length >= 3;
                            
                            return (
                                <label
                                    key={specialty.value}
                                    className={`specialty-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleSpecialtyChange(specialty.value)}
                                        disabled={isDisabled}
                                    />
                                    <span className="specialty-label">{specialty.label}</span>
                                    {isSelected && <MdCheckCircle className="check-icon" />}
                                </label>
                            );
                        })}
                    </div>
                    {errors.specialties && <span className="error-text">{errors.specialties}</span>}
                    <p className="specialty-count">
                        {form.specialties.length} / 3 selected
                    </p>
                </div>

                <div className="form-section">
                    <h3>Profile Picture</h3>
                    <p className="section-note">Upload a professional headshot (Max 5MB)</p>
                    
                    <div className="file-upload-area">
                        {profilePreview ? (
                            <div className="preview-container">
                                <img src={profilePreview} alt="Profile preview" className="profile-preview" />
                                <button
                                    type="button"
                                    className="remove-btn"
                                    onClick={() => {
                                        setForm({ ...form, profile_pic: null });
                                        setProfilePreview(null);
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <label className="file-upload-label">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfilePicChange}
                                    className="file-input"
                                />
                                <div className="upload-placeholder">
                                    <span className="upload-icon">📷</span>
                                    <span>Click to upload profile picture</span>
                                </div>
                            </label>
                        )}
                    </div>
                </div>

                <div className="form-section">
                    <h3>Supporting Documents</h3>
                    <p className="section-note">
                        Upload your CV, licenses, and certificates (Max 10MB total)
                    </p>
                    
                    <label className="file-upload-label">
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx"
                            onChange={handleDocumentsChange}
                            className="file-input"
                        />
                        <div className="upload-placeholder">
                            <span className="upload-icon">📄</span>
                            <span>Click to upload documents</span>
                        </div>
                    </label>
                    
                    {form.documents.length > 0 && (
                        <div className="file-list">
                            <p><strong>Uploaded files:</strong></p>
                            <ul>
                                {form.documents.map((file, index) => (
                                    <li key={index}>{file.name}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="submit-btn"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>

                <p className="form-footer">
                    * Required fields. We'll review your application and contact you within 3-5 business days.
                </p>
            </form>
        </div>
    );
}

export default TherapistApply;