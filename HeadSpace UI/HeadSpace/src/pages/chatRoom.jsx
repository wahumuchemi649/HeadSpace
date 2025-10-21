import React, { useEffect, useState } from "react";

function Chat({ sessionId, senderId, therapistId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!sessionId) return; // 👈 Don’t open socket if sessionId doesn’t exist

    const newSocket = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${sessionId}/`);
    setSocket(newSocket);

    newSocket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMessages((prev) => [...prev, data]);
    };

    newSocket.onclose = () => console.log("WebSocket closed");
    newSocket.onerror = (err) => console.error("WebSocket error:", err);

    // Cleanup when component unmounts
    return () => newSocket.close();
  }, [sessionId]); // 👈 Re-run only when sessionId changes

  const sendMessage = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(
      JSON.stringify({
        message: input,
        sender_id: senderId,
        therapist_id: therapistId,
      })
    );
    setInput("");
  };

  return (
    <div>
      <h2>Chat with Therapist</h2>
      <div
        style={{
          border: "1px solid #ccc",
          height: "300px",
          overflowY: "scroll",
          padding: "10px",
        }}
      >
        {messages.map((msg, i) => (
          <p key={i}>
            <b>{msg.sender_id === senderId ? "You" : "Therapist"}:</b>{" "}
            {msg.message}
          </p>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Chat;
