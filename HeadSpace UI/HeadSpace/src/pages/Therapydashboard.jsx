import { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom"; // Fixed import
import {format} from 'date-fns';
import { MdPeople,MdDashboard, MdNote, MdLogout } from "react-icons/md";
import { FiCalendar } from "react-icons/fi";
import Api_Base from './Api'
import './Therapydashboard.css';
import { Link } from "react-router-dom";
function UpcomingSessions() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userType, setUserType] = useState(null);

    useEffect(() => {
        fetchUpcomingSessions();
    }, []);

    const fetchUpcomingSessions = async () => {
        try {
            const res = await fetch(`${Api_Base}upcoming-sessions/`, {
                credentials: 'include'
            });

            if (!res.ok) {
                throw new Error('Failed to fetch sessions');
            }

            const data = await res.json();
            console.log('Upcoming sessions data:', data); // ✅ Debug log
            
            // ✅ Add defensive checks
            setSessions(data.upcoming_sessions || []);
            setUserType(data.user_type);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching sessions:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            today.setHours(0, 0, 0, 0);
            tomorrow.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);

            if (date.getTime() === today.getTime()) {
                return 'Today';
            } else if (date.getTime() === tomorrow.getTime()) {
                return 'Tomorrow';
            } else {
                return date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                });
            }
        } catch (err) {
            console.error('Date formatting error:', err);
            return dateStr;
        }
    };

    const getCategoryLabel = (category) => {
        if (!category) return 'General';
        return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    // ✅ Show error state
    if (error) {
        return (
            <div className="error-state">
                <p>Error: {error}</p>
                <button onClick={fetchUpcomingSessions}>Try Again</button>
            </div>
        );
    }

    if (loading) {
        return <div className="loading">Loading your sessions...</div>;
    }

    if (!sessions || sessions.length === 0) {
        return (
            <div className="no-sessions">
                <h3>No upcoming sessions</h3>
                <p>You don't have any scheduled sessions yet.</p>
            </div>
        );
    }

    return (
        <div className="upcoming-sessions-container">
            <h2>
                Upcoming Sessions
                <span className="session-count">{sessions.length}</span>
            </h2>

            <div className="sessions-list">
                {sessions.map((session) => (
                    <div key={session.id} className="session-card">
                        <div className="session-header">
                            <div className="session-date">
                                <span>📅 {formatDate(session.date)}</span>
                            </div>
                            <div className="session-time">
                                <span>🕒 {session.time_display || session.time}</span>
                            </div>
                        </div>

                        <div className="session-details">
                            <div className="session-person">
                                {userType === 'patient' ? (
                                    <strong>{session.therapist_name || 'Therapist'}</strong>
                                ) : (
                                    <strong>{session.patient_name || 'Patient'}</strong>
                                )}
                            </div>

                            <div className="session-reason">
                                <span className="reason-badge">
                                    {getCategoryLabel(session.reason_category)}
                                </span>
                            </div>

                            {session.reason && (
                                <p className="session-notes">{session.reason}</p>
                            )}

                            <div className="session-meta">
                                <span className="duration">
                                    {session.duration_minutes || 60} minutes
                                </span>
                                <span className={`status status-${session.status}`}>
                                    {session.status}
                                </span>
                            </div>
                        </div>

                        <div className="session-actions">
                            <button 
                                className="btn-join"
                                onClick={() => window.location.href = `/MySessions`}
                            >
                                Join Session
                            </button>
                        </div>
                    </div>
                ))}
            </div>
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
        fetch(`${Api_Base}dashboard/`,{
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

                
                    <div>
                        <h2>Upcoming Sessions</h2>
                        <UpcomingSessions />

                    </div>
                  
                
            </main>
        </div>
        </>
    )
}
export default TherapyDashboard;