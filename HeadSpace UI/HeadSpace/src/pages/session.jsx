import './session.css'
import { useEffect } from 'react'
import { useState } from 'react'
import {useNavigate} from 'react'
import Api_Base from './Api'


function Cards({onselect}){

    const [Therapists,setTherapists]=useState([])
    const[index,setIndex]=useState(0)
    useEffect(()=>{
        async function fetchTherapists() {
            try{
                const res= await fetch( `${Api_Base}therapists/`)
                const data = await res.json()
                setTherapists(data)

            }
            catch(err){
                console.log(err)
            }
        }
        fetchTherapists()
        // Refreshes the browser after every 30 seconds and ensures it is upto date
        const interval =setInterval(fetchTherapists,30000)
        return ()=>clearInterval(interval)
    },[])

    useEffect(()=>{
        const timer = setInterval(() => {
      setIndex((prev) => (prev + 3) % Therapists.length);
    }, 5000);
 return ()=>clearInterval(timer)
    },[Therapists])

    let visibleTherapists= []
    if(Therapists.length>0){
        visibleTherapists =[
            Therapists[index% Therapists.length],
            Therapists[(index +1)% Therapists.length],
            Therapists[(index + 2)% Therapists.length]
        ]
    }

    return(
        <div className='therapist-container'>
{visibleTherapists.map((t) => (
        <div className="card" key={t.id}

        // Selecting a therapist
        onClick={()=>onselect(t)}

        style={
            { 
            cursor: "pointer", 
            border: "1px solid #ccc",
            padding: "10px" 
        }
         }
         >
          <img src={`${Api_Base}media/${t.profile_pic}`}  alt={t.profile_pic} />
          <h3>{t.firstName} {t.lastName}</h3>
          <p>{t.description}</p>
        </div>
      ))}
        </div>
    )
    
}
function Time({selectedTime,setSelectedTime}){
    const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    const slots=['8:00 ', '10:00', '12:00 ','2:00','4:00','6:00']

    return(
        <div className='schedule-container'>
            <table>
                <thead>
                <tr>
                  {days.map((day)=>(

                    <th key={day}>{day}</th>
                  )
                    
                  )}
                </tr>
                </thead>
                <tbody>
                    {slots.map((slot)=>(
             <tr key={slot} >
                   <td>{slot}</td>
                   {days.map((day)=>{
                   const slotId =`${day}-${slot}`
                   const isSelected=selectedTime==slotId
                   return(
                    <td key={slotId}
                    onClick={()=>setSelectedTime(slotId)}
                    style={{
                      cursor: "pointer",
                      backgroundColor: isSelected ? "lightgreen" : "white"
                    }}>
                      {isSelected ? "✔" : ""}
                    </td>
                   )
                   }
                    
                   )}
                </tr>
                    ))}
                
                </tbody>
                
            </table>
        </div>
    )
}
function Booking(){
    const[selectedTherapist,setselectedTherapist]=useState(null)
    const[selectedTime,setSelectedTime]=useState('')
    const[reason,setReason]=useState('')

    const handlesubmit=async()=>{
        if(!selectedTherapist){
         alert('Please select a therapist')
         return
        }
        if(!selectedTime||!reason){
            alert('Please select time and give a reason for your application')
            return
        }

        const[days,slots] =selectedTime.split('-')
         const formattedTime = `${slots.trim()}:00`

        const booking_data={
          therapist_id:selectedTherapist.id,
          day:days,
          time:formattedTime,
          reason
        }
        try{

            const res= await fetch(`${Api_Base}session/`,{
                method: 'POST',
                headers:{'content-type':'application/json'},
                body: JSON.stringify(booking_data)
            })
            if(res.ok){
                alert('Booking Confirmed')
                setSelectedTime('')
                setReason('')
            }
            else{
                alert('Something went wrong')
                console.log(error)
            }
        }
        catch(err){
            console.error(err)
            
        }
    }
    return(
    <>
    <h1>HEADSPACE</h1>
    <h2>Book a Session with us today</h2>
    <div className='therapists'>
        <h2>SELECT A THERAPIST</h2>
        <Cards onselect={setselectedTherapist} />
        {selectedTherapist && (
          <p style={{ color: 'green' }}>
            Selected: {selectedTherapist.firstName} {selectedTherapist.lastName}
          </p>
        )}
    </div>
    <div>
        <h2>SELECT TIME</h2>
        <Time  selectedTime={selectedTime} setSelectedTime={setSelectedTime}/>
        {selectedTime && <p style={{ color: 'blue' }}>Chosen slot: {selectedTime}</p>}
        </div>
        <div>
            <h2>Reason for Booking</h2>
            <textarea
             name='message'
              rows='4'
               cols='50'
               value={reason}
          onChange={(e) => setReason(e.target.value)}></textarea>
        </div>
        <div>
            <button type='submit' onClick={handlesubmit}>Confirm</button>
        </div>
    </>
    )
}
 export default Booking