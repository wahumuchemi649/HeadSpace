import { Link } from "react-router-dom";
import Dashboard from "./Dashboard";
import TherapyLogin from "./TherapyLogin";

function Cards({title, description, path, extratext}){
        return(
            <Link to={path} className="card">
                <h3>{title}</h3>
                <p>{description}</p>
                <p className="extratext">{extratext}</p>
                </Link>)

}


function Landing(){
    return(
        <>
        <div className='header'>
        <aside>
          <p className='motto'>YOUR SPACE FOR </p>
          <p className='motto'>HEALING & SUPPORT</p>
          <p>Affordable therapy & peer support from anywhere, anytime</p>
          <div className='links'>
<a className='Specifics' href='#'> Get Started</a> 
<a className='Specifics' href='#'> Join Community</a>
          
          </div>
        </aside>
<main className='headerImage'>
<img src='/header.png'  alt='Casual conversation  on the grass'/>
</main>
      </div>
      <div className="links">
        <h2>Explore HeadSpace</h2>        
        </div>
        

        <div className='cardContainer'>
        <Cards
        path='/Login'
        title='Get Started'
        description='Take Control start Healing'
        
        />
        <Cards
        path='/TherapyLogin'
        title='Therapist [Login]'
        description='Help others heal and grow'
        extratext='Want to join our team call 07xxxxxxxx'
        />
        </div>
     {/* <div className='body'>
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
      </div>*/}
      

      <p className="read-the-docs">
       As a man thinketh so he is
      </p>
<footer className="footer">
  <div className="footer-main">
    <p>Confidential & Secure | HIPAA-Compliant</p>
    <p>Need immediate help? <a href="tel:123-456-7890">Call 123-456-7890</a> or <a href="/emergency">see emergency resources</a>.</p>
    <p>
      <a href="#">Privacy Policy</a> · 
      <a href="#">Terms of Service</a> ·
      <a href="#">Contact Support</a>
    </p>
  </div>
  <div className="footer-brand">
    <span>Certified Therapists | Powered by HeadSpace © {new Date().getFullYear()}</span>
  </div>
</footer>

      {/*<footer>
<p>&copy; 2025 WAHU MUCHEMI</p>
<hr/>
<p>You are strong as your mind</p>
<hr/>
<p> See you at a better place</p>
      </footer>*/}
        </>
    )
}
export default Landing