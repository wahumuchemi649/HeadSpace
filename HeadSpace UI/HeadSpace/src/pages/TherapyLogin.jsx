import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './TherapyLogin.css';
import { Api_Base } from "./Api";
import { MdRadioButtonChecked } from "react-icons/md";

function TherapyLogin() {
  const [form, setForm] = useState({
    email: "",
    phoneNumber: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    if (errors.global) {
      setErrors(prev => ({ ...prev, global: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting form:", form);
    setErrors({});
    
    if (!form.email || !form.phoneNumber) {
      setErrors({ global: "All fields required" });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`${Api_Base}/login/`, {  
        method: 'POST',
        headers: { 'Content-Type': "application/json" },
        body: JSON.stringify(form)
      });

      /*console.log("Response status:", res.status); */
      const data = await res.json();
      /*console.log("Login response:", data);*/
      
      if (res.ok && data.access) {
        // Store JWT tokens
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        /*console.log("✅ Tokens stored, redirecting...");*/
        navigate('/TherapyDashboard');
      } else {
        setErrors({ global: data.message || "Invalid Credentials" });
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrors({ global: 'Network error, try again later' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
            type="email" 
            id="email" 
            name="email"
            value={form.email} 
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number</label>
          <input 
            type="text" 
            id="phoneNumber" 
            name="phoneNumber"
            value={form.phoneNumber} 
            onChange={handleChange}
            required
          />
        </div>
        
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>    

        <h5>Want to join our team? Call <strong>0117543225</strong></h5>
      </form>
    </div>
  );
}

export default TherapyLogin;