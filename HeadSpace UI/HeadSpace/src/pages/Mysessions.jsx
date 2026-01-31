import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './Mysessions.css'
import { MdRadioButtonChecked } from "react-icons/md"
import { AiFillDashboard } from 'react-icons/ai'
import { FiCalendar, FiTrendingUp, FiHome } from 'react-icons/fi'
import { AiFillMessage } from 'react-icons/ai'
import { Link } from "react-router-dom";

export default function MySessions() {
  console.log("MySessions component rendering");
  const [sessions, setSessions] = useState(null);
  const navigate = useNavigate();

  console.log("Current sessions state:", sessions);

  useEffect(() => {
    console.log("useEffect running - about to fetch");
    fetch(`http://localhost:8000/chat/my_sessions/`, {
      credentials: "include",
    })
      .then(res => {
        console.log("Response status:", res.status);
        if (res.status === 304) return [];
        if (!res.ok) throw new Error("Failed to load sessions");
        return res.json();
      })
      .then(data => {
        console.log("Data received from backend:", data);
        console.log("About to setSessions with:", data);
        setSessions(data);
        console.log("setSessions called");
      })
      .catch(err => console.error("Error:", err));
  }, []);
  const handleSessionClick = (session) => {
    // ✅ Check if session is expired
    if (session.is_expired) {
      alert("This session has expired. Please book a new session to continue.");
      return;
    }

    // ✅ Check if session can be accessed yet
    if (!session.can_access) {
      alert("This session hasn't started yet. Please wait until the scheduled time.");
      return;
    }

    // Navigate to chat room
    navigate(`/chatRoom/${session.id}`);
  };

  console.log("Right before return, sessions is:", sessions);

  return (
    <div className="sessions-container">
      <MdRadioButtonChecked className='logo' size={80} color='#3d1d77'/>
      <h1>HeadSpace</h1>
      <h5>Your Mental Wellness Companion</h5>
        <aside className='aside'>
    
    <Link to="/Dashboard" className="aside-link">
    <p><AiFillDashboard size={40} color='#555'/>Dashboard</p>
    </Link>
     <Link to="/MySessions" className="aside-link">
    <p><FiCalendar size={40} color='#555' />My Sessions</p>
  </Link>
    <p><FiTrendingUp size={40} color='#555'/>Progress</p>
    <p><FiHome size={40} color='#555'/>Community</p>
    <p><AiFillMessage size={40} color='#555' />Messages</p>

  </aside>
      <main>
<h2>My Sessions</h2>

      {sessions === null && <p>Loading sessions...</p>}

      {sessions && sessions.length === 0 && <p>No sessions booked yet</p>}

      {sessions && sessions.length > 0 && (
        <ul>
          {sessions.map((s) => {
            console.log("Rendering session:", s);
            const isDisabled = s.is_expired || !s.can_access;
            const cardClass = `session-item ${isDisabled ? 'disabled' : ''}`;
            return (
              <li
                key={s.id}
                className={cardClass}
                onClick={() => !isDisabled && handleSessionClick(s)}
                style={{
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.6 : 1
                }}
              >
                <div className="session-header">
                  <strong>{s.other_party}</strong>
                  {s.is_expired && (
                    <span className="expired-badge">EXPIRED</span>
                  )}
                  {s.status === 'scheduled' && !s.is_expired && (
                    <span className="upcoming-badge">UPCOMING</span>
                  )}
                </div>

                <div className="session-message">
                  {s.last_message}
                </div>

                {s.is_expired && (
                  <button 
                    className="renew-button"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      navigate('/session');
                    }}
                  >
                    Book New Session
                  </button>
                )}

                {s.unread_count > 0 && !s.is_expired && (
                  <span className="unread-badge">{s.unread_count} new</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      </main>
      
    </div>
  );
}