import './Dashboard.css'
import './Mood.jsx'
import  Avatar from './Avatar.jsx'
import { useState,useEffect } from 'react';
import { Link } from 'react-router';
import { AiFillHeart } from 'react-icons/ai'
import { AiFillMessage,AiFillDashboard } from 'react-icons/ai'
import {FiTrendingUp,FiCalendar} from "react-icons/fi";
import { FiHome,FiPhone } from 'react-icons/fi';
import MoodChart from './Mood.jsx';
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
    <p><AiFillDashboard size={40} color='#555'/>Dashboard</p>
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
      </div>
      <Link to='/Crisis' className='bodycard'>
        <FiPhone size={40} color='red'/>
        <h1>Emergency</h1>
        <p>24/7 Crisis support</p>
      </Link>
    </div>
    <div className='upcomings'>
      <h3>Upcoming Activities</h3>
      <div className='upcoming'>
        <h2>Dr. Sarah Jayson</h2>
        <p><FiCalendar size={20} color='#555' />20th December</p>
      </div>
      <div className='upcoming'>
        <h2>Dr. Sarah Jayson</h2>
        <p><FiCalendar size={20} color='#555' />20th December</p>
      </div>
    </div>
    <div className='progress'>
      <div><FiTrendingUp size={40} color='#3d1d77'/><h2>Healing Progress</h2></div>
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

    </div>
  </main>

</div>

    
    </>
  )
       
        
      
    
}

export default Dashboard