import './SignIn.css'
import { useState } from 'react'
import Api_Base from './Api'
import Dashboard from './Dashboard'
import { useNavigate } from 'react-router'
import { required } from 'joi'


function Login(){
    const navigate = useNavigate()
    const [form,setForm] =useState({
         email:"",
        password:""
    }
       
    )
    const[errors,setErrors]=useState({})
    const[submitting,setSubmitting]=useState(false)


    function handleChange(e){
        const{name,value}=e.target
        setForm((prev)=>({...prev,[name]:value}))
    }

    async function handleSubmit(e){
        e.preventDefault()
        setSubmitting(true)
        setErrors({})
if(! form.password||!form.email){
                setErrors({global: "All fieldss required"})
                setSubmitting(false)
                return (alert("all fiels required"))
            }
        try{
            const res= await fetch(`${Api_Base}/api/login/`,{
                method:'POST',
                headers:{'Content-Type':"application/json"},
                body:JSON.stringify(form)
            })
            const data = await res.json()
            
            if(res.ok){
                alert("Login Successfull")
                navigate('/Dashboard')
            }
            else(
               setErrors({global:data.errors||'Invalid Credentials'})
            )


        }
        catch(err){
            console.log(err)
            setErrors({global: 'Network error, try again later'})
        }
        finally{
            setSubmitting(false)
        }
            
        }
        return(
            <div className='signin-container '>
                <form onSubmit={handleSubmit} noValidate>
                    {errors.global && <div role="alert">{errors.global}</div>}

                    <label>Email

                        <input type='email' name="email" value={form.email} onChange={handleChange } required></input>
                    </label>
                    <label>
                        Password
                        <input type='password'name="password" value={form.password} onChange={handleChange}></input>
                    </label>
                    <button type='submit' disabled={submitting}>{submitting ?"Login In ...":"Login"}</button>
                </form>

            </div>
        )
    }

export default Login