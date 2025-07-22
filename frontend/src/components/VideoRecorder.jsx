import React, { useRef, useState } from 'react';

const VideoRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [videoURL, setVideoURL] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = stream;
    videoRef.current.srcObject = stream;
    const recorder = new window.MediaRecorder(stream);
    setMediaRecorder(recorder);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setVideoBlob(blob);
      setVideoURL(URL.createObjectURL(blob));
      stream.getTracks().forEach(track => track.stop());
    };
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const uploadVideo = async () => {
    if (!videoBlob) return;
    const formData = new FormData();
    formData.append('video', videoBlob, 'asl_recording.webm');
    try {
      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      alert(data.success ? 'Upload successful!' : 'Upload failed.');
    } catch (err) {
      alert('Upload error.');
    }
  };

  return (
    <div>
      <h2>ASL Video Recorder</h2>
      <video ref={videoRef} autoPlay playsInline style={{ width: '320px', height: '240px' }} />
      <div>
        {!recording && <button onClick={startRecording}>Start Recording</button>}
        {recording && <button onClick={stopRecording}>Stop Recording</button>}
      </div>
      {videoURL && (
        <div>
          <h3>Preview</h3>
          <video src={videoURL} controls style={{ width: '320px', height: '240px' }} />
          <button onClick={uploadVideo}>Upload Video</button>
        </div>
      )}
    </div>
  );
};

export default VideoRecorder;
