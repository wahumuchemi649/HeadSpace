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
import { AuthProvider } from './contexts/AuthContext';
import SessionsList from './components/SessionsList';


function App() {

  function ChatWrapper() {
    const { sessionId } = useParams();
    return <Chat sessionId={parseInt(sessionId)} />;
  }

  return (
    <>
       

<Router>
  <AuthProvider>
    <Routes>

      <Route path='/' element={<Landing />} />
      <Route path="/signIn" element={<SignIn />} />
      <Route path="/Login" element={<Login />} />
      <Route path='/session' element={<Booking />} />
      <Route path='/TherapyLogin' element={<TherapyLogin />} />
      <Route path="/sessions" element={<SessionsList />} />
      <Route path="chatRoom" element={<Chat />} />

      {/* Dashboard */}
      <Route path="/Dashboard" element={<Dashboard />}>
        <Route path="chat/:sessionId" element={<ChatWrapper />} />
      </Route>

      {/* Therapist Dashboard */}
      <Route path="/Therapydashboard" element={<TherapyDashboard />}>
        <Route path="chat/:sessionId" element={<ChatWrapper />} />
      </Route>

    </Routes>
  </AuthProvider>
</Router>

       
      
    </>
  )
}

export default App
