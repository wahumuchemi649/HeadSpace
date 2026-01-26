import { Link } from "react-router-dom";
import './landing.css';
import Dashboard from "./Dashboard";
import TherapyLogin from "./TherapyLogin";
import { AiFillHeart } from "react-icons/ai";
import {FiMessageCircle,FiTrendingUp,FiShield,FiClock} from "react-icons/fi";
import { User, Stethoscope } from 'lucide-react';
import { FiArrowDown } from "react-icons/fi";
import { FiMail,FiPhone,FiMap } from "react-icons/fi";


function Landing(){
    return(
       <div className="landing-page">
       <div className="header">
        <AiFillHeart size={50} color="#61dafbaa"/>
        <h1>HeadSpace</h1>
        <p>Your Healing journey Starts here</p>
        <p>Connect with professional therapists</p>
        <p>Track your progress, build healthy habits, and achieve lasting mental wellness with personalized support every step of the way</p>
    
        <a href='#yourportal'>GET STARTED</a>
        <div className="arrow">
          <FiArrowDown size={30} color="#61dafbaa"/>
        </div>
        
       </div>

       <div className="why">
        <h1>Why choose our Platform</h1>
        <div className="reasons">
          <div className="card">
            <FiMessageCircle size={40} color="#61dafbaa"/>
            <h5>Secure Conversations</h5>
            <p>Engage in confidential chats with licensed therapists in a safe and private environment.</p>
          </div>
          <div className="card">
            <FiTrendingUp size={40} color="#61dafbaa"/>
            <h5>Progress Tracking</h5>
            <p>Monitor your healing journey with detailed analytics and insights</p>
          </div>
          <div className="card">
            <FiShield size={40} color="#61dafbaa"/>
            <h5>Complete Privacy</h5>
            <p>Your conversations and data are protected with end-to-end encryption</p>
          </div>
          <div className="card">
            <FiClock size={40} color="#61dafbaa"/>
            <h5>24/7 Availability</h5>
            <p>Access support whenever you need it, on your own schedule</p>
          </div>
        </div>
       </div>
       <div id='yourportal' className="yourportal">
        <h1>Choose your portal</h1>
        <hr />
        <div className="portals">
          <div className="portal">
            <User size={50} color="#61dafbaa"/>
            <h2>Client Portal</h2>
            <p>Access personalized therapy sessions, track your progress, and connect with licensed therapists to support your mental well-being.</p>
            <Link to='/Login'> Log In</Link>
            <p>Are you new here?</p>
            <Link to='/SignIn'> Sign In</Link>
          </div>
          <div className="portal">
            <Stethoscope size={50} color="#61dafbaa"/>
            <h2>Therapist Portal</h2>
            <p>Manage your client sessions, track their progress, and provide professional support through our secure platform.</p>
            <Link to='/TherapyLogin'> Login</Link>
            <p>Want to join our Team?</p>
            <Link to='#'>Apply Now</Link>

          </div>

        </div>
         
       </div>
       <hr />
        <div className="footer">
        <footer>
          <div className="Infooter">
            <div className="thefooters">
              <AiFillHeart size={30} color="#61dafbaa"/>
              <h2>HeadSpace</h2>
              <p>Connecting patients with qualified therapists for better mental health outcomes</p>
            </div>
            <div className="thefooters">
              <h2>Quick Links</h2>
              <Link to='/Login'> Client Log In</Link>
              <Link to='/SignIn'> Sign In</Link>
              <Link to='/TherapyLogin'> Therapist Login</Link> 
              <Link to='/'> Privacy Policy</Link>
              <Link to='/'> Terms Of Policy</Link>         
            </div>
            <div className="thefooters">
              <h2>Contact us</h2>
              <p><FiMail size={20} color="#61dafb" /><strong>Email:</strong>chelsfavor@gmail.com</p>
              <p><FiPhone size={20} color="#61dafb" /><strong>Phone:</strong> +254 711 223 344</p>
              <p><FiMap size={20} color="#61dafb" /><strong>Location:</strong>Kisii, Kenya</p>
              </div>
          </div>
          <hr />
          <p className="copy">&copy; 2025 Ther. All rights reserved.</p>
          <p>Your Mental health matters. Confidential and secure</p>
        </footer>
        

       </div>
       </div>
      
    )
}
export default Landing