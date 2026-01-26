import { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom"; // Fixed import
import {format} from 'date-fns';
import { MdPeople,MdDashboard,MdCalendarToday, MdMessage, MdNote, MdLogout } from "react-icons/md";
import { FiCalendar } from "react-icons/fi";
import './TherapyDashboard.css';
import { Link } from "react-router-dom";

function SessionsList() {
   const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    useEffect(() => {
  const fetchSession = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/sessions/", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      console.log("Latest session:", data);

      // TODO: set state here e.g.
      // setSession(data);

    } catch (error) {
      console.error("Error fetching latest session:", error);
    }
  };

  fetchSession();
}, []);   
  if (loading) return <p>Loading sessions...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (sessions.length === 0) return <p>No upcoming sessions</p>;

  return (
    <div className="therapist-sessions-list">
      {sessions.map((s) => (
        <div key={s.id} className="session-card">
          <p>
            <strong>Patient:</strong> {s.patient_name}
          </p>
          <p>
            <strong>Date:</strong> {new Date(s.time).toLocaleString()}
          </p>
          <Link to={`/chat/${s.id}`}>Chat</Link>
        </div>
      ))}
    </div>
  );
}
function Cards({ title, numbers, description}) {
    return(
        <div className="cards">
            <h6>{title}</h6>
            <h1>{numbers}</h1>
            <p>{description}</p>
        </div>
    )
}

    function TherapyDashboard() {
    const [user, setUser] = useState(null)
    const now = new Date();
    

    const [stats, setStats] = useState({
        todaysSessions: 0,
        totalClients: 0,
        unreadMessages: 0
    });

    useEffect(() => {
        fetch("http://localhost:8000/dashboard/",{
            method: "GET",
            credentials: "include",
        })
        .then(res =>{
            if(!res.ok) throw new Error("Network response was not ok")
            return res.json()
        })
        .then(data =>{
            setUser(data);
            console.log("Dashboard data:", data);
            // Changed from data.stats to data.stat (singular)
            if(data.stat){
                setStats(data.stat);
            }
        })
        .catch(err => console.log(err))
    }, []); 

    if(!user) return <p>loading ....</p>
    
    return(
        <>
        <div className="container">
            <aside className='therapyaside'>
                <h2>Therapy Dashboard</h2>
                <ul>
                   
                   <li><Link to="/therapysessions" className="aside-link">
                       <p><MdDashboard size={20} />Dashboard</p>
                     </Link> </li>                 
                   <li><Link to="/therapymessages" className="aside-link">
                       <p><MdPeople size={20} />Patients</p>
                     </Link></li>
                   
                   <li>
                    <Link to="/ThSessions" className="aside-link">
                       <p><FiCalendar size={20} />My Sessions</p>
                     </Link>
                   </li>
                  
                   <li><MdNote size={20}/><Link to="/notes">Notes</Link></li>
                    <br/>
                    <br/>
                    <li><MdLogout size={20}/><Link to="#">Logout</Link></li>  
                </ul>
            </aside>
            <main>
                <h1>Welcome Dr. {user.FirstName || user.userName}</h1>
                <p>{format(now, "EEEE, MMMM do yyyy, h:mm:ss a")}</p>

                <div className="updates">
                    <Cards
                        title="Today's Sessions"
                        numbers={stats.todaysSessions}
                        description="Number of sessions scheduled for today"
                    />
                    <Cards
                        title="Total Patients"
                        numbers={stats.totalClients}
                        description="Total number of patients under your care"
                    />
                    <Cards
                        title="Unread Messages"
                        numbers={stats.unreadMessages}
                        description="Messages from patients awaiting your response"
                    />
                </div>

                <div className="mainCards">
                    <div>
                        <h2>Upcoming Sessions</h2>
                        <SessionsList />

                    </div>
                    <div>
                        <h2>Recent Activities</h2>
                    </div>
                </div>
            </main>
        </div>
        </>
    )
}
export default TherapyDashboard;