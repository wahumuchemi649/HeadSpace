import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import "./Chat.css";

export default function Messages() {
  const { sessionId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const ws = useRef(null);

  /* ---------------------------
     Load initial messages
  ---------------------------- */
  useEffect(() => {
    if (!sessionId) return;

    fetch(`http://localhost:8000/chat/${sessionId}/messages/`, {
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
     WebSocket connection - only for RECEIVING messages
  ---------------------------- */
  useEffect(() => {
    if (!sessionId) return;

    console.log("Connecting to WebSocket...");
    ws.current = new WebSocket(`ws://localhost:8000/ws/chat/${sessionId}/`);

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

    fetch(`http://localhost:8000/chat/${sessionId}/send/`, {
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
    </div>
  );
}