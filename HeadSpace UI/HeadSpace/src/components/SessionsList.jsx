import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { MessageCircle, Calendar, User } from 'lucide-react';
import './SessionsList.css';

/* Shows all the sessions of a user in a grid format */

function SessionsList({ onSelectSession }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        'http://127.0.0.1:8000/chat/user-sessions/',
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setSessions(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="sessions-list">
        <div className="loading">Loading sessions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sessions-list">
        <div className="error">{error}</div>
        <button onClick={fetchSessions}>Retry</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="sessions-list">
        <div className="info">Please log in to view sessions</div>
      </div>
    );
  }

  return (
    <div className="sessions-list">
      <div className="sessions-header">
        <h2>My Sessions</h2>
        <span className="sessions-count">{sessions.length} sessions</span>
      </div>

      {sessions.length === 0 ? (
        <div className="no-sessions">
          <MessageCircle size={48} />
          <p>No sessions yet</p>
          <small>Your therapy sessions will appear here</small>
        </div>
      ) : (
        <div className="sessions-grid">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`session-card ${session.is_active ? 'active' : 'inactive'}`}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="session-status">
                <span className={`status-badge ${session.is_active ? 'active' : 'inactive'}`}>
                  {session.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="session-info">
                <div className="session-participant">
                  <User size={20} />
                  <span>
                    {user.user_type === 'patient' 
                      ? session.therapist_name 
                      : session.patient_name}
                  </span>
                </div>

                <div className="session-date">
                  <Calendar size={16} />
                  <span>{new Date(session.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="session-action">
                <MessageCircle size={20} />
                <span>Open Chat</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SessionsList;