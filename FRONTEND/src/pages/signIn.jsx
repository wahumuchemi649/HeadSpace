import { useState } from "react";
import { Api_Base } from "./Api";
import './SignIn.css';
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaEyeSlash, FaEye } from "react-icons/fa";
import { FiMail, FiLock, FiUser } from "react-icons/fi";
import { MdRadioButtonChecked } from "react-icons/md";
import { Calendar } from "lucide-react";
import PhoneInput from "../components/PhoneInput";
import { formatDigitsPhone } from "../utils/countryCodes";
import { validateEmail, validatePhone, validateName, validatePassword } from "../utils/validators";



function SignIn() {
  const Navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '';
  const actionParam = searchParams.get('action') || '';
  const isBookingRedirect = actionParam === 'book' || redirectParam.includes('session');

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    password: ""
  });
  const [countryCode, setCountryCode] = useState('+254');
  const [errors, setErrors] = useState({});

  const [touch, setTouch] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function validateField(name, value, currentCode = countryCode) {
    if (name === "firstName") return validateName(value, "First name");
    if (name === "lastName") return validateName(value, "Last name");
    if (name === "phoneNumber") return validatePhone(value, currentCode);
    if (name === "email") return validateEmail(value);
    if (name === "password") return validatePassword(value, 6);
    return "";
  }

  function handleSignin(e) {
    const { name, value, type, checked, files } = e.target;
    const newValue =
      type === "checkbox" ? checked : type === "file" ? files[0] : value;

    setForm((prev) => ({ ...prev, [name]: newValue }));

    if (touch[name]) {
      const err = validateField(name, newValue);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    setTouch((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  }

  function handleCountryChange(newCode) {
    setCountryCode(newCode);
    if (touch.phoneNumber || form.phoneNumber) {
      setErrors((prev) => ({
        ...prev,
        phoneNumber: validatePhone(form.phoneNumber, newCode)
      }));
    }
  }

  function validateAll(values) {
    const e = {};
    Object.keys(values).forEach((k) => {
      const msg = validateField(k, values[k]);
      if (msg) e[k] = msg;
    });
    return e;
  }


  function handleSubmit(e) {
    e.preventDefault();

    const eobj = validateAll(form);
    setErrors(eobj);
    setTouch(Object.keys(form).reduce((acc, k) => ({ ...acc, [k]: true }), {}));

    if (Object.keys(eobj).length > 0) {
      const first = Object.keys(eobj)[0];
      const el = document.querySelector(`[name="${first}"]`);
      if (el) el.focus();
      return;
    }

    submitToServer();
  }

  async function submitToServer() {
    const server = Api_Base;
    setSubmitting(true);
    try {
      // Clean phone number with selected country dial code
      const cleanPhone = formatDigitsPhone(countryCode, form.phoneNumber);
      const payload = {
        ...form,
        phoneNumber: cleanPhone
      };


      const res = await fetch(`${server}/api/patient/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
          const first = Object.keys(data.errors)[0];
          const el = document.querySelector(`[name="${first}"]`);
          if (el) el.focus();
        } else {
          setErrors((prev) => ({
            ...prev,
            _global: data.message || "Registration failed. Please check your details."
          }));
        }
      } else {
        const nextLoginUrl = redirectParam 
          ? `/Login?redirect=${encodeURIComponent(redirectParam)}&action=book&registered=true`
          : '/Login?registered=true';
        Navigate(nextLoginUrl);
        setForm({ firstName: "", lastName: "", phoneNumber: "", email: "", password: "" });
        setTouch({});
        setErrors({});
      }
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({
        ...prev,
        _global: "Network error — please try again"
      }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="signin-page-layout">
      {/* LEFT PANE - Clean branding & imagery (Matching Image 2) */}
      <div className="signin-left-pane">
        <div className="signin-left-content">
          <Link to="/" className="signin-brand-link">
            <MdRadioButtonChecked className="signin-brand-icon" size={42} color="#025492" />
            <span className="signin-brand-text">HeadSpace</span>
          </Link>

          <div className="signin-hero-text">
            <h1>Take charge of your mental health with HeadSpace</h1>
            <p>
              HeadSpace simplifies your journey to healing, connects you with licensed therapists,
              and helps you track your wellness progress in a safe, confidential space.
            </p>
          </div>

          <div className="signin-hero-image-wrap">
            <img src="/header.png" alt="HeadSpace Mental Wellness" className="signin-hero-image" />
          </div>
        </div>
      </div>

      {/* RIGHT PANE - Clean registration form (Matching Image 2) */}
      <div className="signin-right-pane">
        <div className="signin-form-card">
          <div className="signin-header">
            <h2>Create Your Account</h2>
            <p>Enter your details below to register with HeadSpace</p>
          </div>

          {/* Booking Prompt Alert: Shown when user clicked "Book a Session" */}
          {isBookingRedirect && (
            <div className="booking-redirect-alert">
              <Calendar className="booking-alert-icon" size={22} />
              <div className="booking-alert-content">
                <h4>Sign up to book a session</h4>
                <p>Create your free client account to schedule an appointment with a verified therapist.</p>
                <div className="booking-alert-cta-wrap">
                  <span>Already have an account?</span>
                  <Link 
                    to={`/Login?redirect=${encodeURIComponent(redirectParam || '/session')}&action=book`} 
                    className="booking-alert-link"
                  >
                    Log in to book a session &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}

          {errors._global && (
            <div className="signin-alert-banner" role="alert">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <span>{errors._global}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="clean-signin-form">
            {/* NAME FIELDS */}
            <div className="form-row-two-col">
              <div className="form-field-group">
                <label htmlFor="firstName">First name</label>
                <div className="input-icon-wrapper">
                  <FiUser className="field-icon-left" />
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className={`clean-input has-icon ${touch.firstName && errors.firstName ? 'input-error' : ''}`}
                    value={form.firstName}
                    onChange={handleSignin}
                    onBlur={handleBlur}
                    placeholder="First name"
                    required
                  />
                </div>
                {touch.firstName && errors.firstName && (
                  <span className="field-error-text">{errors.firstName}</span>
                )}
              </div>

              <div className="form-field-group">
                <label htmlFor="lastName">Last name</label>
                <div className="input-icon-wrapper">
                  <FiUser className="field-icon-left" />
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className={`clean-input has-icon ${touch.lastName && errors.lastName ? 'input-error' : ''}`}
                    value={form.lastName}
                    onChange={handleSignin}
                    onBlur={handleBlur}
                    placeholder="Last name"
                    required
                  />
                </div>
                {touch.lastName && errors.lastName && (
                  <span className="field-error-text">{errors.lastName}</span>
                )}
              </div>
            </div>

            {/* PHONE NUMBER FIELD WITH COUNTRY DROPDOWN */}
            <div className="form-field-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <PhoneInput
                id="phoneNumber"
                name="phoneNumber"
                countryCode={countryCode}
                onCountryChange={handleCountryChange}
                value={form.phoneNumber}

                onChange={handleSignin}
                onBlur={handleBlur}
                hasError={Boolean(touch.phoneNumber && errors.phoneNumber)}
                required
              />

              {touch.phoneNumber && errors.phoneNumber && (
                <span className="field-error-text">{errors.phoneNumber}</span>
              )}
            </div>

            {/* EMAIL FIELD */}
            <div className="form-field-group">
              <label htmlFor="email">Email</label>
              <div className="input-icon-wrapper">
                <FiMail className="field-icon-left" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`clean-input has-icon ${touch.email && errors.email ? 'input-error' : ''}`}
                  value={form.email}
                  onChange={handleSignin}
                  onBlur={handleBlur}
                  placeholder="you@company.com"
                  required
                />
              </div>
              {touch.email && errors.email && (
                <span className="field-error-text">{errors.email}</span>
              )}
            </div>

            {/* PASSWORD FIELD WITH EYE TOGGLE */}
            <div className="form-field-group">
              <label htmlFor="password">Password</label>
              <div className={`clean-password-wrapper ${touch.password && errors.password ? 'input-error' : ''}`}>
                <FiLock className="field-icon-left" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className="clean-password-input has-icon"
                  value={form.password}
                  onChange={handleSignin}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="clean-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
              {touch.password && errors.password && (
                <span className="field-error-text">{errors.password}</span>
              )}
            </div>

            {/* INFO NOTICE BANNER (Matching Image 2) */}
            <div className="signin-info-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span>A confirmation code or notification will be sent to the provided details.</span>
            </div>

            {/* SUBMIT BUTTON */}
            <button type="submit" className="signin-submit-btn" disabled={submitting}>
              {submitting ? (
                <span className="signin-spinner-wrap">
                  <span className="signin-btn-spinner"></span> Creating account...
                </span>
              ) : (
                isBookingRedirect ? "Sign Up & Continue to Booking" : "Create Account"
              )}
            </button>
          </form>

          {/* FOOTER LINK */}
          <div className="signin-card-footer">
            Already have an account?{" "}
            <Link 
              to={isBookingRedirect 
                ? `/Login?redirect=${encodeURIComponent(redirectParam || '/session')}&action=book` 
                : "/Login"} 
              className="signin-login-link"
            >
              {isBookingRedirect ? "Log in to book a session" : "Log in"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
