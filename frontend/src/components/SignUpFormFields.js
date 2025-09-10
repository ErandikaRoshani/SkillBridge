import { useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";

export default function SignUpFormFields() {
  const [formData, setFormData] = useState({
    role: "",
    name: "",
    domains: "",
    seniority: "",
    badges: "",
    interests: "",
    goals: "",
    experienceLevel: "",
    availabilitySlots: "",
    hourlyRate: "",
  });

  const handleChange = (e) => {
    const updatedForm = { ...formData, [e.target.name]: e.target.value };
    setFormData(updatedForm);
    localStorage.setItem("signupFormData", JSON.stringify(updatedForm));
    if (e.target.name === "role") localStorage.setItem("signupRole", e.target.value);
  };

  return (
    <>
      {/* Include default Amplify form fields */}
      <Authenticator.SignUp.FormFields />
      
      {/* Your custom fields */}
      <div style={{ marginTop: '1rem' }}>
        <label>Name:
          <input 
            type="text" 
            name="name" 
            required 
            onChange={handleChange} 
            style={{ display: 'block', width: '100%', padding: '0.5rem', margin: '0.5rem 0' }}
          />
        </label>

        <label>Role:
          <select 
            name="role" 
            required 
            onChange={handleChange} 
            style={{ display: 'block', width: '100%', padding: '0.5rem', margin: '0.5rem 0' }}
          >
            <option value="">-- Select --</option>
            <option value="mentor">Mentor</option>
            <option value="mentee">Mentee</option>
          </select>
        </label>

        {formData.role === "mentee" && (
          <>
            <input 
              type="text" 
              name="interests" 
              placeholder="Interests (e.g., frontend, system design)" 
              onChange={handleChange} 
              style={{ display: 'block', width: '100%', padding: '0.5rem', margin: '0.5rem 0' }}
            />
            <input 
              type="text" 
              name="goals" 
              placeholder="Goals (e.g., Get better at React)" 
              onChange={handleChange} 
              style={{ display: 'block', width: '100%', padding: '0.5rem', margin: '0.5rem 0' }}
            />
            <select 
              name="experienceLevel" 
              onChange={handleChange} 
              style={{ display: 'block', width: '100%', padding: '0.5rem', margin: '0.5rem 0' }}
            >
              <option value="">-- Select Experience Level --</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
            </select>
          </>
        )}

        {formData.role === "mentor" && (
          <>
            <input 
              type="text" 
              name="domains" 
              placeholder="Domains (e.g., backend, devops)" 
              onChange={handleChange} 
              style={{ display: 'block', width: '100%', padding: '0.5rem', margin: '0.5rem 0' }}
            />
            <select 
              name="seniority" 
              onChange={handleChange} 
              style={{ display: 'block', width: '100%', padding: '0.5rem', margin: '0.5rem 0' }}
            >
              <option value="">-- Select Seniority --</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
            </select>
            <input 
              type="number" 
              name="hourlyRate" 
              placeholder="Hourly Rate (e.g., 50)" 
              onChange={handleChange} 
              style={{ display: 'block', width: '100%', padding: '0.5rem', margin: '0.5rem 0' }}
            />
            <textarea 
              name="availabilitySlots" 
              placeholder="Availability Slots (e.g., Monday 18:00-20:00, Wednesday 19:00-21:00)" 
              onChange={handleChange} 
              style={{ display: 'block', width: '100%', padding: '0.5rem', margin: '0.5rem 0', minHeight: '80px' }}
            />
          </>
        )}
      </div>
    </>
  );
}