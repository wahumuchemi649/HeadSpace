import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import './TherapyLogin.css';
import { Api_Base } from "./Api";
import { FiMail } from "react-icons/fi";
import { MdRadioButtonChecked } from "react-icons/md";
import { Stethoscope, CheckCircle2, ShieldCheck } from "lucide-react";
import { COUNTRY_CODES, formatInternationalPhone } from "../utils/countryCodes";
import PhoneInput from "../components/PhoneInput";
import { validateEmail, validatePhone } from "../utils/validators";



function TherapyLogin() {
  const [form, setForm] = useState({
    email: "",
    phoneNumber: ""
  });
  const [countryCode, setCountryCode] = useState('+254');

  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    if (errors.global) {
      setErrors(prev => ({ ...prev, global: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    const emailErr = validateEmail(form.email);
    const phoneErr = validatePhone(form.phoneNumber, countryCode);
    if (emailErr || phoneErr) {
      setErrors({
        email: emailErr,
        phoneNumber: phoneErr,
        global: emailErr || phoneErr
      });
      return;
    }
    
    setIsSubmitting(true);

    
    try {
      const formattedPhone = formatInternationalPhone(countryCode, form.phoneNumber);
      const res = await fetch(`${Api_Base}/login/`, {  
        method: 'POST',
        headers: { 'Content-Type': "application/json" },
        body: JSON.stringify({
          email: form.email,
          phoneNumber: formattedPhone
        })
      });


      const data = await res.json();
      
      if (res.ok && data.access) {
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        navigate('/TherapyDashboard');
      } else {
        setErrors({ global: data.message || "Invalid Credentials" });
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrors({ global: 'Network error, please try again later' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="therapy-split-page">
      <div className="therapy-split-wrapper">
        
        {/* Left Side Content Banner (Image 2 Style) */}
        <div className="therapy-side-banner">
          <div className="therapy-banner-content">
            <div className="therapy-banner-tag">
              <Stethoscope size={14} className="tag-icon" />
              <span>Provider Network</span>
            </div>

            <h2>Empowering Therapists to Deliver Exceptional Care</h2>
            
            <p className="therapy-banner-desc">
              Manage your client consultations, update clinical session notes, configure your availability,
              and connect with patients in need of expert psychological support.
            </p>

            <div className="therapy-banner-highlights">
              <div className="banner-feature-item">
                <CheckCircle2 size={18} className="banner-check" />
                <span>Real-time appointment schedule management</span>
              </div>
              <div className="banner-feature-item">
                <CheckCircle2 size={18} className="banner-check" />
                <span>Integrated clinical notes & recovery tracking</span>
              </div>
              <div className="banner-feature-item">
                <CheckCircle2 size={18} className="banner-check" />
                <span>Prompt, guaranteed session compensation</span>
              </div>
            </div>
          </div>

          <div className="therapy-banner-image-box">
            <img 
              src="/therapist.png" 
              alt="Licensed Mental Health Professional" 
              className="therapy-side-photo"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>

        {/* Right Form Side */}
        <div className="therapy-form-side">
          <div className="therapy-card-inner">
            <div className="therapy-card-header">
              <Link to="/" className="therapy-brand-header">
                <MdRadioButtonChecked className="therapy-brand-icon" size={34} color="#025492" />
                <span className="therapy-brand-name">HeadSpace</span>
              </Link>
              <h2>Therapist Sign In</h2>
              <p>Sign in to your practitioner portal</p>
            </div>

            {errors.global && (
              <div className="therapy-alert-banner" role="alert">
                {errors.global}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="therapy-card-form">
              {/* Email */}
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <div className="input-icon-wrapper">
                  <FiMail className="field-icon-left" />
                  <input 
                    type="email" 
                    id="email" 
                    name="email"
                    className={`therapy-input ${errors.email ? 'input-error' : ''}`}
                    value={form.email} 
                    onChange={handleChange}
                    placeholder="therapist@headspace.co.ke"
                    required
                    autoFocus
                  />
                </div>
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="phoneNumber">Registered Phone Number</label>
                <PhoneInput
                  id="phoneNumber"
                  name="phoneNumber"
                  countryCode={countryCode}
                  onCountryChange={setCountryCode}
                  value={form.phoneNumber}
                  onChange={handleChange}
                  hasError={Boolean(errors.phoneNumber)}
                  required
                />
                {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
              </div>




              {/* Options: Remember me & Forgot password */}
              <div className="therapy-options-row">
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
              
              {/* Submit */}
              <button type="submit" className="therapy-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in as Therapist'}
              </button>    
            </form>

            <div className="therapy-card-footer">
              Want to join our practitioner network? <Link to="/Therapist-apply" className="apply-link">Apply here</Link>
            </div>
          </div>

          <div className="therapy-version-footer">
            <span>Version 1.0.0</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default TherapyLogin;