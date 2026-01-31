import './Dashboard.css'
import './Mood.jsx'
import  Avatar from './Avatar.jsx'
import { useState,useEffect } from 'react';
import { Link } from 'react-router';
import { AiFillHeart } from 'react-icons/ai'
import { AiFillMessage,AiFillDashboard } from 'react-icons/ai'
import {FiTrendingUp,FiCalendar} from "react-icons/fi";
import { FiHome,FiPhone } from 'react-icons/fi';
import { Ban } from "lucide-react";
import MoodChart from './Mood.jsx';
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
            const res = await fetch(`http://localhost:8000/upcoming-sessions/`, {
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
function Dashboard(){

  const [user,setUser] =useState(null);
  useEffect(()=>{
    fetch('http://localhost:8000/api/patientDashboard/',{
      method:"GET",
      credentials:"include"
    })
    .then(res=>{
      if(!res.ok) throw new console.error('Response not okay');
      return res.json()
    })
    .then(data=>{
      setUser(data)
      console.log('Dashboard :',data)
    })
    .catch (err => console.log(err))
  },[]);
  if (!user) {
  return <p>Loading...</p>;
  
}


  return(
    <>
<header>
  <div>
    <h1><AiFillHeart  size={20} color='#61dafb'/>HEADSPACE</h1>
  </div>
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
  <Avatar name={`${user.firstName} ${user.lastName}`}/>
     <div className='name'>
    <h3>{user?.firstName}</h3>
    <p>Online</p>
  </div>
  </div>
 
</header>
<div className='clientcontainer'>
  
  <aside className='aside'>
       
    <Link to="/Dashboard" className="aside-link">
    <p><AiFillDashboard size={40} color='#555'/>Dashboard</p>
    </Link>
     <Link to="/MySessions" className="aside-link">
    <p><FiCalendar size={40} color='#555' />My Sessions</p>
  </Link>
    <p><FiTrendingUp size={40} color='#555'/>Progress</p>
    <p><FiHome size={40} color='#555'/>Community</p>
    <p><AiFillMessage size={40} color='#555' />Messages</p>

  </aside>
  <main>
    <div className='nameCard'>
      <h1>Hello {user?.firstName} {user?.lastName} </h1>
      <p>How are you feeling today</p>
    </div>
    <div className='bodyCards'>
      <Link to='/session' className='bodycard'>
        <FiCalendar size={40} color='#61dafb' />
        <h1>Book A Session</h1>
        <p>Schedule your next appointment</p>
      </Link>
      <div className='bodycard'>
        <FiHome size={40} color='#61dafb' />
        <h1>Join a chat</h1>
        <p>Connect with support group</p>
        <h2><Ban size={20} color='#3d1d77' />Service not available at the moment</h2>
      </div>
      <Link to='/Crisis' className='bodycard'>
        <FiPhone size={40} color='red'/>
        <h1>Emergency</h1>
        <p>24/7 Crisis support</p>
      </Link>
    </div>
    <div className='upcomings'>
      <h3>Upcoming Activities</h3> 
      <p><FiCalendar size={60} color='#3d1d77' /></p>
      <UpcomingSessions />
    </div>
    {/*}
    <div className='progress'>
      <div><FiTrendingUp size={40} color='#3d1d77'/><h2>Healing Progress</h2></div>
      <h2><Ban size={20} color='#3d1d77' />Service not available at the moment</h2>
      <h3>This is raw data</h3>
      <div className='healingCards'>
        <div className='Hcard'> 
<p>12</p>
<p>Sessions completed</p>
        </div>
  <div className='Hcard'> 
<p>7</p>
<p>Days current streak</p>
        </div>
          <div className='Hcard'> 
<p>78%</p>
<p>Overall Progress</p>
        </div>
      </div>
<h2>Mood Trend</h2>
<div className='moodGraph'>
  <MoodChart />

</div>
    </div>
    
    <div className='community'>
      <div className='join'>
        <div className='com'><FiHome size={40} color='#61dafb'/><h2>Community Discussions</h2></div> 
        <div className='link'>
          <Link to='/'> Join Community</Link>
        </div>

      </div>
     
     <div className='comCards'>
      <h6>Anxiety Management Tips</h6>
      <p>Started by Emma</p>
      <div className='replies'>
      <p><AiFillMessage size={20} color='#61dafb'/>20 replies</p>
      <p><AiFillHeart size={20} color='#61dafb'/>30 likes</p>
      </div>
     </div>
     <div className='comCards'>
      <h6>Celebrating Small wins</h6>
      <p>Started by Davindson</p>
      <div className='replies'>
      <p><AiFillMessage size={20} color='#61dafb'/>20 replies</p>
      <p><AiFillHeart size={20} color='#61dafb'/>330 likes</p>
      </div>
     </div>
     <div className='comCards'>
      <h6>Sleep Improvement Tips</h6>
      <p>Started by Liz</p>
      <div className='replies'>
      <p><AiFillMessage size={20} color='#61dafb'/>20 replies</p>
      <p><AiFillHeart size={20} color='#61dafb'/>30 likes</p>
      </div>
     </div>

    </div>*/}
  </main>

</div>

    
    </>
  )
       
        
      
    
}

export default Dashboard