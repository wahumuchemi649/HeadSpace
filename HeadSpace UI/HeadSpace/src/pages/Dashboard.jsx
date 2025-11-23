import './Dashboard.css'
import { Link } from 'react-router-dom'
import Api_Base from './Api'
import { 
  MdCalendarToday,    // Book a session
  MdEventNote,        // Your sessions
  MdTrendingUp,       // Your Progress
  MdMood,             // How are you today?
  MdPeople            // Join a community
} from 'react-icons/md';
import { useState, useEffect } from 'react';    

function Dashboard(){
        const [session, setSession] = useState({});
    useEffect(() => {
  const fetchSession = async () => {
    console.log('🔍 Cookies before request:', document.cookie);
    try {
      const response = await fetch(`${Api_Base}chat/sessions/`, {
        method: "GET",
        credentials: "include",
         headers: {
    "Content-Type": "application/json",
    "X-CSRFToken": getCookie('csrftoken'), // Django CSRF token
  }
      });
      function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


      const data = await response.json();
      console.log("Latest session:", data);

      // TODO: set state here e.g.
      // setSession(data);

    } catch (error) {
      console.error("Error fetching latest session:", error);
    }
  };

  fetchSession();
}, []);   // Empty array so it runs once on mount

    return(
        <>
        <header>
          <h1>Dashboard</h1>
          <div className="PersonalDetails">
 <img src="dashboard.jpg" alt="Profile picture"/>
 <div className='Details'>
 <h2>Wahu Muchemi</h2>
 <p>I'm loved, cherished favoured, and worthy of everything nice</p>
 </div>

          </div>
          </header>
          <div className='container'>
             <aside className='sidebar'>
                <div><MdCalendarToday size={20}/><Link to='/session'> Book a session</Link></div>
                <div><MdEventNote size={20}/><Link to='/#'>Your sessions</Link></div>
                <div><MdTrendingUp size={20}/><Link to='/#'> Your Progress</Link></div>
                <div><MdMood/><Link to='/#'> How are you today?</Link></div>
                <div><MdPeople/><Link to='/#'> Join a community</Link></div>

             </aside>
             
        
                <main>
        <Link className='Specifics' to='/Dashboard'>Dashboard</Link>
        <Link className="Specifics" to='/signIn'> Sign In</Link>
        <Link className="Specifics" to="/Login"> Log In</Link>
        <Link className="Specifics" to='/session'>Book a session </Link>
        {session.id ? (
  <Link className="Specifics" to={`/chat/${session.id}`}>ChatRoom</Link>
) : (
  <span>Loading ChatRoom...</span>
)}

        <Link className="Specifics" to='/TherapyLogin'>Therapist Login</Link>
 <div className='graph'>
<img src='graph.png' alt='Tracking Progress'/>
<h4>You are doing so well. Keep pushing</h4>
         </div>
          
<div className='body'>
        <div className='group'>
<img src='/therapist.png' alt='Therapy sessions'/>
<p>Connect with therapists</p>
        </div>
       <div className='group'>
<img src='/community.png' alt='peer sessions'/>
<p>Join peer Groups</p>
        </div>
         <div className='group'>
<img src='/graph.png' alt='progress '/>
<p>Track  your Progress</p>
        </div>
         <div className='group'>
<img src='/mood.png' alt=' tracker'/>
<p>mental wellness, how do you feel today</p>
        </div>
      </div>
      </main>
          </div>
        
<footer>
<p>&copy; 2025 WAHU MUCHEMI</p>
<hr/>
<p>You are strong as your mind</p>
<hr/>
<p> See you at a better place</p>
      </footer>
        
        
        </>
    )
}

export default Dashboard