import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';
import { Send } from 'lucide-react';
import api from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { useParams } from 'react-router-dom';

function Chat() {
  const {sessionId}=useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  {/*const { user } = useAuth();*/}
     const numericId = sessionId ? parseInt(sessionId, 10) : null;
   if (isNaN(numericId)) {
     console.error('Invalid sessionId');
     // Handle error - redirect or show error message
   }
  const user = localStorage.getItem("userEmail");
  const messagesEndRef = useRef(null);

  console.log('Chat component rendered with:', { sessionId, user }); // Debug log

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    console.log('Fetch effect triggered:', { sessionId, user }); // Debug log
    
    if (sessionId && user) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [sessionId, user]);

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for session:', sessionId); // Debug log
      const response = await api.get(`/chat/messages/${sessionId}/`);
      console.log('Messages fetched:', response.data); // Debug log
      setMessages(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again.');
    }
  };

  const handleSend = async () => {
    if (input.trim() && !loading) {
      setLoading(true);
      
      try {
        const response = await api.post(`/chat/messages/${sessionId}/`, {
          content: input,
        });
        
        setMessages([...messages, response.data]);
        setInput('');
        setError(null);
      } catch (err) {
        console.error('Error sending message:', err);
        const errorMsg = err.response?.data?.detail || 
                        err.response?.data?.error || 
                        'Failed to send message';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isMyMessage = (msg) => {
    if (!user) return false;
    
    if (user.userType === 'patient' || user.user_type === 'patient') {
      return msg.sender === (user.patient_id || user.id);
    } else if (user.userType === 'therapist' || user.user_type === 'therapist') {
      return msg.therapist === (user.therapist_id || user.id);
    }
    return false;
  };

  // Loading state
  if (!user) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading user information...</p>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>No session selected</p>
      </div>
    );
  }

  return (
    <div className="chat-wrapper">
      <header className='chatHeader'>
        <h1>SECURE CONVERSATION</h1>
        <p>Session #{sessionId} - {user.user_type || user.userType}</p>
      </header>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="chatRoom">
        {messages.length === 0 && !loading && (
          <div className="no-messages">
            No messages yet. Start the conversation!
          </div>
        )}
        
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`message ${isMyMessage(msg) ? 'sent' : 'received'}`}
          >
            <div className="message-header">
              <strong>{msg.sender_name || 'Unknown'}</strong>
              <span className={`badge ${msg.sender_type || 'unknown'}`}>
                {msg.sender_type || 'unknown'}
              </span>
            </div>
            <div className="message-content">{msg.content}</div>
            <div className="message-time">
              {new Date(msg.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatInput">
        <input
          type="text"
          placeholder="Type your message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={loading}
        />
        <button 
          onClick={handleSend} 
          disabled={loading || !input.trim()}
          className="send-button"
        >
          <Send className="sendarrow" size={20} />
        </button>
      </div>
    </div>
  );
}

export default Chat;