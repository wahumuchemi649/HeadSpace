import { Link } from "react-router-dom"




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
<Link className='Specifics' to='/Landing'>Home</Link>
        <Link className='Specifics' to='/Dashboard'>Dashboard</Link>
        <Link className="Specifics" to='/signIn'> Sign In</Link>
        <Link className="Specifics" to="/Login"> Log In</Link>
        <Link className="Specifics" to='/session'>Book a session </Link>
        <Link className="Specifics" to='/chatRoom'>ChatRoom</Link>
        
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

      <p className="read-the-docs">
       As a man thinketh so he is
      </p>

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
export default Landing