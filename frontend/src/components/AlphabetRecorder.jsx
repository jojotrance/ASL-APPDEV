import React, { useState, useRef, useEffect } from 'react';

const ASLRecorder = ({ onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState('category'); // category, setup, recording, processing, complete
  const [selectedCategory, setSelectedCategory] = useState('alphabet');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(1); // Track which repeat we're on
  const [recordingsPerSign, setRecordingsPerSign] = useState(3); // Number of recordings per sign
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [recordedVideos, setRecordedVideos] = useState({});
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [trainingStep, setTrainingStep] = useState('');
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  
  // Define all categories of signs to record
  const categories = {
    alphabet: {
      name: 'Alphabet',
      icon: '🔤',
      items: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
              'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
    },
    numbers: {
      name: 'Numbers',
      icon: '🔢', 
      items: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    },
    greetings: {
      name: 'Basic Greetings',
      icon: '👋',
      items: ['Hello', 'Goodbye', 'Please', 'Thank You', 'Sorry', 'You\'re Welcome']
    },
    common: {
      name: 'Common Words',
      icon: '💬',
      items: ['Yes', 'No', 'Help', 'More', 'Stop', 'Good', 'Bad', 'Water', 'Food', 'Home']
    },
    questions: {
      name: 'Question Words',
      icon: '❓',
      items: ['What', 'Where', 'When', 'Who', 'Why', 'How']
    }
  };
  
  const recordingDuration = 3000; // 3 seconds

  // Get current category data
  const getCurrentItems = () => categories[selectedCategory]?.items || [];
  const getCurrentCategoryName = () => categories[selectedCategory]?.name || '';
  const getCurrentIcon = () => categories[selectedCategory]?.icon || '';

  useEffect(() => {
    if (currentStep === 'setup') {
      initializeCamera();
    } else if (currentStep === 'recording' && videoRef.current && streamRef.current) {
      // Ensure video element has stream when entering recording step
      console.log('🔧 Re-assigning stream to video element for recording');
      
      const forceVideoSetup = () => {
        if (videoRef.current && streamRef.current) {
          console.log('🎯 Forcing video setup for recording step');
          
          // Clear any existing source first
          videoRef.current.srcObject = null;
          videoRef.current.load();
          
          // Wait a moment then reassign
          setTimeout(() => {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.muted = true;
            videoRef.current.autoplay = true;
            videoRef.current.playsInline = true;
            
            console.log('Stream reassigned, attempting to play...');
            
            const waitForMetadata = () => {
              return new Promise((resolve, reject) => {
                if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
                  console.log('✅ Video dimensions already loaded:', {
                    width: videoRef.current.videoWidth,
                    height: videoRef.current.videoHeight
                  });
                  resolve();
                  return;
                }
                
                let attempts = 0;
                const maxAttempts = 20;
                
                const checkDimensions = () => {
                  attempts++;
                  console.log(`🔍 Checking video dimensions (attempt ${attempts}):`, {
                    width: videoRef.current?.videoWidth || 0,
                    height: videoRef.current?.videoHeight || 0,
                    readyState: videoRef.current?.readyState || 0
                  });
                  
                  if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
                    console.log('✅ Video dimensions loaded successfully');
                    resolve();
                  } else if (attempts >= maxAttempts) {
                    console.error('❌ Failed to load video dimensions after', maxAttempts, 'attempts');
                    reject(new Error('Video dimensions not loading'));
                  } else {
                    setTimeout(checkDimensions, 100);
                  }
                };
                
                videoRef.current.addEventListener('loadedmetadata', () => {
                  console.log('📺 Metadata loaded event fired');
                  checkDimensions();
                }, { once: true });
                
                // Start checking immediately
                setTimeout(checkDimensions, 100);
              });
            };
            
            const playVideo = async () => {
              try {
                await waitForMetadata();
                await videoRef.current.play();
                console.log('✅ Video playing in recording step with dimensions:', {
                  width: videoRef.current.videoWidth,
                  height: videoRef.current.videoHeight
                });
              } catch (err) {
                if (err.name !== 'AbortError') {
                  console.error('❌ Error playing video in recording step:', err);
                  // Force refresh the stream
                  if (streamRef.current && videoRef.current) {
                    console.log('🔄 Refreshing stream due to error');
                    const tracks = streamRef.current.getVideoTracks();
                    if (tracks.length > 0) {
                      console.log('Track settings:', tracks[0].getSettings());
                    }
                    videoRef.current.srcObject = null;
                    setTimeout(() => {
                      videoRef.current.srcObject = streamRef.current;
                      videoRef.current.play().catch(console.error);
                    }, 200);
                  }
                }
              }
            };
            
            playVideo();
          }, 100);
        }
      };
      
      forceVideoSetup();
    }
    return () => {
      cleanup();
    };
  }, [currentStep]);

  const initializeCamera = async () => {
    try {
      setError('');
      setMessage('Initializing camera...');
      console.log('Starting camera initialization...');
      
      // First check if camera permissions are available
      const permissions = await navigator.permissions.query({ name: 'camera' });
      console.log('Camera permission status:', permissions.state);
      
      // Try multiple constraint configurations
      const constraintSets = [
        // First try: Exact dimensions
        {
          video: { 
            width: { exact: 640 },
            height: { exact: 480 },
            facingMode: 'user',
            frameRate: { exact: 30 }
          },
          audio: false
        },
        // Second try: Ideal dimensions with range
        {
          video: { 
            width: { ideal: 640, min: 320, max: 1280 }, 
            height: { ideal: 480, min: 240, max: 720 },
            facingMode: 'user',
            frameRate: { ideal: 30, min: 15 }
          },
          audio: false
        },
        // Third try: Basic constraints
        {
          video: { 
            facingMode: 'user'
          },
          audio: false
        }
      ];
      
      let stream = null;
      let constraintsUsed = null;
      
      for (let i = 0; i < constraintSets.length; i++) {
        try {
          console.log(`Trying constraint set ${i + 1}:`, constraintSets[i]);
          stream = await navigator.mediaDevices.getUserMedia(constraintSets[i]);
          constraintsUsed = constraintSets[i];
          console.log('✅ Stream obtained with constraint set', i + 1);
          break;
        } catch (err) {
          console.log(`❌ Constraint set ${i + 1} failed:`, err.message);
          if (i === constraintSets.length - 1) {
            throw err; // If all failed, throw the last error
          }
        }
      }
      
      if (!stream) {
        throw new Error('Failed to obtain camera stream with any constraint set');
      }
      
      console.log('Camera stream obtained:', stream);
      console.log('Stream tracks:', stream.getTracks().map(track => ({
        kind: track.kind,
        enabled: track.enabled,
        readyState: track.readyState,
        settings: track.getSettings ? track.getSettings() : 'not supported'
      })));
      
      // Log actual video track settings
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        console.log('Video track settings:', videoTrack.getSettings());
        console.log('Video track constraints:', videoTrack.getConstraints());
      }
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        console.log('Video element found, assigning stream');
        
        // Reset video element completely
        videoRef.current.srcObject = null;
        videoRef.current.load();
        
        // Assign stream after brief delay
        setTimeout(() => {
          videoRef.current.srcObject = stream;
          
          // Force video properties
          videoRef.current.muted = true;
          videoRef.current.autoplay = true;
          videoRef.current.playsInline = true;
          videoRef.current.controls = false;
          
          console.log('Video element properties set');
          
          // Multiple event handlers for better debugging
          videoRef.current.onloadstart = () => console.log('Video load started');
          videoRef.current.onloadeddata = () => console.log('Video data loaded');
          videoRef.current.oncanplay = () => console.log('Video can play');
          videoRef.current.oncanplaythrough = () => console.log('Video can play through');
          videoRef.current.onplay = () => console.log('Video play event fired');
          videoRef.current.onplaying = () => console.log('Video is playing');
          videoRef.current.onerror = (e) => console.error('Video error:', e);
          
          // Wait for proper video dimensions
          const waitForDimensions = () => {
            return new Promise((resolve, reject) => {
              let attempts = 0;
              const maxAttempts = 50; // Increased attempts
              
              const checkDimensions = () => {
                attempts++;
                const width = videoRef.current?.videoWidth || 0;
                const height = videoRef.current?.videoHeight || 0;
                
                console.log(`🔍 Dimension check ${attempts}/${maxAttempts}:`, {
                  width,
                  height,
                  readyState: videoRef.current?.readyState
                });
                
                if (width > 50 && height > 50) { // More reasonable minimum
                  console.log('✅ Video dimensions loaded successfully:', { width, height });
                  resolve({ width, height });
                } else if (attempts >= maxAttempts) {
                  console.error('❌ Video dimensions failed to load properly');
                  reject(new Error(`Video dimensions too small after ${maxAttempts} attempts: ${width}x${height}`));
                } else {
                  setTimeout(checkDimensions, 200); // Longer delay between checks
                }
              };
              
              // Start checking
              checkDimensions();
            });
          };
          
          // Ensure video plays after metadata loads
          const handleLoadedMetadata = async () => {
            console.log('Video metadata loaded');
            
            try {
              await waitForDimensions();
              
              const playAttempt = async () => {
                try {
                  await videoRef.current.play();
                  console.log('✅ Video playing successfully with dimensions:', {
                    width: videoRef.current.videoWidth,
                    height: videoRef.current.videoHeight
                  });
                  setMessage('Camera ready! Click "Start Recording" to begin.');
                } catch (err) {
                  console.error('Error playing video:', err);
                  if (err.name !== 'AbortError') {
                    setError('Failed to start video playback: ' + err.message);
                  }
                }
              };
              
              await playAttempt();
              
            } catch (err) {
              console.error('Failed to get proper video dimensions:', err);
              setError('Camera dimensions error: ' + err.message + ' - System will auto-restart when you click Start Recording');
            }
          };
          
          if (videoRef.current.readyState >= 1) {
            console.log('Video metadata already loaded');
            handleLoadedMetadata();
          } else {
            console.log('Waiting for video metadata to load');
            videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
          }
          
          // Extended backup timeout
          setTimeout(() => {
            if (videoRef.current && (videoRef.current.videoWidth <= 50 || videoRef.current.videoHeight <= 50)) {
              console.warn('🚨 Video dimensions still too small after timeout, will auto-restart on recording');
              setError('Video dimensions are small. System will auto-restart when you start recording.');
            }
          }, 8000); // Longer timeout
          
        }, 100);
        
      } else {
        console.error('Video ref not available');
        setError('Video element not found');
      }
    } catch (err) {
      setError('Failed to access camera. Please check permissions and try again.');
      console.error('Camera error:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        constraint: err.constraint
      });
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = () => {
    const currentItems = getCurrentItems();
    
    // Check if we've completed all signs
    if (currentIndex >= currentItems.length) {
      setCurrentStep('processing');
      processVideos();
      return;
    }

    console.log(`🎬 Starting recording process for ${currentItems[currentIndex]} (recording ${currentRepeat}/${recordingsPerSign})...`);
    
    // Auto-check and restart camera if needed
    const autoRestartIfNeeded = async () => {
      // Check if stream exists and is active
      if (!streamRef.current) {
        console.log('🔄 No stream detected, initializing camera...');
        await initializeCamera();
        return;
      }
      
      const videoTracks = streamRef.current.getVideoTracks();
      if (videoTracks.length === 0 || videoTracks[0].readyState === 'ended') {
        console.log('🔄 Camera stream ended, restarting automatically...');
        setMessage('Camera disconnected, restarting automatically...');
        
        // Stop existing tracks
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        // Clear video element
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.load();
        }
        
        // Wait a moment then restart
        await new Promise(resolve => setTimeout(resolve, 500));
        await initializeCamera();
        
        // Wait for camera to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        return;
      }
      
      // Check video dimensions
      if (!videoRef.current || videoRef.current.videoWidth <= 50 || videoRef.current.videoHeight <= 50) {
        console.log('🔄 Video dimensions too small, refreshing...');
        setMessage('Refreshing video feed...');
        
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = null;
          setTimeout(() => {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(console.error);
          }, 200);
          
          // Wait for dimensions to load
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    };
    
    // Auto-restart camera if needed, then proceed
    autoRestartIfNeeded().then(() => {
      // Verify everything is ready after auto-restart
      if (!streamRef.current) {
        setError('Camera auto-restart failed. Please try again.');
        return;
      }
      
      if (!videoRef.current || videoRef.current.videoWidth <= 50 || videoRef.current.videoHeight <= 50) {
        setError('Video feed not ready. Please try again.');
        return;
      }
      
      console.log('✅ Pre-recording checks passed:', {
        streamActive: !!streamRef.current,
        videoDimensions: {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight
        },
        videoPlaying: !videoRef.current.paused
      });
      
      setCurrentStep('recording');
      setError('');
      
      // Ensure video stream is active and playing before starting countdown
      if (videoRef.current && streamRef.current) {
        console.log('🔧 Ensuring video stream is connected before recording');
        
        // Verify the video is actually playing
        if (videoRef.current.paused) {
          console.log('📺 Video was paused, attempting to play');
          videoRef.current.play().catch(err => {
            if (err.name !== 'AbortError') {
              console.error('Error ensuring video before recording:', err);
              setError('Video not playing. Please try again.');
              return;
            }
          });
        }
        
        // Double-check stream assignment
        if (videoRef.current.srcObject !== streamRef.current) {
          console.log('🔄 Re-assigning stream before recording');
          videoRef.current.srcObject = streamRef.current;
        }
      }
      
      // Start countdown
      let count = 3;
      setCountdown(count);
      
      const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
        } else {
          setCountdown(null);
          clearInterval(countdownInterval);
          startActualRecording();
        }
      }, 1000);
      
    }).catch(err => {
      console.error('❌ Auto-restart failed:', err);
      setError('Camera setup failed: ' + err.message + ' - Please try again.');
    });
  };

  const startActualRecording = () => {
    try {
      chunksRef.current = [];
      
      // Verify stream is available and has video tracks
      if (!streamRef.current) {
        setError('No camera stream available - restarting automatically...');
        setIsRecording(false);
        // Auto-restart and retry
        setTimeout(() => {
          startRecording();
        }, 1000);
        return;
      }
      
      const videoTracks = streamRef.current.getVideoTracks();
      if (videoTracks.length === 0) {
        setError('No video tracks available - restarting camera...');
        setIsRecording(false);
        // Auto-restart and retry
        setTimeout(() => {
          startRecording();
        }, 1000);
        return;
      }
      
      // Check if video tracks are still active
      const activeTrack = videoTracks[0];
      if (activeTrack.readyState === 'ended') {
        setError('Camera stream ended - restarting automatically...');
        setIsRecording(false);
        // Auto-restart and retry
        setTimeout(() => {
          startRecording();
        }, 1000);
        return;
      }
      
      console.log('🎬 Starting recording with stream:', {
        streamId: streamRef.current.id,
        videoTracks: videoTracks.length,
        trackSettings: videoTracks[0].getSettings(),
        trackState: videoTracks[0].readyState,
        trackEnabled: videoTracks[0].enabled
      });
      
      // Check MediaRecorder support and find best codec
      const testCodecs = [
        'video/webm;codecs=vp8',
        'video/webm;codecs=h264',
        'video/webm',
        'video/mp4;codecs=h264',
        'video/mp4',
        '' // No codec specified - let browser choose
      ];
      
      let selectedOptions = null;
      let supportedCodec = null;
      
      for (const codec of testCodecs) {
        try {
          const options = codec ? { mimeType: codec } : {};
          
          // Test if we can create MediaRecorder with this codec
          let testRecorder = new MediaRecorder(streamRef.current, options);
          testRecorder = null; // Clean up test
          
          selectedOptions = options;
          supportedCodec = codec || 'default';
          console.log('✅ MediaRecorder supports codec:', supportedCodec);
          break;
        } catch (err) {
          console.log(`❌ Codec ${codec || 'default'} not supported:`, err.message);
          continue;
        }
      }
      
      if (!selectedOptions) {
        console.error('❌ No supported MediaRecorder codecs found');
        setError('MediaRecorder not supported by your browser. Try Chrome or Firefox.');
        setIsRecording(false);
        return;
      }
      
      console.log('🎥 Creating MediaRecorder with options:', selectedOptions);
      
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(streamRef.current, selectedOptions);
      } catch (err) {
        console.error('❌ Failed to create MediaRecorder:', err);
        // Try without any options as last resort
        try {
          console.log('🔄 Retrying MediaRecorder without options...');
          mediaRecorder = new MediaRecorder(streamRef.current);
          console.log('✅ MediaRecorder created without options');
        } catch (err2) {
          console.error('❌ MediaRecorder creation failed completely:', err2);
          setError('Cannot create video recorder. Your browser may not support video recording.');
          setIsRecording(false);
          return;
        }
      }
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('📦 Data chunk received:', {
          size: event.data.size,
          type: event.data.type
        });
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstart = () => {
        console.log('🎬 MediaRecorder started successfully');
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event.error);
        setError('Recording error: ' + (event.error?.message || 'Unknown recording error'));
        setIsRecording(false);
      };
      
      mediaRecorder.onstop = () => {
        console.log('📹 Recording stopped, creating blob...');
        console.log('Total chunks collected:', chunksRef.current.length);
        
        if (chunksRef.current.length === 0) {
          console.error('❌ No video data recorded!');
          setError('No video data was recorded. Please try again.');
          setIsRecording(false);
          return;
        }
        
        // Use the MediaRecorder's actual mimeType for the blob
        const blobType = mediaRecorder.mimeType || selectedOptions?.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        
        console.log('📦 Blob created:', {
          size: blob.size,
          type: blob.type
        });
        
        if (blob.size === 0) {
          console.error('❌ Empty video blob created!');
          setError('Empty video recorded. Please try again.');
          setIsRecording(false);
          return;
        }
        
        const videoUrl = URL.createObjectURL(blob);
        const currentItems = getCurrentItems();
        const currentItem = currentItems[currentIndex];
        
        console.log(`💾 Video recorded for ${currentItem}:`, {
          size: blob.size,
          type: blob.type,
          duration: recordingDuration / 1000 + 's'
        });
        
        setRecordedVideos(prev => ({
          ...prev,
          [`${selectedCategory}_${currentItem}_${currentRepeat}`]: {
            blob: blob,
            url: videoUrl,
            item: currentItem,
            category: selectedCategory,
            repeat: currentRepeat
          }
        }));
        
        setIsRecording(false);
        
        // Check if we need more recordings for this sign
        if (currentRepeat < recordingsPerSign) {
          // More recordings needed for current sign
          setCurrentRepeat(prev => prev + 1);
          setMessage(`${currentItem} recording ${currentRepeat} complete! Recording ${currentRepeat + 1}/${recordingsPerSign}...`);
          setCurrentStep('setup');
        } else {
          // All recordings for this sign complete, move to next sign
          setCurrentRepeat(1); // Reset repeat counter
          setCurrentIndex(prev => prev + 1);
          
          const totalRecordings = getCurrentItems().length * recordingsPerSign;
          const completedRecordings = currentIndex * recordingsPerSign + recordingsPerSign;
          setProgress((completedRecordings / totalRecordings) * 100);
          
          if (currentIndex + 1 >= currentItems.length) {
            setMessage(`All ${getCurrentCategoryName().toLowerCase()} recorded! Processing...`);
            setTimeout(() => {
              setCurrentStep('processing');
              processVideos();
            }, 1000);
          } else {
            setMessage(`${currentItem} complete (${recordingsPerSign} recordings)! Next: ${currentItems[currentIndex + 1]}`);
            setCurrentStep('setup');
          }
        }
      };
      
      setIsRecording(true);
      setMessage(`Recording ${getCurrentItems()[currentIndex]}...`);
      
      // Start recording - try with and without time slice
      try {
        console.log('🎬 Starting MediaRecorder...');
        mediaRecorder.start(1000); // Try 1 second time slices first
        console.log('✅ MediaRecorder started with 1s time slices');
      } catch (err) {
        console.warn('⚠️ Time slice start failed, trying without:', err.message);
        try {
          mediaRecorder.start();
          console.log('✅ MediaRecorder started without time slices');
        } catch (err2) {
          console.error('❌ MediaRecorder start failed completely:', err2);
          setError('Failed to start recording: ' + err2.message);
          setIsRecording(false);
          return;
        }
      }
      
      // Stop recording after duration
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log('⏹️ Stopping recording after', recordingDuration, 'ms');
          try {
            mediaRecorderRef.current.stop();
          } catch (err) {
            console.error('Error stopping recording:', err);
          }
        }
      }, recordingDuration);
      
    } catch (err) {
      console.error('❌ Recording setup error:', err);
      setError('Failed to setup recording: ' + err.message);
      setIsRecording(false);
    }
  };

  const skipItem = () => {
    const currentItems = getCurrentItems();
    setCurrentIndex(prev => prev + 1);
    setProgress(((currentIndex + 1) / currentItems.length) * 100);
    
    if (currentIndex + 1 >= currentItems.length) {
      setCurrentStep('processing');
      processVideos();
    } else {
      setMessage(`Skipped ${currentItems[currentIndex]}. Next: ${currentItems[currentIndex + 1]}`);
    }
  };

  const retryItem = () => {
    if (currentIndex > 0) {
      const currentItems = getCurrentItems();
      setCurrentIndex(prev => prev - 1);
      setProgress((currentIndex / currentItems.length) * 100);
      setMessage(`Retry recording for ${currentItems[currentIndex - 1]}`);
    }
  };

  const processVideos = async () => {
    setMessage('Processing videos and training model...');
    setTrainingStep('📤 Uploading videos to server...');
    
    try {
      // Create FormData to send videos to backend
      const formData = new FormData();
      
      Object.entries(recordedVideos).forEach(([key, videoData]) => {
        formData.append(`video_${key}`, videoData.blob, `${key}.webm`);
        formData.append(`item_${key}`, videoData.item);
        formData.append(`category_${key}`, videoData.category);
      });
      
      formData.append('selectedCategory', selectedCategory);
      
      setTrainingStep('🚀 Sending videos to backend for processing...');
      
      // Send to backend for processing
      console.log('📡 Sending videos to backend for training...');
      const response = await fetch('http://localhost:5000/api/train-signs', {
        method: 'POST',
        body: formData
      });
      
      console.log('📡 Backend response status:', response.status);
      
      setTrainingStep('🤖 Training machine learning model...');
      
      if (response.ok) {
        const result = await response.json();
        console.log('🎉 Training completed:', result);
        setTrainingStep('✅ Training completed successfully!');
        setMessage(`Training complete! Model accuracy: ${(result.accuracy * 100).toFixed(1)}%`);
        setCurrentStep('complete');
        
        if (onComplete) {
          onComplete(result);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Backend error:', errorText);
        setTrainingStep('❌ Training failed');
        throw new Error(`Failed to process videos: ${response.status} ${errorText}`);
      }
      
    } catch (err) {
      setError('Failed to process videos: ' + err.message);
      setTrainingStep('❌ Training failed');
      console.error('Processing error:', err);
    }
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '20px',
      padding: '2rem',
      maxWidth: '800px',
      width: '90%',
      maxHeight: '90vh',
      overflowY: 'auto',
      position: 'relative'
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem'
    },
    title: {
      fontSize: '2rem',
      color: '#333',
      margin: '0 0 1rem 0'
    },
    closeBtn: {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      backgroundColor: '#FF6B6B',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      cursor: 'pointer',
      fontSize: '1.2rem'
    },
    videoContainer: {
      textAlign: 'center',
      marginBottom: '2rem',
      position: 'relative',
      backgroundColor: '#f0f0f0',
      borderRadius: '10px',
      minHeight: '360px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    video: {
      width: '100%',
      maxWidth: '640px',
      height: 'auto',
      borderRadius: '10px',
      transform: 'scaleX(-1)', // Mirror effect
      backgroundColor: 'transparent', // Changed from black to transparent
      objectFit: 'cover' // Ensure video covers the area properly
    },
    progressBar: {
      width: '100%',
      height: '20px',
      backgroundColor: '#f0f0f0',
      borderRadius: '10px',
      overflow: 'hidden',
      marginBottom: '1rem'
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#4CAF50',
      width: `${progress}%`,
      transition: 'width 0.3s ease'
    },
    letterDisplay: {
      fontSize: '4rem',
      fontWeight: 'bold',
      color: '#667eea',
      textAlign: 'center',
      marginBottom: '1rem'
    },
    countdown: {
      fontSize: '6rem',
      fontWeight: 'bold',
      color: '#FF6B6B',
      textAlign: 'center',
      margin: '2rem 0'
    },
    countdownOverlay: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '4rem',
      fontWeight: 'bold',
      color: '#FF6B6B',
      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
      zIndex: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: '1rem 2rem',
      borderRadius: '50%',
      width: '120px',
      height: '120px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    recordingOverlay: {
      position: 'absolute',
      top: '20px',
      left: '20px',
      backgroundColor: 'rgba(244, 67, 54, 0.9)',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      fontSize: '1rem',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      zIndex: 10
    },
    message: {
      textAlign: 'center',
      fontSize: '1.2rem',
      margin: '1rem 0',
      color: '#333'
    },
    error: {
      textAlign: 'center',
      fontSize: '1rem',
      margin: '1rem 0',
      color: '#F44336',
      backgroundColor: '#FFEBEE',
      padding: '1rem',
      borderRadius: '8px'
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
      marginTop: '2rem',
      flexWrap: 'wrap'
    },
    button: {
      padding: '1rem 2rem',
      border: 'none',
      borderRadius: '50px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: 'bold',
      transition: 'all 0.3s ease'
    },
    primaryBtn: {
      backgroundColor: '#4CAF50',
      color: 'white'
    },
    secondaryBtn: {
      backgroundColor: '#2196F3',
      color: 'white'
    },
    warningBtn: {
      backgroundColor: '#FF9800',
      color: 'white'
    },
    recordingIndicator: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      color: '#F44336',
      fontSize: '1.2rem',
      fontWeight: 'bold'
    },
    recordingDot: {
      width: '12px',
      height: '12px',
      backgroundColor: '#F44336',
      borderRadius: '50%',
      animation: 'pulse 1s infinite'
    },
    instructions: {
      backgroundColor: '#E3F2FD',
      padding: '1.5rem',
      borderRadius: '10px',
      marginBottom: '2rem'
    },
    instructionsList: {
      margin: '1rem 0',
      paddingLeft: '1.5rem'
    },
    completeSummary: {
      textAlign: 'center',
      padding: '2rem'
    },
    successIcon: {
      fontSize: '4rem',
      color: '#4CAF50',
      marginBottom: '1rem'
    },
    categoryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem'
    },
    categoryCard: {
      padding: '1.5rem',
      border: '2px solid #e0e0e0',
      borderRadius: '15px',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.3s ease',
      backgroundColor: '#f9f9f9'
    },
    categoryCardSelected: {
      borderColor: '#4CAF50',
      backgroundColor: '#E8F5E8'
    },
    categoryIcon: {
      fontSize: '3rem',
      marginBottom: '0.5rem'
    },
    categoryName: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      color: '#333',
      marginBottom: '0.5rem'
    },
    categoryCount: {
      fontSize: '0.9rem',
      color: '#666'
    }
  };

  const renderCategoryStep = () => (
    <>
      <div style={styles.instructions}>
        <h3>📋 Choose What to Record</h3>
        <p>Select the category of signs you want to record and train your model with:</p>
      </div>
      
      <div style={styles.categoryGrid}>
        {Object.entries(categories).map(([key, category]) => (
          <div
            key={key}
            style={{
              ...styles.categoryCard,
              ...(selectedCategory === key ? styles.categoryCardSelected : {})
            }}
            onClick={() => {
              setSelectedCategory(key);
              setCurrentIndex(0);
              setCurrentRepeat(1);
              setProgress(0);
            }}
          >
            <div style={styles.categoryIcon}>{category.icon}</div>
            <div style={styles.categoryName}>{category.name}</div>
            <div style={styles.categoryCount}>
              {category.items.length} items
            </div>
          </div>
        ))}
      </div>
      
      {selectedCategory && (
        <>
          <div style={styles.message}>
            Selected: {getCurrentCategoryName()} ({getCurrentItems().length} items)
          </div>
          
          <div style={{
            margin: '20px 0',
            padding: '20px',
            backgroundColor: '#e3f2fd',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <h4>📊 Recordings per Sign</h4>
            <p>More recordings = better accuracy! Recommended: 3-5 recordings per sign</p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              margin: '15px 0'
            }}>
              {[1, 3, 5, 8, 10].map(num => (
                <button
                  key={num}
                  onClick={() => setRecordingsPerSign(num)}
                  style={{
                    padding: '10px 15px',
                    border: recordingsPerSign === num ? '2px solid #4CAF50' : '1px solid #ccc',
                    borderRadius: '25px',
                    backgroundColor: recordingsPerSign === num ? '#E8F5E8' : 'white',
                    cursor: 'pointer',
                    fontWeight: recordingsPerSign === num ? 'bold' : 'normal'
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
            <div style={{fontSize: '14px', color: '#666'}}>
              Total recordings: {getCurrentItems().length} × {recordingsPerSign} = {getCurrentItems().length * recordingsPerSign}
            </div>
          </div>
        </>
      )}
      
      <div style={styles.buttonGroup}>
        <button 
          style={{...styles.button, ...styles.primaryBtn}}
          onClick={() => setCurrentStep('setup')}
          disabled={!selectedCategory}
        >
          📹 Start Recording ({recordingsPerSign} per sign)
        </button>
      </div>
    </>
  );

  const renderSetupContent = () => (
    <>
      <div style={styles.instructions}>
        <h3>📋 Recording Instructions</h3>
        <ul style={styles.instructionsList}>
          <li>Position your hand clearly in the camera frame</li>
          <li>Each letter will be recorded for 3 seconds</li>
          <li>Hold the sign steady during recording</li>
          <li>Make sure you have good lighting</li>
          <li>Record {recordingsPerSign} different variations for better accuracy</li>
        </ul>
      </div>
      
      <div style={styles.letterDisplay}>
        {currentIndex < getCurrentItems().length ? getCurrentItems()[currentIndex] : 'Complete!'}
      </div>
      
      {currentIndex < getCurrentItems().length && (
        <div style={{
          textAlign: 'center',
          margin: '10px 0',
          padding: '10px',
          backgroundColor: '#f0f8ff',
          borderRadius: '8px',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          color: '#1976d2'
        }}>
          Recording {currentRepeat} of {recordingsPerSign} for "{getCurrentItems()[currentIndex]}"
        </div>
      )}
      
      <div style={styles.message}>
        {message}
      </div>
      
      {error && <div style={styles.error}>{error}</div>}
      
      <div style={styles.buttonGroup}>
        <button 
          style={{...styles.button, ...styles.primaryBtn}}
          onClick={startRecording}
          disabled={currentIndex >= getCurrentItems().length}
        >
          🎬 Start Recording
        </button>
        <button 
          style={{...styles.button, ...styles.warningBtn}}
          onClick={skipItem}
          disabled={currentIndex >= getCurrentItems().length}
        >
          ⏭️ Skip Item
        </button>
        <button 
          style={{...styles.button, ...styles.secondaryBtn}}
          onClick={retryItem}
          disabled={currentIndex === 0}
        >
          🔄 Retry Previous
        </button>
        <button 
          style={{...styles.button, backgroundColor: '#ff9800', color: 'white'}}
          onClick={() => {
            console.log('🔧 Manual video fix triggered');
            if (videoRef.current && streamRef.current) {
              videoRef.current.srcObject = streamRef.current;
              videoRef.current.play().catch(console.error);
            }
          }}
        >
          🔧 Test Camera
        </button>
        <button 
          style={{...styles.button, backgroundColor: '#9c27b0', color: 'white'}}
          onClick={async () => {
            console.log('🧪 Test recording triggered');
            if (!streamRef.current) {
              setError('No camera stream. System will auto-restart when you start recording.');
              return;
            }
            
            try {
              const testChunks = [];
              
              // Find supported codec for test recording
              const testCodecs = [
                'video/webm;codecs=vp8',
                'video/webm;codecs=h264', 
                'video/webm',
                'video/mp4;codecs=h264',
                'video/mp4',
                '' // No codec
              ];
              
              let testRecorder = null;
              let usedCodec = null;
              
              for (const codec of testCodecs) {
                try {
                  const options = codec ? { mimeType: codec } : {};
                  testRecorder = new MediaRecorder(streamRef.current, options);
                  usedCodec = codec || 'default';
                  console.log('🧪 Test using codec:', usedCodec);
                  break;
                } catch (err) {
                  console.log('🧪 Test codec failed:', codec || 'default', err.message);
                  continue;
                }
              }
              
              if (!testRecorder) {
                setError('Cannot create test recorder - MediaRecorder not supported');
                return;
              }
              
              testRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                  testChunks.push(event.data);
                  console.log('🧪 Test chunk:', event.data.size, 'bytes');
                }
              };
              
              testRecorder.onstop = () => {
                const testBlob = new Blob(testChunks, { 
                  type: testRecorder.mimeType || 'video/webm' 
                });
                console.log('🧪 Test recording result:', {
                  chunks: testChunks.length,
                  size: testBlob.size,
                  type: testBlob.type,
                  codec: usedCodec
                });
                
                if (testBlob.size > 0) {
                  const testUrl = URL.createObjectURL(testBlob);
                  const link = document.createElement('a');
                  link.href = testUrl;
                  link.download = 'test-recording.webm';
                  link.click();
                  setMessage(`Test recording saved! Used codec: ${usedCodec}`);
                } else {
                  setError('Test recording failed - no data captured.');
                }
              };
              
              testRecorder.onerror = (event) => {
                console.error('🧪 Test recording error:', event.error);
                setError('Test recording error: ' + (event.error?.message || 'Unknown'));
              };
              
              setMessage('Test recording for 2 seconds...');
              
              try {
                testRecorder.start(1000);
                console.log('🧪 Test started with 1s slices');
              } catch (err) {
                console.log('🧪 Fallback to no time slices');
                testRecorder.start();
              }
              
              setTimeout(() => {
                try {
                  testRecorder.stop();
                } catch (err) {
                  console.error('Error stopping test recording:', err);
                }
              }, 2000);
              
            } catch (err) {
              setError('Test recording failed: ' + err.message);
              console.error('🧪 Test recording error:', err);
            }
          }}
        >
          🧪 Test Record
        </button>
        <button 
          style={{...styles.button, ...styles.secondaryBtn}}
          onClick={() => setCurrentStep('category')}
        >
          ⬅️ Back to Categories
        </button>
      </div>
    </>
  );

  const renderRecordingContent = () => (
    <>
      <div style={styles.letterDisplay}>
        {getCurrentItems()[currentIndex]}
      </div>
      
      <div style={styles.message}>
        {message}
      </div>
      
      {/* Debug info */}
      <div style={{fontSize: '0.8rem', color: '#666', marginTop: '1rem'}}>
        Debug: Stream active: {streamRef.current ? 'Yes' : 'No'} | 
        Video src: {videoRef.current?.srcObject ? 'Set' : 'Not set'} | 
        Video ready: {videoRef.current?.readyState || 'Unknown'}
        
        <button 
          style={{
            marginLeft: '1rem', 
            padding: '4px 8px', 
            fontSize: '0.7rem',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onClick={() => {
            console.log('🔧 Manual video fix triggered during recording');
            if (videoRef.current && streamRef.current) {
              videoRef.current.srcObject = streamRef.current;
              videoRef.current.muted = true;
              videoRef.current.autoplay = true;
              videoRef.current.playsInline = true;
              videoRef.current.play().catch(console.error);
            }
          }}
        >
          Fix Video
        </button>
      </div>
    </>
  );

  const renderProcessingStep = () => (
    <div style={styles.completeSummary}>
      <div style={{fontSize: '4rem', marginBottom: '1rem'}}>⚙️</div>
      <h3>Processing Videos...</h3>
      <p>Extracting features and training the model. This may take a few minutes.</p>
      <div style={styles.message}>{message}</div>
      
      {/* Training Step Display */}
      {trainingStep && (
        <div style={{
          margin: '2rem 0',
          padding: '1.5rem',
          backgroundColor: '#e3f2fd',
          borderRadius: '10px',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          color: '#1976d2'
        }}>
          {trainingStep}
        </div>
      )}
      
      {error && <div style={styles.error}>{error}</div>}
    </div>
  );

  const renderCompleteStep = () => (
    <div style={styles.completeSummary}>
      <div style={styles.successIcon}>🎉</div>
      <h3>Training Complete!</h3>
      <p>Your personalized ASL alphabet model is ready!</p>
      <div style={styles.message}>{message}</div>
      
      <div style={styles.buttonGroup}>
        <button 
          style={{...styles.button, ...styles.primaryBtn}}
          onClick={onClose}
        >
          ✅ Start Learning
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={onClose}>×</button>
        
        <div style={styles.header}>
          <h2 style={styles.title}>
            🎬 Record ASL Signs - {getCurrentCategoryName()}
          </h2>
          
          <div style={styles.progressBar}>
            <div style={styles.progressFill}></div>
          </div>
          
          <p>{Math.round(progress)}% Complete ({((currentIndex * recordingsPerSign) + (currentRepeat - 1))}/{getCurrentItems().length * recordingsPerSign} recordings)</p>
        </div>

        {/* PERSISTENT VIDEO CONTAINER - Always rendered */}
        {(currentStep === 'setup' || currentStep === 'recording') && (
          <div style={styles.videoContainer}>
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline
              style={styles.video}
              onLoadedMetadata={() => console.log('📺 Video metadata loaded in render')}
              onCanPlay={() => console.log('📺 Video can play in render')}
              onPlay={() => console.log('📺 Video play event in render')}
              onPlaying={() => console.log('📺 Video is playing in render')}
              onError={(e) => console.error('📺 Video error in render:', e)}
            />
            
            {/* Enhanced debug overlay */}
            <div style={{
              position: 'absolute', 
              top: '10px', 
              right: '10px', 
              backgroundColor: 'rgba(0,0,0,0.8)', 
              color: 'white', 
              padding: '8px 12px', 
              borderRadius: '8px',
              fontSize: '0.75rem',
              lineHeight: '1.2',
              minWidth: '220px'
            }}>
              <div>{streamRef.current ? '🟢 Camera Active' : '🔴 No Camera'}</div>
              <div>Video Ready: {videoRef.current?.readyState || 'Unknown'}</div>
              <div>Video Width: {videoRef.current?.videoWidth || 0}</div>
              <div>Video Height: {videoRef.current?.videoHeight || 0}</div>
              <div>Current Time: {videoRef.current?.currentTime?.toFixed(2) || 0}</div>
              <div>Paused: {videoRef.current?.paused ? 'Yes' : 'No'}</div>
              <div>SrcObject: {videoRef.current?.srcObject ? 'Set' : 'Not set'}</div>
              <div>Step: {currentStep}</div>
              
              {/* Force stream assignment button */}
              <button 
                style={{
                  marginTop: '5px',
                  padding: '2px 6px',
                  fontSize: '0.6rem',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  width: '100%'
                }}
                onClick={async () => {
                  console.log('🚨 EMERGENCY CAMERA RESTART');
                  try {
                    // Step 1: Completely stop existing stream
                    if (streamRef.current) {
                      console.log('🛑 Stopping all tracks');
                      streamRef.current.getTracks().forEach(track => {
                        track.stop();
                        console.log('Track stopped:', track.kind, track.readyState);
                      });
                      streamRef.current = null;
                    }
                    
                    // Step 2: Clear video element
                    if (videoRef.current) {
                      console.log('🧹 Clearing video element');
                      videoRef.current.srcObject = null;
                      videoRef.current.load();
                    }
                    
                    // Step 3: Wait a moment for cleanup
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Step 4: Request new camera stream with specific constraints
                    console.log('🎥 Requesting new camera stream');
                    const newConstraints = {
                      video: {
                        width: { exact: 640 },
                        height: { exact: 480 },
                        facingMode: 'user',
                        frameRate: { exact: 30 }
                      },
                      audio: false
                    };
                    
                    const newStream = await navigator.mediaDevices.getUserMedia(newConstraints);
                    console.log('✅ New stream obtained:', {
                      tracks: newStream.getTracks().length,
                      videoTracks: newStream.getVideoTracks().length,
                      settings: newStream.getVideoTracks()[0]?.getSettings()
                    });
                    
                    streamRef.current = newStream;
                    
                    // Step 5: Assign to video element with proper setup
                    if (videoRef.current) {
                      videoRef.current.srcObject = newStream;
                      videoRef.current.muted = true;
                      videoRef.current.autoplay = true;
                      videoRef.current.playsInline = true;
                      
                      // Step 6: Wait for metadata and verify dimensions
                      await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                          reject(new Error('Timeout waiting for video metadata'));
                        }, 5000);
                        
                        const handleMetadata = () => {
                          clearTimeout(timeout);
                          const width = videoRef.current.videoWidth;
                          const height = videoRef.current.videoHeight;
                          console.log('📏 New video dimensions:', { width, height });
                          
                          if (width > 100 && height > 100) {
                            console.log('✅ Emergency restart successful!');
                            resolve();
                          } else {
                            reject(new Error(`Still bad dimensions: ${width}x${height}`));
                          }
                        };
                        
                        if (videoRef.current.readyState >= 1) {
                          handleMetadata();
                        } else {
                          videoRef.current.addEventListener('loadedmetadata', handleMetadata, { once: true });
                        }
                      });
                      
                      // Step 7: Play the video
                      await videoRef.current.play();
                      console.log('🎉 Emergency restart complete - video playing!');
                      
                    }
                  } catch (err) {
                    console.error('❌ Emergency restart failed:', err);
                    setError('Camera restart failed: ' + err.message);
                  }
                }}
              >
                RESTART CAM
              </button>
            </div>
            
            {countdown && (
              <div style={styles.countdownOverlay}>
                {countdown}
              </div>
            )}
            
            {isRecording && (
              <div style={styles.recordingOverlay}>
                <div style={styles.recordingDot}></div>
                Recording...
              </div>
            )}
          </div>
        )}
        
        {currentStep === 'category' && renderCategoryStep()}
        {currentStep === 'setup' && renderSetupContent()}
        {currentStep === 'recording' && renderRecordingContent()}
        {currentStep === 'processing' && renderProcessingStep()}
        {currentStep === 'complete' && renderCompleteStep()}
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ASLRecorder;
