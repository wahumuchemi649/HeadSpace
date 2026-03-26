
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api_Base } from './Api';
import './super_login.css';

function SuperAdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${Api_Base}/super-admin/login/`, {
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
                localStorage.setItem('user_type', 'super_admin');
                localStorage.setItem('user_name', data.user.full_name);
                
                // Redirect to dashboard
                navigate('/SuperAdminDashboard');
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
        <div className="super-admin-login-container">
            <div className="login-left">
                <div className="branding">
                    <div className="logo-circle">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    </div>
                    <h1>HeadSpace</h1>
                    <p className="tagline">Platform Administration</p>
                </div>
                
                <div className="features-list">
                    <div className="feature-item">
                        <div className="feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            </svg>
                        </div>
                        <div>
                            <h3>Manage Organizations</h3>
                            <p>Create and oversee all platform organizations</p>
                        </div>
                    </div>

                    <div className="feature-item">
                        <div className="feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                            </svg>
                        </div>
                        <div>
                            <h3>Platform Analytics</h3>
                            <p>Real-time insights across all organizations</p>
                        </div>
                    </div>

                    <div className="feature-item">
                        <div className="feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M12 1v6m0 6v6"/>
                            </svg>
                        </div>
                        <div>
                            <h3>System Control</h3>
                            <p>Configure platform-wide settings</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="login-right">
                <div className="login-box">
                    <div className="login-header">
                        <h2>Super Admin Login</h2>
                        <p>Access the HeadSpace administration panel</p>
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
                                    placeholder="admin@headspace.com"
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
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
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
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 16v-4"/>
                                <path d="M12 8h.01"/>
                            </svg>
                            Not an admin? <a href="/">Go to main site</a>
                        </p>
                    </div>
                </div>

                <div className="security-notice">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                    </svg>
                    <p>This is a secure admin area. All activities are logged.</p>
                </div>
            </div>
        </div>
    );
}

export default SuperAdminLogin;