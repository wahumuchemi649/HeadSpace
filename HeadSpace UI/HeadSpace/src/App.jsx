import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Landing from './pages/landing'
import SignIn from './pages/signIn'
import Login from './pages/Login'
import  Booking from './pages/session'
import Chat from './pages/chatRoom'
import TherapyLogin from './pages/TherapyLogin'
import TherapyDashboard from './pages/Therapydashboard'
import TherapistApply from './pages/therapist-apply.jsx'
import { AuthProvider } from './contexts/AuthContext';
import SessionsList from './components/SessionsList';
import Crisis from './pages/Crisis'
import MySessions from './pages/Mysessions'
import Messages from './pages/chatRoom'
import ThSessions from './pages/Thsessions'


function App() {


  return (
    <>
       

<Router>
  <AuthProvider>
    <Routes>

      <Route path='/' element={<Landing />} />
      <Route path="/signIn" element={<SignIn />} />
      <Route path="/Login" element={<Login />} />
      <Route path='/session' element={<Booking />} />
      <Route path='/Therapist-apply' element={<TherapistApply />} />
      <Route path='/TherapyLogin' element={<TherapyLogin />} />
      <Route path="/sessions" element={<SessionsList />} />
      <Route path="chatRoom" element={<Chat />} />
      <Route path='/Crisis' element={<Crisis/>} />
      <Route path="/Dashboard" element={<Dashboard />} />        
      <Route path="/Therapydashboard" element={<TherapyDashboard />} />
      <Route path="/ThSessions" element={< ThSessions/>}/>
      <Route path="/MySessions" element={< MySessions/>}/>
      <Route path="/chatRoom/:sessionId" element={<Messages />} />
        
      

    </Routes>
  </AuthProvider>
</Router>

       
      
    </>
  )
}

export default App
