import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Landing from './pages/Landing.jsx';
import Learn from './pages/Learn.jsx';
import Alphabet from './pages/Alphabet.jsx';
import SignInput from './pages/SignInput.jsx';
import VideoPlayer from './pages/VideoPlayer.jsx';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/alphabet" element={<Alphabet />} />
        <Route path="/video" element={<VideoPlayer />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/sign-input" element={<SignInput />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;
