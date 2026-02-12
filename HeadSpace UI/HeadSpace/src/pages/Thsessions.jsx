import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import './Mysessions.css';
import { Api_Base } from './Api';
import { AiFillDashboard } from "react-icons/ai";
import { FiCalendar } from "react-icons/fi";
import { MdRadioButtonChecked } from "react-icons/md";

function TherapistAvailability() {
  const [grid, setGrid] = useState([]);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGrid();
  }, []);

  const fetchGrid = () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      navigate('/TherapyLogin');
      return;
    }

    fetch(`${Api_Base}/therapist/availability/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.clear();
          navigate('/TherapyLogin');
          throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error("Failed to load availability");
        return res.json();
      })
      .then((data) => {
        setGrid(data.grid);
        setDays(data.days);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setLoading(false);
      });
  };

  const toggleSlot = (dayOfWeek, timeSlot, isBooked) => {
    if (isBooked) {
      return;
    }

    const token = localStorage.getItem('access_token');

    fetch(`${Api_Base}/therapist/availability/toggle/`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        day_of_week: dayOfWeek,
        time_slot: timeSlot,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.error || "Failed to toggle");
          });
        }
        return res.json();
      })
      .then(() => {
        fetchGrid();
      })
      .catch((err) => {
        console.error("Toggle error:", err);
      });
  };

  if (loading) {
    return <div className="loading">Loading your schedule...</div>;
  }

  return (
    <div className="availability-container">
      <div className="availability-header">
        <h2>My Availability Schedule</h2>
        <h4>Let patients know when you're available</h4>
        <div className="legend">
          <span className="legend-item">
            <span className="dot available"></span> Available (Click to turn off)
          </span>
          <span className="legend-item">
            <span className="dot booked"></span> Booked (Cannot change)
          </span>
          <span className="legend-item">
            <span className="dot unavailable"></span> Unavailable (Click to turn on)
          </span>
        </div>
      </div>

      <div className="availability-grid">
        <table>
          <thead>
            <tr>
              <th className="time-column">Time</th>
              {days.map((day, index) => (
                <th key={index}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="time-column">
                  <strong>{row.time_display}</strong>
                </td>
                {row.slots.map((slot, colIndex) => {
                  let cellClass = "slot ";
                  let cellText = "";
                  let isClickable = true;

                  if (slot.is_booked) {
                    cellClass += "booked";
                    cellText = "BOOKED";
                    isClickable = false;
                  } else if (slot.is_available) {
                    cellClass += "available";
                    cellText = "Available";
                  } else {
                    cellClass += "unavailable";
                    cellText = "Off";
                  }

                  return (
                    <td
                      key={colIndex}
                      className={cellClass}
                      onClick={() =>
                        isClickable && toggleSlot(slot.day, row.time, slot.is_booked)
                      }
                      style={{
                        cursor: isClickable ? "pointer" : "not-allowed",
                      }}
                      title={
                        slot.is_booked
                          ? "This slot is booked by a patient"
                          : slot.is_available
                          ? "Click to mark as unavailable"
                          : "Click to mark as available"
                      }
                    >
                      {cellText}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="availability-footer">
        <p>
          💡 <strong>Tip:</strong> Click Available slots to turn them off, or
          click Unavailable slots to turn them on. Booked slots are locked and
          cannot be changed.
        </p>
      </div>
    </div>
  );
}

export default function ThSessions() {
  const [patientSessions, setPatientSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      navigate('/TherapyLogin');
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
          navigate('/TherapyLogin');
          throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error("Failed to load sessions");
        return res.json();
      })
      .then(data => {
        // Group sessions by patient
        const grouped = groupSessionsByPatient(data);
        setPatientSessions(grouped);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, [navigate]);

const groupSessionsByPatient = (sessions) => {
  const grouped = {};

  sessions.forEach(session => {
    const patientName = session.other_party;
    
    if (!grouped[patientName]) {
      grouped[patientName] = {
        patientName,
        sessions: [],
        activeSession: null,
        upcomingSessions: [],
        completedCount: 0,
        hasExpired: false
      };
    }

    // ✅ Count as completed if expired OR status is completed
    const isCompleted = session.is_expired || session.status === 'completed';
    
    if (isCompleted) {
      grouped[patientName].completedCount++;
      grouped[patientName].hasExpired = true;
    } else if (session.can_access) {
      // Active session (can access now)
      if (!grouped[patientName].activeSession) {
        grouped[patientName].activeSession = session;
      }
    } else {
      // Upcoming session (scheduled but not yet accessible)
      grouped[patientName].upcomingSessions.push(session);
    }

    grouped[patientName].sessions.push(session);
  });

  // Convert to array and sort
  const result = Object.values(grouped);

  // Sort by priority: Active > Upcoming > Expired
  result.sort((a, b) => {
    if (a.activeSession && !b.activeSession) return -1;
    if (!a.activeSession && b.activeSession) return 1;
    
    if (a.upcomingSessions.length && !b.upcomingSessions.length) return -1;
    if (!a.upcomingSessions.length && b.upcomingSessions.length) return 1;
    
    return 0;
  });

  return result;
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
      // Sort by session date
      const sortedUpcoming = [...group.upcomingSessions].sort((a, b) => {
        return new Date(a.session_date) - new Date(b.session_date);
      });
      
      const nextSession = sortedUpcoming[0];
      const nextDate = nextSession.session_date 
        ? new Date(nextSession.session_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        : 'Scheduled';
      
      return {
        type: 'upcoming',
        label: `Next: ${nextDate}`,
        session: nextSession,
        remainingCount: group.upcomingSessions.length,
        sortedSessions: sortedUpcoming
      };
    }

    if (group.hasExpired) {
      return {
        type: 'expired',
        label: 'Sessions completed',
        session: null
      };
    }

    return {
      type: 'none',
      label: 'No active sessions',
      session: null
    };
  };

  const handleSessionClick = (session) => {
    if (session.is_expired) {
      alert("This session has expired.");
      return;
    }

    if (!session.can_access) {
      alert("This session hasn't started yet. Please wait until the scheduled time.");
      return;
    }

    navigate(`/chatRoom/${session.id}`);
  };

  return (
    <div className="sessions-container">
      <header className="header">
        <MdRadioButtonChecked className='logo' size={80} color='#3d1d77'/>
        <h1>HeadSpace</h1>
      </header>
      
      <aside className="aside">
        <Link to="/Therapydashboard" className="aside-link">
          <p>
            <AiFillDashboard size={40} color="#555" />Dashboard
          </p>
        </Link>
        <Link to="/ThSessions" className="aside-link">
          <p>
            <FiCalendar size={40} color="#555" /> My Sessions
          </p>
        </Link>
      </aside>
      
      <main>
        <div className="sessions-header">
          <h2>My Patient Sessions</h2>
        </div>

        {loading && <p>Loading sessions...</p>}

        {!loading && patientSessions.length === 0 && (
          <div className="no-sessions">
            <p>No patient sessions yet</p>
            <p className="info-text">Sessions will appear here once patients book with you</p>
          </div>
        )}

        {!loading && patientSessions.length > 0 && (
          <div className="therapist-sessions-list">
            {patientSessions.map((group, index) => {
              const status = getSessionStatus(group);
              
              return (
                <div key={index} className={`therapist-card ${status.type}`}>
                  <div className="therapist-header">
                    <div className="therapist-info">
                      <h3>{group.patientName}</h3>
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
                    <span>📅 {group.sessions.length} total sessions</span>
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
                            alert(`You have ${status.remainingCount} upcoming sessions with ${group.patientName}`);
                          }}
                        >
                          View Schedule ({status.remainingCount})
                        </button>
                        {status.session.last_message && (
                          <button 
                            className="view-chat-btn"
                            onClick={() => navigate(`/chatRoom/${status.session.id}`)}
                          >
                            View Conversation History
                          </button>
                        )}
                      </>
                    )}

                    {status.type === 'expired' && (
                      <div className="expired-info">
                        <p>All sessions with this patient have been completed.</p>
                        {status.session && (
                          <button 
                            className="view-chat-btn"
                            onClick={() => navigate(`/chatRoom/${status.session.id}`)}
                          >
                            View Past Conversations
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expandable session list */}
                  {status.type === 'upcoming' && status.sortedSessions && status.sortedSessions.length > 0 && (
                    <details className="session-details">
                      <summary>
                        View all {status.sortedSessions.length} upcoming sessions
                      </summary>
                      <ul className="upcoming-list">
                        {status.sortedSessions.map(session => {
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
        
        <hr style={{ margin: '40px 0', border: 'none', borderTop: '2px solid #e0e0e0' }} />
        
        <TherapistAvailability />
      </main>
    </div>
  );
}