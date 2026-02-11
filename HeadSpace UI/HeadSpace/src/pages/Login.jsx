import './SignIn.css'
import { useState } from 'react'
import { Api_Base } from './Api'
import { Link, useNavigate } from 'react-router-dom'
import { MdRadioButtonChecked } from "react-icons/md";

function Login() {
    const navigate = useNavigate()
    
    const [form, setForm] = useState({
        email: "",
        password: ""
    })
    const [errors, setErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    function handleChange(e) {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
       /* console.log("Attempting to log in with form data:", form)*/
        setSubmitting(true)
        setErrors({})
        
        if (!form.password || !form.email) {
            setErrors({ global: "All fields required" })
            setSubmitting(false)
            return
        }
        
        try {
            const res = await fetch(`${Api_Base}api/login/`, {
                method: 'POST',
                headers: { 'Content-Type': "application/json" },
                body: JSON.stringify(form)
            })
            
            const data = await res.json()
            
            if (res.ok) {
                // Store JWT tokens in localStorage
                localStorage.setItem("access_token", data.access);
                localStorage.setItem("refresh_token", data.refresh);
                localStorage.setItem("user", JSON.stringify(data.user));
                
                /*console.log('✅ Login successful, tokens stored');*/
                navigate('/Dashboard')
            } else {
                setErrors({ global: data.message || 'Invalid Credentials' })
            }
        } catch (err) {
            console.log(err)
            setErrors({ global: 'Network error, try again later' })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className='signin-container'>
            <MdRadioButtonChecked className='logo' size={80} color='#3d1d77' />
            <h1>HeadSpace</h1>
            <h5>Find your calm, improve your life</h5>
            <form onSubmit={handleSubmit} noValidate>
                {errors.global && <div role="alert">{errors.global}</div>}

                <label>Email
                    <input type='email' name="email" value={form.email} onChange={handleChange} required />
                </label>
                <label>Password
                    <input type='password' name="password" value={form.password} onChange={handleChange} />
                </label>
                
                {submitting && (
                    <p style={{ textAlign: "center", color: "#3d1d77" }}>
                        Authenticating...
                    </p>
                )}

                <button type='submit' disabled={submitting}>
                    {submitting ? "Logging In..." : "Login"}
                </button>
            </form>
            <Link to="/SignIn" className='log'>Don't have an account? Sign Up</Link>
        </div>
    )
}

export default Login