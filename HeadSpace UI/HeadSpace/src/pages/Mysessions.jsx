import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './Mysessions.css'

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

  console.log("Right before return, sessions is:", sessions);

  return (
    <div className="sessions-container">
      <h2>My Sessions</h2>

      {sessions === null && <p>Loading sessions...</p>}

      {sessions && sessions.length === 0 && <p>No sessions booked yet</p>}

      {sessions && sessions.length > 0 && (
        <ul>
          {sessions.map((s) => {
            console.log("Rendering session:", s);
            return (
              <li
                key={s.id}
                className="session-item"
                onClick={() => navigate(`/chatRoom/${s.id}`)}
              >
                <strong>{s.other_party}</strong> -{" "}
                {s.last_message || "No messages yet"}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}