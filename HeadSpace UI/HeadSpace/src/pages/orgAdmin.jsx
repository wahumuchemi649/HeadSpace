// OrgAdminLogin.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api_Base } from './Api';
import './orgAdmin.css';
import {FaEye, FaEyeSlash} from 'react-icons/fa';

function OrgAdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${Api_Base}/org-admin/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Store tokens
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                localStorage.setItem('user_type', 'org_admin');
                localStorage.setItem('org_name', data.organization.name);
                localStorage.setItem('org_id', data.organization.id);
                
                
                navigate('/OrgAdminDashboard');
            } else {
                setError(data.error || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="org-admin-login-container">
            <div className="login-left">
                <div className="branding">
                    <div className="logo-circle">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    </div>
                    <h1>HeadSpace</h1>
                    <p className="tagline">Organization Portal</p>
                </div>
                
                <div className="features-list">
                    <div className="feature-item">
                        <div className="feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            </svg>
                        </div>
                        <div>
                            <h3>Manage Therapists</h3>
                            <p>Add and oversee your mental health professionals</p>
                        </div>
                    </div>

                    <div className="feature-item">
                        <div className="feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                            </svg>
                        </div>
                        <div>
                            <h3>View Members</h3>
                            <p>Track your organization's member engagement</p>
                        </div>
                    </div>

                    <div className="feature-item">
                        <div className="feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                            </svg>
                        </div>
                        <div>
                            <h3>Analytics & Reports</h3>
                            <p>Monitor usage and session statistics</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="login-right">
                <div className="login-box">
                    <div className="login-header">
                        <h2>Organization Admin</h2>
                        <p>Login to manage your organization</p>
                    </div>

                    {error && (
                        <div className="error-banner">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <div className="input-with-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                </svg>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@organization.com"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-with-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
                                 <button 
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)} >
                                                    {showPassword ? <FaEyeSlash color='#3d1d77'/> : <FaEye color="color='#3d1d77'" />}
                                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="login-button"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="5" y1="12" x2="19" y2="12"/>
                                        <polyline points="12 5 19 12 12 19"/>
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>
                            Not an admin? <a href="/">Go to main site</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrgAdminLogin;