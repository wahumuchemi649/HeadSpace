import { useState } from 'react'
import './App.css'
import {BrowserRouter as Router,Routes, Route} from 'react-router-dom'
import {Link} from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Landing from './pages/landing'
import SignIn from './pages/signIn'
import Login from './pages/Login'
import  Booking from './pages/session'
import Chat from './pages/chatRoom'

function App() {

  return (
    <>
       
      <Router>
        <Routes>
          <Route path='/' element={<Landing />} />
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/signIn" element={<SignIn />} /> 
          <Route path="/Login" element={<Login />} />
          <Route path='/session' element={<Booking/>} />
          <Route path='/chatRoom' element={<Chat/>} />
        </Routes>
      </Router>
      
    </>
  )
}

export default App
