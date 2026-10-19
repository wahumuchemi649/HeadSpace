import './Login.css';
import { useState, useEffect } from 'react';
import { Api_Base } from './Api';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaEyeSlash, FaEye } from "react-icons/fa";
import { FiMail, FiLock, FiPhone, FiUser, FiChevronDown } from "react-icons/fi";
import { MdRadioButtonChecked } from "react-icons/md";
import { CheckCircle2, ShieldCheck, Heart, Stethoscope, Calendar } from 'lucide-react';

import { COUNTRY_CODES, formatInternationalPhone } from '../utils/countryCodes';
import PhoneInput from '../components/PhoneInput';
import { validateEmail, validatePhone, validatePassword } from '../utils/validators';




function Login({ initialRole }) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Determine active role from prop or URL query (?role=therapist or ?role=client)
    const roleParam = searchParams.get('role');
    const defaultRole = initialRole || (roleParam === 'therapist' ? 'therapist' : 'client');
    const [role, setRole] = useState(defaultRole);

    const redirectParam = searchParams.get('redirect') || '';
    const actionParam = searchParams.get('action') || '';
    const registeredParam = searchParams.get('registered') === 'true';
    const isBookingRedirect = actionParam === 'book' || redirectParam.includes('session');
    
    const [clientForm, setClientForm] = useState({
        email: "",
        password: ""
    });

    const [therapistForm, setTherapistForm] = useState({
        email: "",
        phoneNumber: ""
    });

    const [countryCode, setCountryCode] = useState('+254');
    const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (roleParam === 'therapist' || initialRole === 'therapist') {
            setRole('therapist');
        } else if (roleParam === 'client') {
            setRole('client');
        }
    }, [roleParam, initialRole]);

    function handleRoleSwitch(newRole) {
        setRole(newRole);
        setErrors({});
        // Update URL query parameter without navigating away
        const newParams = new URLSearchParams(searchParams);
        newParams.set('role', newRole);
        setSearchParams(newParams, { replace: true });
    }

    function handleClientChange(e) {
        const { name, value } = e.target;
        setClientForm((prev) => ({ ...prev, [name]: value }));
        if (errors.global) setErrors({});
    }

    function handleTherapistChange(e) {
        const { name, value } = e.target;
        setTherapistForm((prev) => ({ ...prev, [name]: value }));
        if (errors.global) setErrors({});
    }

    async function handleClientSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});
        
        const emailErr = validateEmail(clientForm.email);
        const passErr = validatePassword(clientForm.password, 1);
        if (emailErr || passErr) {
            setErrors({
                email: emailErr,
                password: passErr,
                global: emailErr || passErr
            });
            setSubmitting(false);
            return;
        }
        
        try {
            const res = await fetch(`${Api_Base}/api/login/`, {
                method: 'POST',
                headers: { 'Content-Type': "application/json" },
                body: JSON.stringify(clientForm)
            });
            
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem("access_token", data.access);
                localStorage.setItem("refresh_token", data.refresh);
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("user_type", "patient");
                
                // Redirect user to their target destination or default dashboard
                navigate(redirectParam || '/Dashboard');
            } else {
                setErrors({ global: data.message || 'Invalid email or password' });
            }
        } catch (err) {
            console.error(err);
            setErrors({ global: 'Network error, please try again later' });
        } finally {
            setSubmitting(false);
        }
    }

    async function handleTherapistSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});
        
        const emailErr = validateEmail(therapistForm.email);
        const phoneErr = validatePhone(therapistForm.phoneNumber, countryCode);
        if (emailErr || phoneErr) {
            setErrors({
                therapistEmail: emailErr,
                therapistPhone: phoneErr,
                global: emailErr || phoneErr
            });
            setSubmitting(false);
            return;
        }

        // Format phone number with selected country code
        const formattedPhone = formatInternationalPhone(countryCode, therapistForm.phoneNumber);


        
        try {
            const res = await fetch(`${Api_Base}/login/`, {  
                method: 'POST',
                headers: { 'Content-Type': "application/json" },
                body: JSON.stringify({
                    email: therapistForm.email,
                    phoneNumber: formattedPhone
                })
            });

            const data = await res.json();
            
            if (res.ok && data.access) {
                localStorage.setItem("access_token", data.access);
                localStorage.setItem("refresh_token", data.refresh);
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("user_type", "therapist");
                
                navigate(redirectParam || '/Therapydashboard');
            } else {
                setErrors({ global: data.message || "Invalid provider credentials" });
            }
        } catch (err) {
            console.error(err);
            setErrors({ global: 'Network error, please try again later' });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="login-split-page">
            <div className="login-split-wrapper">
                
                {/* Left/Side Content Banner (Afyangu Style) */}
                <div className="login-side-banner">
                    <div className="login-banner-content">
                        <div className="login-banner-tag">
                            {role === 'client' ? (
                                <>
                                    <Heart size={14} className="tag-icon" />
                                    <span>HeadSpace Client Care</span>
                                </>
                            ) : (
                                <>
                                    <Stethoscope size={14} className="tag-icon" />
                                    <span>Provider Network</span>
                                </>
                            )}
                        </div>

                        <h2>
                            {role === 'client' 
                                ? "Take charge of your well-being with HeadSpace" 
                                : "Deliver personalized, high-impact clinical care"}
                        </h2>
                        
                        <p className="login-banner-desc">
                            {role === 'client'
                                ? "HeadSpace simplifies therapy booking, medical record management, and mental health monitoring. Seamlessly organize appointments and therapy sessions."
                                : "Manage patient consultations, set custom hourly rates, update your weekly availability grid, and conduct secure, end-to-end encrypted sessions."}
                        </p>

                        <div className="login-banner-highlights">
                            {role === 'client' ? (
                                <>
                                    <div className="banner-feature-item">
                                        <CheckCircle2 size={18} className="banner-check" />
                                        <span>Verified & certified mental health professionals</span>
                                    </div>
                                    <div className="banner-feature-item">
                                        <CheckCircle2 size={18} className="banner-check" />
                                        <span>100% confidential and end-to-end encrypted sessions</span>
                                    </div>
                                    <div className="banner-feature-item">
                                        <CheckCircle2 size={18} className="banner-check" />
                                        <span>Real-time appointment scheduling & automatic reminders</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="banner-feature-item">
                                        <CheckCircle2 size={18} className="banner-check" />
                                        <span>Direct appointment scheduling & client management</span>
                                    </div>
                                    <div className="banner-feature-item">
                                        <CheckCircle2 size={18} className="banner-check" />
                                        <span>Secure video & messaging clinical workspace</span>
                                    </div>
                                    <div className="banner-feature-item">
                                        <CheckCircle2 size={18} className="banner-check" />
                                        <span>Integrated rate settings & availability controls</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="login-banner-image-box">
                        <img 
                            src="/header.png" 
                            alt="Compassionate healthcare support" 
                            className="login-side-photo"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    </div>
                </div>

                {/* Right Form Card */}
                <div className="login-form-side">
                    <div className="login-card-inner">
                        <div className="login-card-header">
                            <Link to="/" className="login-brand-header">
                                <MdRadioButtonChecked className="login-brand-icon" size={34} color="#025492" />
                                <span className="login-brand-name">HeadSpace</span>
                            </Link>
                            <h2>Sign In</h2>
                            <p>Access your unified HeadSpace account</p>
                        </div>

                        {/* Booking Prompt Alert: Shown when user clicks "Book a session" while logged out */}
                        {isBookingRedirect && role === 'client' && (
                            <div className="booking-redirect-alert">
                                <Calendar className="booking-alert-icon" size={22} />
                                <div className="booking-alert-content">
                                    <h4>Log in to book a session</h4>
                                    <p>Please sign in to your client account to complete your therapist appointment booking.</p>
                                    <div className="booking-alert-cta-wrap">
                                        <span>Don't have an account yet?</span>
                                        <Link 
                                            to={`/signIn?redirect=${encodeURIComponent(redirectParam || '/session')}&action=book`} 
                                            className="booking-alert-link"
                                        >
                                            Sign up to book a session &rarr;
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Registration Success Banner */}
                        {registeredParam && (
                            <div className="booking-redirect-alert" style={{ borderLeftColor: '#00a859', background: '#e6f7ef', borderColor: '#a7f3d0' }}>
                                <CheckCircle2 className="booking-alert-icon" size={22} style={{ color: '#00a859' }} />
                                <div className="booking-alert-content">
                                    <h4 style={{ color: '#065f46' }}>Account created successfully!</h4>
                                    <p style={{ color: '#065f46' }}>Please enter your password below to sign in and proceed to your session.</p>
                                </div>
                            </div>
                        )}

                        {/* Role Switcher Tabs (Unified Dual-Role Login) */}
                        <div className="login-role-tabs">
                            <button
                                type="button"
                                className={`role-tab-btn ${role === 'client' ? 'active' : ''}`}
                                onClick={() => handleRoleSwitch('client')}
                            >
                                <FiUser size={15} />
                                <span>Client / Patient</span>
                            </button>
                            <button
                                type="button"
                                className={`role-tab-btn ${role === 'therapist' ? 'active' : ''}`}
                                onClick={() => handleRoleSwitch('therapist')}
                            >
                                <Stethoscope size={15} />
                                <span>Therapist</span>
                            </button>
                        </div>

                        {errors.global && (
                            <div className="login-alert-banner" role="alert">
                                {errors.global}
                            </div>
                        )}

                        {/* Client Login Form */}
                        {role === 'client' ? (
                            <form onSubmit={handleClientSubmit} noValidate className="login-card-form">
                                <div className="form-group">
                                    <label htmlFor="email">Email address</label>
                                    <div className="input-icon-wrapper">
                                        <FiMail className="field-icon-left" />
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            className={`card-input ${errors.email ? 'input-error' : ''}`}
                                            value={clientForm.email}
                                            onChange={handleClientChange}
                                            placeholder="you@example.com"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    {errors.email && <span className="error-text">{errors.email}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <div className="input-icon-wrapper">
                                        <FiLock className="field-icon-left" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            name="password"
                                            className={`card-input has-toggle ${errors.password ? 'input-error' : ''}`}
                                            value={clientForm.password}
                                            onChange={handleClientChange}
                                            placeholder="Enter your password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="field-toggle-btn"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                        </button>
                                    </div>
                                    {errors.password && <span className="error-text">{errors.password}</span>}
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
                                    <Link to="/forgot-password" className="forgot-password-link">
                                        Forgot password?
                                    </Link>
                                </div>

                                <button type="submit" className="login-submit-btn" disabled={submitting}>
                                    {submitting ? "Signing in..." : (isBookingRedirect ? "Login & Continue to Booking" : "Sign In as Client")}
                                </button>

                                <div className="login-card-footer">
                                    Don't have an account?{" "}
                                    <Link 
                                        to={isBookingRedirect 
                                            ? `/signIn?redirect=${encodeURIComponent(redirectParam || '/session')}&action=book` 
                                            : "/SignIn"} 
                                        className="signup-link"
                                    >
                                        {isBookingRedirect ? "Sign up to book a session" : "Sign up"}
                                    </Link>
                                </div>
                            </form>
                        ) : (
                            /* Therapist Login Form */
                            <form onSubmit={handleTherapistSubmit} noValidate className="login-card-form">
                                <div className="form-group">
                                    <label htmlFor="therapist-email">Provider Email</label>
                                    <div className="input-icon-wrapper">
                                        <FiMail className="field-icon-left" />
                                        <input
                                            type="email"
                                            id="therapist-email"
                                            name="email"
                                            className={`card-input ${errors.therapistEmail ? 'input-error' : ''}`}
                                            value={therapistForm.email}
                                            onChange={handleTherapistChange}
                                            placeholder="doctor@example.com"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    {errors.therapistEmail && <span className="error-text">{errors.therapistEmail}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phoneNumber">Registered Phone Number</label>
                                    <PhoneInput
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        countryCode={countryCode}
                                        onCountryChange={setCountryCode}
                                        value={therapistForm.phoneNumber}
                                        onChange={handleTherapistChange}
                                        hasError={Boolean(errors.therapistPhone)}
                                        required
                                    />
                                    {errors.therapistPhone && <span className="error-text">{errors.therapistPhone}</span>}
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
                                </div>

                                <button type="submit" className="login-submit-btn" disabled={submitting}>
                                    {submitting ? "Authenticating..." : "Sign In as Therapist"}
                                </button>

                                <div className="login-card-footer">
                                    Not registered yet?{" "}
                                    <Link to="/Therapist-apply" className="signup-link">
                                        Apply to join network
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="login-version-footer">
                        <span>HeadSpace Healthcare &bull; Unified Auth</span>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Login;