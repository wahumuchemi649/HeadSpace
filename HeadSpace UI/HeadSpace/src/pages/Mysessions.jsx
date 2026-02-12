import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './Mysessions.css'
import { Api_Base } from './Api'
import { MdRadioButtonChecked } from "react-icons/md"
import { AiFillDashboard } from 'react-icons/ai'
import { FiCalendar, FiTrendingUp, FiHome } from 'react-icons/fi'
import { AiFillMessage } from 'react-icons/ai'
import { Link } from "react-router-dom";

export default function MySessions() {
  const [therapistSessions, setTherapistSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      navigate('/Login');
      return;
    }

    fetch(`${Api_Base}/chat/my_sessions/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.clear();
          navigate('/Login');
          throw new Error('Unauthorized');
        }
        
        if (!res.ok) throw new Error("Failed to load sessions");
        return res.json();
      })
      .then(data => {
        // Group sessions by therapist
        const grouped = groupSessionsByTherapist(data);
        setTherapistSessions(grouped);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setLoading(false);
        if (err.message === 'Unauthorized') {
          navigate('/Login');
        }
      });
  }, [navigate]);

  const groupSessionsByTherapist = (sessions) => {
  const grouped = {};

  sessions.forEach(session => {
    const therapistName = session.other_party;
    
    if (!grouped[therapistName]) {
      grouped[therapistName] = {
        therapistName,
        sessions: [],
        activeSession: null,
        upcomingSessions: [],
        completedCount: 0,
        hasExpired: false
      };
    }

    // Categorize the session
    if (session.is_expired) {
      grouped[therapistName].hasExpired = true;
      // ✅ Count expired sessions as completed
      grouped[therapistName].completedCount++;
    } else if (session.can_access) {
      // Active session (can access now)
      if (!grouped[therapistName].activeSession) {
        grouped[therapistName].activeSession = session;
      }
    } else {
      // Upcoming session
      grouped[therapistName].upcomingSessions.push(session);
    }

    // ✅ Also count sessions marked as 'completed' in the database
    if (session.status === 'completed' && !session.is_expired) {
      grouped[therapistName].completedCount++;
    }

    grouped[therapistName].sessions.push(session);
  });

  // Convert to array and sort
  const result = Object.values(grouped);

  // Sort by priority
  result.sort((a, b) => {
    if (a.activeSession && !b.activeSession) return -1;
    if (!a.activeSession && b.activeSession) return 1;
    
    if (a.upcomingSessions.length && !b.upcomingSessions.length) return -1;
    if (!a.upcomingSessions.length && b.upcomingSessions.length) return 1;
    
    return 0;
  });

  return result;
};

  const handleSessionClick = (session) => {
    if (session.is_expired) {
      alert("This session has expired. Please book a new session to continue.");
      return;
    }

    if (!session.can_access) {
      alert("This session hasn't started yet. Please wait until the scheduled time.");
      return;
    }

    navigate(`/chatRoom/${session.id}`);
  };

  const getSessionStatus = (group) => {
    if (group.activeSession) {
      return {
        type: 'active',
        label: 'Active Now',
        session: group.activeSession
      };
    }

    if (group.upcomingSessions.length > 0) {
      // Get the nearest upcoming session
      const nextSession = group.upcomingSessions[0];
      return {
        type: 'upcoming',
        label: `Next: ${new Date(nextSession.created_at).toLocaleDateString()}`,
        session: nextSession,
        remainingCount: group.upcomingSessions.length
      };
    }

    if (group.hasExpired) {
      return {
        type: 'expired',
        label: 'All sessions completed',
        session: null
      };
    }

    return {
      type: 'none',
      label: 'No active sessions',
      session: null
    };
  };

  if (loading) {
    return (
      <div className="sessions-container">
        <header className='header'>
          <MdRadioButtonChecked className='logo' size={80} color='#3d1d77'/>
          <h1>HeadSpace</h1>
        </header>
        <main>
          <p>Loading sessions...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="sessions-container">
      <header className='header'>
        <MdRadioButtonChecked className='logo' size={80} color='#3d1d77'/>
        <h1>HeadSpace</h1>
      </header>
      
      <aside className='aside'>
        <Link to="/Dashboard" className="aside-link">
          <p><AiFillDashboard size={40} color='#555'/>Dashboard</p>
        </Link>
        <Link to="/MySessions" className="aside-link">
          <p><FiCalendar size={40} color='#555' />My Sessions</p>
        </Link>
        <Link to="/CommunityList" className="aside-link">
          <p><FiHome size={40} color='#555'/>Community</p>
        </Link>
        <p><FiTrendingUp size={40} color='#555'/>Progress</p>
        <p><AiFillMessage size={40} color='#555' />Messages</p>
      </aside>
      
      <main>
        <div className="sessions-header">
          <h2>My Therapy Sessions</h2>
          <button 
            className="book-new-btn"
            onClick={() => navigate('/session')}
          >
            + Book New Session
          </button>
        </div>

        {therapistSessions.length === 0 ? (
          <div className="no-sessions">
            <p>No sessions booked yet</p>
            <button onClick={() => navigate('/session')}>Book Your First Session</button>
          </div>
        ) : (
          <div className="therapist-sessions-list">
            {therapistSessions.map((group, index) => {
              const status = getSessionStatus(group);
              
              return (
                <div key={index} className={`therapist-card ${status.type}`}>
                  <div className="therapist-header">
                    <div className="therapist-info">
                      <h3>Dr. {group.therapistName}</h3>
                      <span className={`status-badge ${status.type}`}>
                        {status.label}
                      </span>
                    </div>

                    {status.type === 'upcoming' && status.remainingCount > 1 && (
                      <span className="session-count">
                        {status.remainingCount} upcoming sessions
                      </span>
                    )}
                  </div>

                  <div className="session-stats">
                    <span>📊 {group.completedCount} completed</span>
                    <span>📅 {group.sessions.length} total booked</span>
                  </div>

                  {/* Last message preview */}
                  {status.session?.last_message && (
                    <div className="message-preview">
                      <p>{status.session.last_message}</p>
                      {status.session.unread_count > 0 && (
                        <span className="unread-badge">
                          {status.session.unread_count} new
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="card-actions">
                    {status.type === 'active' && (
                      <button 
                        className="join-btn"
                        onClick={() => handleSessionClick(status.session)}
                      >
                        Join Session
                      </button>
                    )}

                    {status.type === 'upcoming' && (
                      <>
                        <button 
                          className="view-upcoming-btn"
                          onClick={() => {
                            // Show upcoming sessions modal or navigate to details
                            alert(`You have ${status.remainingCount} upcoming sessions scheduled`);
                          }}
                        >
                          View Schedule
                        </button>
                        {status.session.last_message && (
                          <button 
                            className="view-chat-btn"
                            onClick={() => navigate(`/chatRoom/${status.session.id}`)}
                          >
                            View Past Conversations
                          </button>
                        )}
                      </>
                    )}

                    {status.type === 'expired' && (
                      <button 
                        className="book-again-btn"
                        onClick={() => navigate('/session')}
                      >
                        Book New Session
                      </button>
                    )}
                  </div>

                 {/* Expandable session list */}
{group.upcomingSessions.length > 0 && (
  <details className="session-details">
    <summary>
      View all {group.upcomingSessions.length} upcoming sessions
    </summary>
    <ul className="upcoming-list">
      {group.upcomingSessions.map(session => {
        // ✅ Use session_date instead of day
        const sessionDate = session.session_date 
          ? new Date(session.session_date).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          : 'Date pending';
        
        return (
          <li key={session.id}>
            <span className="session-date">
              📅 {sessionDate} {session.session_time && `at ${session.session_time}`}
            </span>
            <span className={`session-status ${session.status}`}>
              {session.status}
            </span>
          </li>
        );
      })}
    </ul>
  </details>
)}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}