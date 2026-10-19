import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AiFillDashboard } from 'react-icons/ai';
import { FiCalendar, FiClock, FiUsers } from 'react-icons/fi';
import './ClientSidebar.css';

export default function ClientSidebar() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  const isDashboard = path === '/dashboard';
  const isBookSession = path === '/session' || path === '/booking';
  const isMySessions = path === '/mysessions' || path === '/sessions';
  const isCommunity = path.startsWith('/community') || path === '/communitylist';

  return (
    <aside className="client-aside-sticky aside" aria-label="Client Navigation Sidebar">
      <Link 
        to="/Dashboard" 
        className={`aside-link ${isDashboard ? 'active' : ''}`}
        title="Dashboard Overview"
      >
        <p>
          <AiFillDashboard size={20} />
          <span>Dashboard</span>
        </p>
      </Link>

      <Link 
        to="/session" 
        className={`aside-link ${isBookSession ? 'active' : ''}`}
        title="Book a New Session"
      >
        <p>
          <FiCalendar size={20} />
          <span>Book Session</span>
        </p>
      </Link>

      <Link 
        to="/MySessions" 
        className={`aside-link ${isMySessions ? 'active' : ''}`}
        title="View My Scheduled Sessions"
      >
        <p>
          <FiClock size={20} />
          <span>My Sessions</span>
        </p>
      </Link>

      <Link 
        to="/CommunityList" 
        className={`aside-link ${isCommunity ? 'active' : ''}`}
        title="Community Discussions & Support"
      >
        <p>
          <FiUsers size={20} />
          <span>Community</span>
        </p>
      </Link>
    </aside>
  );
}
