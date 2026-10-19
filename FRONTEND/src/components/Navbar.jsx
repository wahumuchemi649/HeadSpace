import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MdRadioButtonChecked } from 'react-icons/md';
import { 
  FiPhoneCall, 
  FiChevronDown, 
  FiUser, 
  FiLogOut, 
  FiCalendar, 
  FiMessageSquare, 
  FiShield, 
  FiSettings, 
  FiHome
} from 'react-icons/fi';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  const [authState, setAuthState] = useState({
    token: null,
    user: null,
    userType: null,
    userName: ''
  });

  const portalsRef = useRef(null);
  const userRef = useRef(null);

  // Exclude public navbar on domain admin portal routes
  const isAdminRoute = 
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/SuperAdmin') ||
    location.pathname.startsWith('/Org') ||
    location.pathname.startsWith('/PlatformAnalytics');

  // Sync auth state from localStorage on load and location change
  useEffect(() => {
    if (isAdminRoute) return;

    const token = localStorage.getItem('access_token');
    let userType = localStorage.getItem('user_type');
    let user = null;
    let userName = localStorage.getItem('user_name') || '';

    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        user = JSON.parse(userStr);
        if (!userName && user) {
          userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email;
        }
      }
    } catch {
      user = null;
    }

    // Infer userType if logged in but user_type key is missing
    if (token && !userType) {
      const path = location.pathname;
      if (path.startsWith('/Therapy') || path.startsWith('/ThSessions')) {
        userType = 'therapist';
      } else {
        userType = 'patient';
      }
    }

    setAuthState({ token, user, userType, userName });

    // Close menus on page transition
    setMobileOpen(false);
    setPortalsOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname, isAdminRoute]);

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (portalsRef.current && !portalsRef.current.contains(event.target)) {
        setPortalsOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Do not render consumer navbar inside dedicated domain admin portal
  if (isAdminRoute) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_name');
    
    setAuthState({ token: null, user: null, userType: null, userName: '' });
    setUserDropdownOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.toLowerCase().startsWith(path.toLowerCase());
  };

  const { token, user, userType, userName } = authState;

  // Determine home link depending on role
  const getHomeLink = () => {
    if (!token) return '/';
    if (userType === 'therapist') return '/Therapydashboard';
    return '/Dashboard';
  };

  // User initials for avatar
  const getInitials = () => {
    if (userName) {
      const parts = userName.split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (user?.firstName) {
      return `${user.firstName[0]}${user.lastName ? user.lastName[0] : ''}`.toUpperCase();
    }
    return 'HS';
  };

  return (
    <nav className="headspace-navbar">
      <div className="headspace-navbar-inner">
        {/* Left: Brand & Role Tag */}
        <div className="nav-brand-section">
          <Link to={getHomeLink()} className="nav-brand-link">
            <MdRadioButtonChecked className="nav-brand-icon" size={32} color="#025492" />
            <span className="nav-brand-title">HeadSpace</span>
          </Link>
          {token && userType && (
            <span className={`nav-role-tag ${userType === 'patient' ? 'client' : userType}`}>
              {userType === 'patient' && 'Client'}
              {userType === 'therapist' && 'Therapist'}
            </span>
          )}
        </div>

        {/* Center: Concise, Non-Redundant Head Menu */}
        <ul className="nav-center-menu">
          {/* Guest / Public Navigation - Clean and Short */}
          {!token && (
            <>
              <li>
                <Link to="/" className={`nav-menu-link ${isActive('/') ? 'active' : ''}`}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/session" className={`nav-menu-link ${isActive('/session') ? 'active' : ''}`}>
                  Therapists
                </Link>
              </li>
              <li>
                <Link to="/CommunityList" className={`nav-menu-link ${isActive('/CommunityList') || isActive('/community') ? 'active' : ''}`}>
                  Community
                </Link>
              </li>
              <li>
                <Link to="/Therapist-apply" className={`nav-menu-link ${isActive('/Therapist-apply') ? 'active' : ''}`}>
                  Join Network
                </Link>
              </li>
            </>
          )}

          {/* Client / Patient Navigation - Concise Head Menu */}
          {token && userType === 'patient' && (
            <>
              <li>
                <Link to="/Dashboard" className={`nav-menu-link ${isActive('/Dashboard') ? 'active' : ''}`}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/session" className={`nav-menu-link ${isActive('/session') ? 'active' : ''}`}>
                  Book Session
                </Link>
              </li>
              <li>
                <Link to="/MySessions" className={`nav-menu-link ${isActive('/MySessions') ? 'active' : ''}`}>
                  My Sessions
                </Link>
              </li>
              <li>
                <Link to="/CommunityList" className={`nav-menu-link ${isActive('/CommunityList') || isActive('/community') ? 'active' : ''}`}>
                  Community
                </Link>
              </li>
            </>
          )}

          {/* Therapist Navigation - Concise Head Menu */}
          {token && userType === 'therapist' && (
            <>
              <li>
                <Link to="/Therapydashboard" className={`nav-menu-link ${isActive('/Therapydashboard') ? 'active' : ''}`}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/ThSessions" className={`nav-menu-link ${isActive('/ThSessions') ? 'active' : ''}`}>
                  Sessions
                </Link>
              </li>
              <li>
                <Link to="/TherapistPricing" className={`nav-menu-link ${isActive('/TherapistPricing') ? 'active' : ''}`}>
                  Rates
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* Right: Actions / Auth / Dedicated 24/7 Crisis Access */}
        <div className="nav-right-actions">
          {/* Dedicated 24/7 Crisis Hotline Button (Unique single emergency lifeline) */}
          <Link to="/Crisis" className="nav-emergency-btn" title="24/7 Immediate Crisis Support">
            <FiPhoneCall size={14} />
            <span>24/7 Crisis</span>
          </Link>

          {/* Unauthenticated Actions */}
          {!token ? (
            <>
              {/* Portals Switcher */}
              <div className="nav-dropdown-wrapper" ref={portalsRef}>
                <button 
                  type="button"
                  className={`nav-dropdown-trigger ${portalsOpen ? 'open' : ''}`}
                  onClick={() => setPortalsOpen(!portalsOpen)}
                  aria-expanded={portalsOpen}
                >
                  <span>Portals</span>
                  <FiChevronDown size={14} />
                </button>

                {portalsOpen && (
                  <div className="nav-dropdown-menu">
                    <Link to="/Login?role=client" className="nav-dropdown-item" onClick={() => setPortalsOpen(false)}>
                      <FiUser size={15} color="#025492" /> Client Portal
                    </Link>
                    <Link to="/Login?role=therapist" className="nav-dropdown-item" onClick={() => setPortalsOpen(false)}>
                      <FiShield size={15} color="#025492" /> Therapist Portal
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/Login" className="nav-signin-link">Sign in</Link>
              <Link to="/signIn" className="nav-primary-cta">Get Started</Link>
            </>
          ) : (
            /* Authenticated User Menu */
            <div className="nav-dropdown-wrapper" ref={userRef}>
              <button 
                type="button"
                className={`nav-user-pill ${userDropdownOpen ? 'open' : ''}`}
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-expanded={userDropdownOpen}
              >
                <div className="nav-user-avatar">
                  {getInitials()}
                </div>
                <span className="nav-user-name">
                  {userName || (user?.firstName ? user.firstName : 'Account')}
                </span>
                <FiChevronDown size={14} />
              </button>

              {userDropdownOpen && (
                <div className="nav-dropdown-menu">
                  <div className="nav-dropdown-header">
                    <p>{userName || 'User'}</p>
                    <span>{user?.email || (userType ? `${userType} account` : 'Online')}</span>
                  </div>

                  {userType === 'patient' && (
                    <>
                      <Link to="/Dashboard" className="nav-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <FiHome size={15} /> Dashboard
                      </Link>
                      <Link to="/MySessions" className="nav-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <FiCalendar size={15} /> My Sessions
                      </Link>
                    </>
                  )}

                  {userType === 'therapist' && (
                    <>
                      <Link to="/Therapydashboard" className="nav-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <FiHome size={15} /> Dashboard
                      </Link>
                      <Link to="/ThSessions" className="nav-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <FiCalendar size={15} /> Client Sessions
                      </Link>
                      <Link to="/TherapistPricing" className="nav-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <FiSettings size={15} /> Manage Rates
                      </Link>
                    </>
                  )}

                  <div className="nav-dropdown-divider"></div>
                  <button type="button" className="nav-logout-btn" onClick={handleLogout}>
                    <FiLogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button 
            type="button"
            className={`nav-hamburger-btn ${mobileOpen ? 'open' : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <div 
        className={`nav-mobile-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      ></div>

      {/* Mobile Drawer Content */}
      <div className={`nav-mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        <ul className="nav-mobile-links">
          {!token ? (
            <>
              <li>
                <Link to="/" className={`nav-menu-link ${isActive('/') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/session" className={`nav-menu-link ${isActive('/session') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                  Therapists
                </Link>
              </li>
              <li>
                <Link to="/CommunityList" className={`nav-menu-link ${isActive('/CommunityList') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                  Community
                </Link>
              </li>
              <li>
                <Link to="/Therapist-apply" className={`nav-menu-link ${isActive('/Therapist-apply') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                  Join Network
                </Link>
              </li>
            </>
          ) : (
            <>
              {userType === 'patient' && (
                <>
                  <li>
                    <Link to="/Dashboard" className="nav-menu-link" onClick={() => setMobileOpen(false)}>
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to="/session" className="nav-menu-link" onClick={() => setMobileOpen(false)}>
                      Book Session
                    </Link>
                  </li>
                  <li>
                    <Link to="/MySessions" className="nav-menu-link" onClick={() => setMobileOpen(false)}>
                      My Sessions
                    </Link>
                  </li>
                  <li>
                    <Link to="/CommunityList" className="nav-menu-link" onClick={() => setMobileOpen(false)}>
                      Community
                    </Link>
                  </li>
                </>
              )}

              {userType === 'therapist' && (
                <>
                  <li>
                    <Link to="/Therapydashboard" className="nav-menu-link" onClick={() => setMobileOpen(false)}>
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to="/ThSessions" className="nav-menu-link" onClick={() => setMobileOpen(false)}>
                      Sessions
                    </Link>
                  </li>
                  <li>
                    <Link to="/TherapistPricing" className="nav-menu-link" onClick={() => setMobileOpen(false)}>
                      Rates
                    </Link>
                  </li>
                </>
              )}
            </>
          )}
        </ul>

        {/* Mobile Action Buttons */}
        <div className="nav-mobile-actions">
          <Link to="/Crisis" className="nav-emergency-btn" onClick={() => setMobileOpen(false)}>
            <FiPhoneCall size={15} /> 24/7 Crisis Hotline
          </Link>
          {!token ? (
            <>
              <Link to="/Login?role=client" className="nav-signin-link" onClick={() => setMobileOpen(false)}>
                Client Sign In
              </Link>
              <Link to="/Login?role=therapist" className="nav-signin-link" onClick={() => setMobileOpen(false)}>
                Therapist Sign In
              </Link>
              <Link to="/signIn" className="nav-primary-cta" onClick={() => setMobileOpen(false)}>
                Get Started Free
              </Link>
            </>
          ) : (
            <button type="button" className="nav-logout-btn" onClick={handleLogout}>
              <FiLogOut size={16} /> Sign out ({userName || 'User'})
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
