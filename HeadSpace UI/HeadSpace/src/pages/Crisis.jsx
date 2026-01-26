import { Link } from "react-router"
import { FiArrowLeft, FiPhone,FiAlertCircle } from "react-icons/fi"
import { AiFillMessage } from "react-icons/ai";
import { MdWarning } from 'react-icons/md';
import './Crisis.css';

function Crisis(){
    return(
        <>
<Link to='/Dashboard'>
<div className="back">
    <h3><FiArrowLeft size={20} color="#555"/>Back to Dashboard</h3>
</div>
</Link>
<div className="hazard">
    <MdWarning size={80} color="red"/>
    <div>
        
        <h1>You are not Alone - Help is available now</h1>
        <p>
            If you're experiencing a mental health emergency or having thoughts of self-harm, please reach out immediately using one of the resources below. Our crisis team is here 24/7.
        </p>
    </div>
</div>
<div className="immediates">
    <h5>Immediate Support Hotlines</h5>
    <div className="immediate">
        <FiPhone size={20} color='red'/>
        <h3>National Suicide Prevention Lifeline</h3>
        <p>Available 24/7</p>
        <a href="tel:988"><button>Call 988</button></a>
        
    </div>
    <div className="immediate">
        <AiFillMessage size={20} color='red'/>
        <h3>Crisis Text Line</h3>
        <p>Text Support Availble</p>
        <a href="sms:741741&body=HELLO"><button>Text Hello To 741741</button></a>
        
    </div>
</div>
<div className="ourTeam">
    <div className="teamhead">
        <FiAlertCircle size={40} color="#b8e3ff"/>
        <div className="teamName">
        <h1>HeadSpace Crisis Team</h1>
        <p>Direct connection to our licensed Crisis counsellors</p>
        </div>
        </div>
        <div className="teamButtons">
            <a href="tel:0757438047">
         <button>
            <FiPhone size={20} color='#fff'/> call Crisis Line
         </button>
            </a>
        <a href="sms:0757438047& Hey">
        <button>
            <AiFillMessage size={20} color='#fff'/> Start Live Chat
        </button>
        </a>
         
        </div>
        </div>
        <div className="ToDos">
          <h1>Immediate Grounding Techniques</h1>
          <p>While waiting for support, tr these these tchniques to help you calm your mind</p>
          <div className="TTDs">
            <h1>5-4-3-2-1 Grounding</h1>
            <ul>
                <ol>
                    <li>Name 5 things you see</li>
                    <li>Name 4 things you touch</li>
                    <li>Name 3 things you hear</li>
                    <li>Name 2 things you smell</li>
                    <li>Name 1 things you taste</li>
                </ol>
            </ul>

          </div>
          <div className="TTDs">
            <h1>Box Breathing</h1>
            <ul>
                <ol>
                    <li>Breathe in for 4 counts</li>
                    <li>Hold for 4 counts</li>
                    <li>Breathe out for 4 counts</li>
                    <li>Hold for 4 counts</li>
                    <li>Repeat 4 times</li>
                </ol>
            </ul>

          </div>
          <div className="TTDs">
            <h1>Safe Place Visualization</h1>
            <p>Close your eyes and imagine yourself in the safest, most peaceful place you can think of. Focus on the details - what you see, hear, feel, and smell there.</p>
          </div>
</div>
<hr/>
<footer className="crisis-footer">

<p><strong>Remember:</strong>Seeking help is a sign of strength. Your safety and wellbeing matter, and there are people ready to support you right now.</p>

</footer>




        </>
    )

}
export default Crisis