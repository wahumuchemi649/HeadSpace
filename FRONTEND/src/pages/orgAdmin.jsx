// OrgAdminLogin.jsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Api_Base } from './Api';
import './orgAdmin.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FiMail, FiLock } from 'react-icons/fi';
import { validateEmail, validatePassword } from '../utils/validators';

function OrgAdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        const emailErr = validateEmail(email);
        const passErr = validatePassword(password, 1);
        if (emailErr || passErr) {
            setError(emailErr || passErr);
            return;
        }

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
                <div className="left-content-wrapper">
                    <div className="branding">
                        <Link to="/" className="org-brand-link">
                            <div className="logo-circle">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                            </div>
                            <span className="org-brand-title">HeadSpace</span>
                        </Link>
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
            </div>

            <div className="login-right">
                <div className="login-box">
                    <div className="login-header">
                        <h2>Welcome back</h2>
                        <p>Sign in to manage your organization</p>
                    </div>

                    {error && (
                        <div className="error-banner">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">Email address</label>
                            <div className="input-icon-wrapper">
                                <FiMail className="field-icon-left" />
                                <input
                                    type="email"
                                    id="email"
                                    className="form-input"
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
                            <div className="password-input-wrapper">
                                <FiLock className="field-icon-left" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    className="form-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
                                <button 
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="login-options-row">
                            <label className="remember-me-label">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span>Remember me</span>
                            </label>
                            <span className="org-portal-badge">Organization</span>
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
                                "Sign in"
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>
                            Not an organization admin? <a href="/">Go to main site</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrgAdminLogin;