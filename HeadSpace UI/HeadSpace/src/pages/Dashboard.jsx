import './Dashboard.css'

function Dashboard(){
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
                <a href='#'> Book a session</a>
                <a href='#'>Your sessions</a>
                <a href='#'> Your Progress</a>
                <a href='#'> How are you today?</a>
                <a href='#'> Join a community</a>

             </aside>
                <main>
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