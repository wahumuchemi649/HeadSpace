import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Chat.css";
import { Api_Base } from './Api';
import { WS_BASE } from './Api';

export default function Messages() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const ws = useRef(null);
  const saveTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  /* ---------------------------
     Scroll to bottom when messages change
  ---------------------------- */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /* ---------------------------
     Check session access
  ---------------------------- */
  useEffect(() => {
    if (!sessionId) return;

    const token = localStorage.getItem('access_token');
    
    if (!token) {
      navigate('/Login');
      return;
    }

    fetch(`${Api_Base}chat/${sessionId}/check-access/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.clear();
          navigate('/Login');
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then((data) => {
        if (!data.can_access) {
          alert(data.message || "This session is not accessible.");
          navigate('/MySessions');
        }
      })
      .catch((err) => {
        console.error("Access check error:", err);
        if (err.message === 'Unauthorized') {
          navigate('/Login');
        }
      });
  }, [sessionId, navigate]);

  /* ---------------------------
     Load messages
  ---------------------------- */
  useEffect(() => {
    if (!sessionId) return;

    const token = localStorage.getItem('access_token');
    const url = `${Api_Base}/chat/${sessionId}/messages/?show_all=${showAllHistory}`;

    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.clear();
          navigate('/Login');
          throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error("Failed to load messages");
        return res.json();
      })
      .then((data) => {
        /*console.log('Messages loaded:', data);*/
        setMessages(data.messages || []);
      })
      .catch((err) => {
        console.error("Load messages error:", err);
      });
  }, [sessionId, showAllHistory, navigate]);

  /* ---------------------------
     Load notes
  ---------------------------- */
  useEffect(() => {
    if (!sessionId) return;

    const token = localStorage.getItem('access_token');

    fetch(`${Api_Base}/chat/${sessionId}/notes/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.clear();
          navigate('/Login');
          throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error("Failed to load notes");
        return res.json();
      })
      .then((data) => {
        setNotes(data.content || "");
        setLastSaved(data.updated_at ? new Date(data.updated_at) : null);
      })
      .catch((err) => {
        console.error("Load notes error:", err);
      });
  }, [sessionId, navigate]);

  /* ---------------------------
     Auto-save notes (debounced)
  ---------------------------- */
  const saveNotes = (content) => {
    setIsSaving(true);
    const token = localStorage.getItem('access_token');

    fetch(`${Api_Base}/chat/${sessionId}/notes/save/`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content }),
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.clear();
          navigate('/Login');
          throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error("Failed to save notes");
        return res.json();
      })
      .then((data) => {
        setLastSaved(new Date(data.updated_at));
        setIsSaving(false);
      })
      .catch((err) => {
        console.error("❌ Save notes failed:", err);
        setIsSaving(false);
      });
  };

  const handleNotesChange = (e) => {
    const newContent = e.target.value;
    setNotes(newContent);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveNotes(newContent);
    }, 1000);
  };

  /* ---------------------------
     WebSocket connection
  ---------------------------- */
  useEffect(() => {
    if (!sessionId) return;

    const token = localStorage.getItem('access_token');
    
    /*console.log("Connecting to WebSocket...");*/
    ws.current = new WebSocket(`${WS_BASE}/ws/chat/${sessionId}/?token=${token}`);

    ws.current.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    ws.current.onmessage = (event) => {
      /*console.log("📨 Received:", event.data);*/
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message') {
       /* console.log("Adding message to state:", data.message);*/
        setMessages((prev) => [
          ...prev, 
          {
            type: 'message',
            ...data.message
          }
        ]);
      }
    };

    ws.current.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [sessionId]);

  /* ---------------------------
     Send message via HTTP POST
  ---------------------------- */
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    /*console.log("Sending message:", newMessage);*/
    const token = localStorage.getItem('access_token');

    fetch(`${Api_Base}/chat/${sessionId}/send/`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: newMessage }),
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.clear();
          navigate('/Login');
          throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error("Failed to send message");
        /*console.log("✅ Message sent successfully");*/
        setNewMessage("");
      })
      .catch((err) => {
        console.error("❌ Send failed:", err);
        if (err.message === 'Unauthorized') {
          navigate('/Login');
        }
      });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="messages-container">
      <div className="chat-window">
        {/* Chat Header with Toggle */}
        <div className="chat-header">
          <h3>Therapy Session Chat</h3>
          <label className="history-toggle">
            <input
              type="checkbox"
              checked={showAllHistory}
              onChange={(e) => setShowAllHistory(e.target.checked)}
            />
            <span>Show full conversation history</span>
          </label>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <p className="empty-state">No messages yet</p>
          )}

          {messages.map((item, index) => {
            // Render session markers
            if (item.type === 'session_marker') {
              return (
                <div key={`marker-${item.session_id}`} className="session-separator">
                  <span className="session-date">
                    📅 Session on {formatDate(item.session_date)} at {item.session_time}
                  </span>
                </div>
              );
            }

            // Render regular messages
            return (
              <div
                key={`msg-${item.id}`}
                className={`message ${
                  item.sender_type === "patient"
                    ? "message-sent"
                    : "message-received"
                }`}
              >
                <p>{item.message}</p>
                <span className="message-time">
                  {new Date(item.created_at).toLocaleTimeString()}
                </span>
              </div>
            );
          })}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>

      {/* Notepad Section */}
      <div className="notepad-section">
        <div className="notepad-header">
          <h3>Personal Notes</h3>
          <span className="save-status">
            {isSaving ? (
              "Saving..."
            ) : lastSaved ? (
              `Saved ${lastSaved.toLocaleTimeString()}`
            ) : (
              "Not saved yet"
            )}
          </span>
        </div>
        <textarea
          className="notepad-textarea"
          value={notes}
          onChange={handleNotesChange}
          placeholder="Write your personal notes here... (auto-saves)"
        />
      </div>
    </div>
  );
}