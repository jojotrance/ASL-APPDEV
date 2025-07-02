import React, { useState } from 'react';
import axios from 'axios';

function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    sex: 'rather not to say',
  });
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, val]) => data.append(key, val));
    if (photo) data.append('photo', photo);

    try {
      await axios.post('/api/v1/auth/register', data);
      window.location = '/login';
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input type="text" placeholder="Username" required onChange={e => setForm({ ...form, username: e.target.value })} />
        <input type="email" placeholder="Email" required onChange={e => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Password" required onChange={e => setForm({ ...form, password: e.target.value })} />
        
        <select onChange={e => setForm({ ...form, sex: e.target.value })}>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="rather not to say">Rather not to say</option>
        </select>

        <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} />

        <button type="submit">Register</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}

export default Register;