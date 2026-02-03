import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Chat.css";
import {Api_Base} from './Api'
import {WS_BASE } from './Api';

export default function Messages() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const ws = useRef(null);
  const saveTimeoutRef = useRef(null);
  /* ---------------------------
     Load initial messages
  ---------------------------- */
  // In chatRoom.jsx, add this check at the top

useEffect(() => {
  if (!sessionId) return;

  // Check if session is accessible
  fetch(` ${Api_Base}chat/${sessionId}/check-access/`, {
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data.can_access) {
        alert(data.message || "This session is not accessible.");
        navigate('/my-sessions');
      }
    })
    .catch(console.error);
}, [sessionId, navigate]);

  useEffect(() => {
    if (!sessionId) return;

    fetch(`${Api_Base}chat/${sessionId}/messages/`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load messages");
        return res.json();
      })
      .then((data) => setMessages(data.messages || []))
      .catch(console.error);
  }, [sessionId]);

  /* ---------------------------
     Load notes
  ---------------------------- */
  useEffect(() => {
    if (!sessionId) return;

    fetch(`${Api_Base}chat/${sessionId}/notes/`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load notes");
        return res.json();
      })
      .then((data) => {
        setNotes(data.content || "");
        setLastSaved(data.updated_at ? new Date(data.updated_at) : null);
      })
      .catch(console.error);
  }, [sessionId]);

  /* ---------------------------
     Auto-save notes (debounced)
  ---------------------------- */
  const saveNotes = (content) => {
    setIsSaving(true);

    fetch(`${Api_Base}chat/${sessionId}/notes/save/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
      .then((res) => {
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

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (1 second after typing stops)
    saveTimeoutRef.current = setTimeout(() => {
      saveNotes(newContent);
    }, 1000);
  };

  /* ---------------------------
     WebSocket connection - only for RECEIVING messages
  ---------------------------- */
  useEffect(() => {
    if (!sessionId) return;

    console.log("Connecting to WebSocket...");
    ws.current = new WebSocket(`${WS_BASE}ws/chat/${sessionId}/`);

    ws.current.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    ws.current.onmessage = (event) => {
      console.log("📨 Received:", event.data);
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message') {
        console.log("Adding message to state:", data.message);
        setMessages((prev) => [...prev, data.message]);
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

    console.log("Sending message:", newMessage);

    fetch(`${Api_Base}chat/${sessionId}/send/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: newMessage }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to send message");
        console.log("✅ Message sent successfully");
        setNewMessage("");
        // Message will appear via WebSocket broadcast
      })
      .catch((err) => {
        console.error("❌ Send failed:", err);
      });
  };

  return (
    <div className="messages-container">
      <div className="chat-window">
        <div className="chat-messages">
          {messages.length === 0 && (
            <p className="empty-state">No messages yet</p>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`message ${
                m.sender_type === "patient"
                  ? "message-sent"
                  : "message-received"
              }`}
            >
              <p>{m.message}</p>
              <span className="message-time">
                {new Date(m.created_at).toLocaleTimeString()}
              </span>
            </div>
          ))}
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