import { useEffect, useState } from "react";
import {Link, useNavigate } from "react-router-dom";
import './Mysessions.css'
import { AiFillDashboard } from "react-icons/ai";
import { FiCalendar } from "react-icons/fi";
import { MdRadioButtonChecked } from "react-icons/md";

function TherapistAvailability() {
  const [grid, setGrid] = useState([]);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load availability grid
  useEffect(() => {
    fetchGrid();
  }, []);

  const fetchGrid = () => {
    fetch("http://localhost:8000/therapist/availability/", {
      credentials: "include",
    })
      .then((res) => {
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

  // Toggle slot availability
  const toggleSlot = (dayOfWeek, timeSlot, isBooked) => {
    // Don't do anything if slot is booked
    if (isBooked) {
      return; // ← Just return, no alert, no action
    }

    fetch("http://localhost:8000/therapist/availability/toggle/", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
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
        // Refresh grid
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
                    isClickable = false; // ← Mark as not clickable
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

  console.log("Right before return, sessions is:", sessions);

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


  return (
    <div className="sessions-container">
      <div className="ThHeader">
      <MdRadioButtonChecked className='logo' size={80} color='#3d1d77'/>
      <h1>HeadSpace</h1>
      </div>
      <MdRadioButtonChecked className='logo' size={80} color='#3d1d77'/>
      <h1>HeadSpace</h1>
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
                      navigate('/booking');
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
      <hr />
      <TherapistAvailability />
      </main>
      
    </div>
    
  );
}