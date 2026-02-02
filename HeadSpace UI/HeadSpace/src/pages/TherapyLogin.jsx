
import { useState } from "react";
import { useNavigate } from "react-router";
import './TherapyLogin.css';
import {Api_Base} from "./Api";
import { MdRadioButtonChecked } from "react-icons/md";


function TherapyLogin() {
  const [form, setForm] = useState({
    email: "",
    phoneNumber: ""
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false); // ADD THIS

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors.global){
      setErrors(prev =>({...prev, global:''}))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting form:", form);
    setErrors({});
    
    if (!form.email || !form.phoneNumber) {
      setErrors({ global: "All fields required" });
      return; // Removed alert - error state is enough
    }
    
    setIsSubmitting(true); // ADD THIS - start loading
    
    try {
const res = await fetch(`${Api_Base}login/`, {
  method: 'POST',
  headers: { 'Content-Type': "application/json" },
  body: JSON.stringify(form),
  credentials: 'include'
});

console.log("Response status:", res.status);  
const data = await res.json();
console.log("Login response:", data);
      
      if (res.ok) {
        localStorage.setItem("userEmail", form.email);
        // Store token if your backend returns one
        if (data.token) {
          localStorage.setItem('therapist_token', data.token);
        }
        
        navigate('/TherapyDashboard');
      } else {
        setErrors({ global: data.message || "Invalid Credentials" });
      }
    } catch (err) {
      console.log(err);
      setErrors({ global: 'Network error, try again later' });
    } finally {
      setIsSubmitting(false); // NOW THIS WORKS
    }
  }

  return(
    <>
      <div className="therapy-login-container">
        <MdRadioButtonChecked className='logo' size={80} color='#3d1d77'/>
        <h1>HeadSpace</h1>
        <h5>Your trusted therapy partner</h5>
        {errors.global && (
          <div style={{color: 'red', marginBottom: '10px'}}>
            {errors.global}
          </div>
        )}
        
        <form className="formName" onSubmit={handleSubmit}>
          <div className="form-group">
          <label htmlFor="email">Email</label>
          <input 
            type="text" 
            id="email" 
            name="email"  /* ADD THIS - IMPORTANT! */
            value={form.email} 
            onChange={handleChange}
          />
          </div>
          
          <div className="form-group">
         <label htmlFor="phoneNumber">phoneNumber</label>
          <input 
            type="text" 
            id="phoneNumber" 
            name="phoneNumber"  /* ADD THIS - IMPORTANT! */
            value={form.phoneNumber} 
            onChange={handleChange}
          />
          
          </div>
          
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>    

          <h5>Want to join our team? Call <strong>07xxxxxxxx</strong></h5>
        </form>
        
      </div>
    </>
  )
}

export default TherapyLogin;