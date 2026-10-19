import { Link } from "react-router-dom";
import './landing.css';
import { 
  Calendar, 
  TrendingUp, 
  ShieldCheck, 
  MessageCircle, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Heart, 
  Sparkles, 
  Star, 
  User, 
  Stethoscope,
  Mail, 
  Phone, 
  MapPin 
} from 'lucide-react';
import { MdRadioButtonChecked } from "react-icons/md";

function Landing() {
  const token = localStorage.getItem('access_token');
  const bookSessionLink = token ? "/session" : "/Login?redirect=/session&action=book";

  return (
    <div className="landing-page">
      {/* ---------------- HERO SECTION ---------------- */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={15} className="hero-badge-icon" />
              <span>Compassionate, Confidential Healthcare in Kenya</span>
            </div>

            <h1 className="hero-title">
              Take Charge of Your Well-Being with <span className="highlight-text">HeadSpace</span>
            </h1>

            <p className="hero-description">
              HeadSpace simplifies therapy booking, mental health tracking, and professional consultation.
              Seamlessly connect with licensed therapists, track your progress, and access confidential care
              on our user-friendly digital platform.
            </p>

            <div className="hero-cta-group">
              <Link to={bookSessionLink} className="btn-primary-pill">
                <span>Book a Session</span>
                <ArrowRight size={17} />
              </Link>
              <Link to="/SignIn" className="btn-outline-pill">
                Get Started Free
              </Link>
            </div>

            <div className="hero-stats-row">
              <div className="hero-stat-item">
                <span className="hero-stat-number">50+</span>
                <span className="hero-stat-label">Certified Therapists</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat-item">
                <span className="hero-stat-number">10k+</span>
                <span className="hero-stat-label">Sessions Completed</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat-item">
                <span className="hero-stat-number">100%</span>
                <span className="hero-stat-label">Confidential & Safe</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-wrapper">
              <img 
                src="/header.png" 
                alt="HeadSpace Healthcare Support" 
                className="hero-main-image"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              
              {/* Floating Status Pill 1 */}
              <div className="floating-card top-float">
                <div className="float-icon-bubble green">
                  <CheckCircle2 size={18} />
                </div>
                <div className="float-text">
                  <strong>Dr. Dan Muchemi</strong>
                  <span>Confirmed • 2:00 PM Today</span>
                </div>
              </div>

              {/* Floating Status Pill 2 */}
              <div className="floating-card bottom-float">
                <div className="float-icon-bubble blue">
                  <Star size={18} />
                </div>
                <div className="float-text">
                  <strong>4.9 / 5 Rating</strong>
                  <span>Trusted by thousands</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- SERVICES / WHY CHOOSE US (IMAGE 3 & 4 SHOWCASE) ---------------- */}
      <section className="services-section">
        <div className="services-header">
          <span className="section-kicker">Our Comprehensive Services</span>
          <h2>Everything You Need for Lasting Mental Health</h2>
          <p className="services-subtext">
            Designed for convenience, absolute privacy, and structured healing support tailored to your journey.
          </p>
        </div>

        <div className="services-showcase-container">
          
          {/* Feature 1: Schedule Appointments (from Image 3) */}
          <div className="service-block">
            <div className="service-visual">
              <div className="mockup-card calendar-mockup">
                <div className="mockup-header">
                  <div className="mockup-badge">
                    <Calendar size={14} />
                    <span>Booking Schedule</span>
                  </div>
                  <span className="live-tag">Online & In-Person</span>
                </div>

                <div className="mockup-appointment-item pending">
                  <div className="mockup-doc-avatar">DN</div>
                  <div className="mockup-doc-info">
                    <strong>Dr. Dan Muchemi</strong>
                    <span>Clinical Psychologist • 2:00 PM</span>
                  </div>
                  <span className="status-pill pending">Pending</span>
                </div>

                <div className="mockup-appointment-item confirmed">
                  <div className="mockup-doc-avatar blue">SW</div>
                  <div className="mockup-doc-info">
                    <strong>Dr. Sarah Wahu</strong>
                    <span>Trauma & Stress Specialist • 4:00 PM</span>
                  </div>
                  <span className="status-pill confirmed">Confirmed</span>
                </div>

                <div className="mockup-appointment-item complete">
                  <div className="mockup-doc-avatar green">JM</div>
                  <div className="mockup-doc-info">
                    <strong>Dr. John Mwangi</strong>
                    <span>Couples & Family • Yesterday</span>
                  </div>
                  <span className="status-pill complete">Complete</span>
                </div>
              </div>
            </div>

            <div className="service-text">
              <div className="service-icon-badge">
                <Calendar size={28} />
              </div>
              <h3>Schedule Appointments</h3>
              <p className="service-lead">
                Manage your schedule effortlessly with HeadSpace. Book appointments, get real-time confirmations
                from licensed therapists, and receive reminders so you never miss a visit. Stay organized and on
                top of your mental healthcare with ease.
              </p>
              <ul className="service-feature-list">
                <li>
                  <CheckCircle2 size={16} className="feature-check" />
                  <span>Flexible 45 & 60-minute sessions tailored to your needs</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="feature-check" />
                  <span>Instant slot booking with live calendar availability</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="feature-check" />
                  <span>Automated notifications and straightforward rescheduling</span>
                </li>
              </ul>
              <Link to={bookSessionLink} className="service-action-link">
                <span>Explore Availability & Book</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Feature 2: Track Progress & Health Profile (from Image 3) */}
          <div className="service-block reversed">
            <div className="service-visual">
              <div className="mockup-card profile-mockup">
                <div className="mockup-header">
                  <div className="mockup-badge">
                    <Heart size={14} />
                    <span>Wellness Profile</span>
                  </div>
                  <span className="metric-tag">+34% Progress</span>
                </div>

                <div className="profile-patient-row">
                  <div className="patient-avatar-circle">
                    <User size={26} color="#025492" />
                  </div>
                  <div>
                    <h4 className="patient-name">Patient Health Dashboard</h4>
                    <span className="patient-status">Active Therapy Track</span>
                  </div>
                </div>

                <div className="wellness-stats-grid">
                  <div className="wellness-stat-card">
                    <span className="wellness-stat-title">Current Mood</span>
                    <strong className="wellness-stat-value">Calm & Hopeful</strong>
                    <span className="wellness-stat-sub">Logged today at 9:00 AM</span>
                  </div>
                  <div className="wellness-stat-card">
                    <span className="wellness-stat-title">Session Streak</span>
                    <strong className="wellness-stat-value">4 Weeks</strong>
                    <span className="wellness-stat-sub">On target</span>
                  </div>
                </div>

                <div className="progress-bar-container">
                  <div className="progress-bar-header">
                    <span>Overall Recovery Index</span>
                    <strong>82%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: '82%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="service-text">
              <div className="service-icon-badge">
                <TrendingUp size={28} />
              </div>
              <h3>Manage Your Health Profile</h3>
              <p className="service-lead">
                Monitor your healing journey with detailed analytics, mood tracking, and personalized insights.
                Log your daily state of mind, review notes from your therapist, and observe measurable improvements
                as you work toward mental wellness.
              </p>
              <ul className="service-feature-list">
                <li>
                  <CheckCircle2 size={16} className="feature-check" />
                  <span>Daily mood check-ins and reflection logging</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="feature-check" />
                  <span>Personalized progress graphs and recovery metrics</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="feature-check" />
                  <span>Accessible health summary for you and your care team</span>
                </li>
              </ul>
              <Link to="/Dashboard" className="service-action-link">
                <span>View Dashboard Insights</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Feature 3: Secure & Confidential Conversations */}
          <div className="service-block">
            <div className="service-visual">
              <div className="mockup-card chat-mockup">
                <div className="mockup-header">
                  <div className="mockup-badge">
                    <ShieldCheck size={14} />
                    <span>End-to-End Encrypted</span>
                  </div>
                  <span className="secure-badge">256-Bit SSL</span>
                </div>

                <div className="chat-bubble-stream">
                  <div className="chat-bubble client">
                    <p>I was feeling overwhelmed with work this week, but our previous breathing exercises really helped.</p>
                    <span className="chat-time">10:14 AM</span>
                  </div>

                  <div className="chat-bubble therapist">
                    <div className="therapist-name-tag">Dr. Dan Muchemi</div>
                    <p>That is tremendous progress! Let's build upon those grounding techniques during our session today.</p>
                    <span className="chat-time">10:16 AM</span>
                  </div>
                </div>

                <div className="mockup-footer-note">
                  <ShieldCheck size={14} color="#00a859" />
                  <span>Your conversations are 100% confidential and private.</span>
                </div>
              </div>
            </div>

            <div className="service-text">
              <div className="service-icon-badge">
                <ShieldCheck size={28} />
              </div>
              <h3>Complete Privacy & Security</h3>
              <p className="service-lead">
                Engage in confidential chats with licensed therapists in a safe, encrypted environment.
                Your personal health data, communications, and session history are protected with industry-leading
                safeguards in full alignment with medical privacy standards.
              </p>
              <ul className="service-feature-list">
                <li>
                  <CheckCircle2 size={16} className="feature-check" />
                  <span>Zero unauthorized third-party data tracking or access</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="feature-check" />
                  <span>Strict patient-therapist confidentiality protocols</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="feature-check" />
                  <span>Secure multi-factor access control</span>
                </li>
              </ul>
              <Link to={bookSessionLink} className="service-action-link">
                <span>Start Confidential Consultation</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Feature 4: Supportive Community Circles */}
          <div className="service-block reversed">
            <div className="service-visual">
              <div className="mockup-card community-mockup">
                <div className="mockup-header">
                  <div className="mockup-badge">
                    <Users size={14} />
                    <span>Peer Circles</span>
                  </div>
                  <span className="members-count">480+ Members Active</span>
                </div>

                <div className="community-topic-card">
                  <span className="topic-pill">Anxiety & Mindfulness</span>
                  <h4>5 Grounding Techniques for Daily Calm</h4>
                  <p>Sharing our favorite routines to center ourselves before busy mornings...</p>
                  <div className="community-stats-row">
                    <span>💬 38 replies</span>
                    <span>💙 124 supportive reactions</span>
                  </div>
                </div>

                <div className="community-topic-card secondary">
                  <span className="topic-pill green">Academic & Career Growth</span>
                  <h4>Overcoming Burnout as Young Professionals</h4>
                  <p>Practical tips on boundary setting with work and school commitments...</p>
                </div>
              </div>
            </div>

            <div className="service-text">
              <div className="service-icon-badge">
                <Users size={28} />
              </div>
              <h3>Supportive Community Circles</h3>
              <p className="service-lead">
                You never have to heal in isolation. Join supportive, moderated peer circles centered around
                stress management, grief, relationships, and self-esteem. Connect with others walking similar paths
                in a compassionate, welcoming space.
              </p>
              <ul className="service-feature-list">
                <li>
                  <CheckCircle2 size={16} className="feature-check" />
                  <span>Topic-oriented discussion circles led by community facilitators</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="feature-check" />
                  <span>Safe, positive environment free of judgment</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="feature-check" />
                  <span>Optional anonymity to protect your peace of mind</span>
                </li>
              </ul>
              <Link to="/CommunityList" className="service-action-link">
                <span>Join Community Circles</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ---------------- PORTALS ACCESS SECTION ---------------- */}
      <section id="yourportal" className="portals-section">
        <div className="portals-header">
          <span className="section-kicker">Choose Your Pathway</span>
          <h2>Access Your Dedicated Portal</h2>
          <p className="portals-subtext">
            Select your entry point to manage appointments, access clinical tools, and support your well-being.
          </p>
        </div>

        <div className="portals-grid">
          {/* Client Portal */}
          <div className="portal-card">
            <div className="portal-icon-box">
              <User size={36} />
            </div>
            <h3>Client Portal</h3>
            <p className="portal-description">
              Access personalized therapy sessions, track your emotional progress, connect with licensed therapists,
              and manage your confidential health notes.
            </p>
            <div className="portal-action-group">
              <Link to="/Login?role=client" className="portal-btn-primary">
                Client Sign In
              </Link>
              <div className="portal-sub-link">
                <span>New patient?</span>
                <Link to="/SignIn">Create Free Account</Link>
              </div>
            </div>
          </div>

          {/* Therapist Portal */}
          <div className="portal-card highlight">
            <div className="portal-icon-box blue">
              <Stethoscope size={36} />
            </div>
            <h3>Therapist Portal</h3>
            <p className="portal-description">
              Manage client appointments, maintain clinical session notes, set your availability schedule,
              and deliver impactful mental healthcare across Kenya.
            </p>
            <div className="portal-action-group">
              <Link to="/Login?role=therapist" className="portal-btn-primary">
                Therapist Sign In
              </Link>
              <div className="portal-sub-link">
                <span>Licensed practitioner?</span>
                <Link to="/Therapist-apply">Apply to Join Network</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <MdRadioButtonChecked size={28} color="#025492" />
              <span className="footer-brand-title">HeadSpace</span>
            </div>
            <p className="footer-tagline">
              Connecting patients with qualified, compassionate therapists for lasting mental healthcare outcomes in Kenya.
            </p>
            <div className="footer-trust-badge">
              <ShieldCheck size={16} color="#00a859" />
              <span>Certified Healthcare Platform</span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Quick Navigation</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to={bookSessionLink}>Find a Therapist</Link></li>
              <li><Link to="/CommunityList">Community Circles</Link></li>
              <li><Link to="/Therapist-apply">Join Practitioner Network</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Portals & Care</h4>
            <ul className="footer-links">
              <li><Link to="/Login?role=client">Client Portal Sign In</Link></li>
              <li><Link to="/Login?role=therapist">Therapist Portal</Link></li>
              <li><Link to="/SignIn">Create New Account</Link></li>
              <li><Link to="/Crisis" className="footer-crisis-link">24/7 Crisis Hotline</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Contact & Support</h4>
            <div className="footer-contact-item">
              <Mail size={16} />
              <span>support@headspace.co.ke</span>
            </div>
            <div className="footer-contact-item">
              <Phone size={16} />
              <span>+254 757 438 047</span>
            </div>
            <div className="footer-contact-item">
              <MapPin size={16} />
              <span>Nairobi & Kisii, Kenya</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p>© 2026 HeadSpace Healthcare Kenya. All rights reserved.</p>
          <p className="confidentiality-notice">
            Your mental health matters. Confidential, secure, and compassionate care.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;