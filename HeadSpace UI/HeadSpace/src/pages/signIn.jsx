import { useState } from "react";
import Api_Base from "./Api";
import  './SignIn.css'
import { useNavigate } from "react-router-dom";

function SignIn() {
  const Navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    password:""
  });
  const [errors, setErrors] = useState({});
  const [touch, setTouch] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleSignin(e) {
    const { name, value, type, checked, files } = e.target;
    const newValue =
      type === "checkbox" ? checked : type === "file" ? files[0] : value;

    setForm((prev) => ({ ...prev, [name]: newValue }));
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouch((prev) => ({ ...prev, [name]: true }));
  }

  function validateForm(name, value) {
    if (name === "firstName") {
      if (!value.trim()) return "First name is required";
    }
    if (name === "lastName") {
      if (!value.trim()) return "Last name is required";
    }
    if (name === "phoneNumber") {
      if (!value.trim()) return "Phone number required";
      if (value.length < 10) return "Phone number too short";
    }
    if (name === "email") {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(value)) return "Invalid email";
    }
    if(name==="password"){
      if(!value.trim()) return "Password required"
      if(value.length<6) return "Password too short"
    }
    return "";
  }

  function validateAll(values) {
    const e = {};
    Object.keys(values).forEach((k) => {
      const msg = validateForm(k, values[k]);
      if (msg) e[k] = msg;
    });
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    
    
    const eobj = validateAll(form);
    setErrors(eobj);
    setTouch(Object.keys(form).reduce((acc, k) => ({ ...acc, [k]: true }), {}));

    if (Object.keys(eobj).length > 0) {
      const first = Object.keys(eobj)[0];
      const el = document.querySelector(`[name="${first}"]`);
      if (el) el.focus();
      return;
    }

    submitToServer();
  }

  async function submitToServer() {
    const server = Api_Base;
    setSubmitting(true);
    try {
      const res = await fetch(`${server}/api/patient/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
          const first = Object.keys(data.errors)[0];
          const el = document.querySelector(`[name="${first}"]`);
          if (el) el.focus();
        } else {
          setErrors((prev) => ({
            ...prev,
            _global: data.message || "Server error"
          }));
        }
      } else {
        
        alert("Saved successfully!");
        Navigate('/Dashboard')
        setForm({ firstName: "", lastName: "", phoneNumber: "", email: "" ,password:""});
        setTouch({});
        setErrors({});
      }
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({
        ...prev,
        _global: "Network error — please try again"
      }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="signin-container">
    <form onSubmit={handleSubmit} noValidate>
      {errors._global && <div role="alert">{errors._global}</div>}

      <label>
        First Name
        <input
          name="firstName"
          value={form.firstName}
          onChange={handleSignin}
          onBlur={handleBlur}
        />
      </label>
      {touch.firstName && errors.firstName && (
        <div role="alert">{errors.firstName}</div>
      )}

      <label>
        Last Name
        <input
          name="lastName"
          value={form.lastName}
          onChange={handleSignin}
          onBlur={handleBlur}
        />
      </label>
      {touch.lastName && errors.lastName && (
        <div role="alert">{errors.lastName}</div>
      )}

      <label>
        Phone Number
        <input
          name="phoneNumber"
          value={form.phoneNumber}
          onChange={handleSignin}
          onBlur={handleBlur}
        />
      </label>
      {touch.phoneNumber && errors.phoneNumber && (
        <div role="alert">{errors.phoneNumber}</div>
      )}

      <label>
        Email
        <input
          name="email"
          value={form.email}
          onChange={handleSignin}
          onBlur={handleBlur}
        />
      </label>
      {touch.email && errors.email && (
        <div role="alert">{errors.email}</div>
      )}
      <label>
        Password
        <input
          name="password"
          value={form.password}
          onChange={handleSignin}
          onBlur={handleBlur}
        />
      </label>
      {touch.password && errors.password && (
        <div role="alert">{errors.password}</div>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? "saving..." : "submit"}
      </button>
    </form>
    </div>
  );
}

export default SignIn;
