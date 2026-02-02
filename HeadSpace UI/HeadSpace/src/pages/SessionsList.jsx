// SessionsList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import {Api_Base} from './Api'  
import { useAuth } from '../contexts/AuthContext';

function SessionsList() {
  const [sessions, setSessions] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/chat/sessions/');
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const openChat = (sessionId) => {
    navigate(`/chat/${sessionId}`);
  };

  return (
    <div className="sessions-list">
      <h2>Your Sessions</h2>
      {sessions.length === 0 ? (
        <p>No active sessions</p>
      ) : (
        <ul>
          {sessions.map((session) => (
            <li key={session.id} onClick={() => openChat(session.id)}>
              <div>
                <strong>Session #{session.id}</strong>
                <p>
                  {user.userType === 'patient' 
                    ? `Dr. ${session.therapist__user__first_name} ${session.therapist__user__last_name}`
                    : `${session.patient__user__first_name} ${session.patient__user__last_name}`
                  }
                </p>
                <small>{new Date(session.created_at).toLocaleDateString()}</small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SessionsList;