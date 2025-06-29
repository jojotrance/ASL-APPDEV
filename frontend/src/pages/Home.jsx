import React from 'react';
import WebcamHandTracker from '../components/WebcamHandTracker.jsx';

function Home() {
  return (
    <div className="container">
      <h1>ASL Translator</h1>
      <WebcamHandTracker />
    </div>
  );
}

export default Home;
