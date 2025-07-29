import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home.jsx';
import Home2 from './pages/Home2.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Landing from './pages/Landing.jsx';
import Learn from './pages/Learn.jsx';
import Alphabet from './pages/Alphabet.jsx';
import SignInput from './pages/SignInput.jsx';
import VideoPlayer from './pages/VideoPlayer.jsx';
import SignRecorder from './components/SignRecorder.jsx';
import ModelTrainer from './components/ModelTrainer.jsx';
import ASLDetectorPage from './pages/ASLDetectorPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Users from './pages/Users.jsx';
import PendingApproval from './pages/PendingApproval.jsx';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes - accessible to everyone */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          
          {/* Protected routes - only accessible when logged in */}
          <Route path="/home2" element={
            <ProtectedRoute>
              <Home2 />
            </ProtectedRoute>
          } />
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/learn" element={
            <ProtectedRoute>
              <Learn />
            </ProtectedRoute>
          } />
          <Route path="/alphabet" element={
            <ProtectedRoute>
              <Alphabet />
            </ProtectedRoute>
          } />
          <Route path="/video" element={
            <ProtectedRoute>
              <VideoPlayer />
            </ProtectedRoute>
          } />
          <Route path="/sign-input" element={
            <ProtectedRoute>
              <SignInput />
            </ProtectedRoute>
          } />
          <Route path="/asl-detector" element={
            <ProtectedRoute>
              <ASLDetectorPage />
            </ProtectedRoute>
          } />
          <Route path="/sign-recorder" element={
            <ProtectedRoute>
              <SignRecorder />
            </ProtectedRoute>
          } />
          <Route path="/model-trainer" element={
            <ProtectedRoute>
              <ModelTrainer />
            </ProtectedRoute>
          } />
          
          {/* Admin-only routes - only accessible to users with admin role */}
          <Route path="/dashboard" element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          } />
          <Route path="/users" element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<Landing />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
