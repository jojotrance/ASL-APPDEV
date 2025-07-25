#!/usr/bin/env python3
"""
Script to record ASL alphabet videos for training
"""

import cv2
import os
import time
import json
from datetime import datetime

def record_alphabet_videos():
    """Record videos for each letter of the alphabet"""
    
    # Create directory for alphabet videos
    alphabet_dir = os.path.join('dataset', 'alphabet_videos')
    os.makedirs(alphabet_dir, exist_ok=True)
    
    # Alphabet letters to record
    letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
               'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
    
    # Video recording settings
    fps = 30
    duration = 3  # seconds per video
    frame_count = fps * duration
    
    # Initialize camera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Error: Could not open camera")
        return
    
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, fps)
    
    print("🎥 ASL Alphabet Video Recording")
    print("=" * 50)
    print(f"📁 Videos will be saved to: {alphabet_dir}")
    print(f"⏱️  Recording {duration} seconds per letter")
    print(f"🔤 Recording {len(letters)} letters")
    print("\n📋 Instructions:")
    print("1. Position your hand in the camera frame")
    print("2. Press SPACE to start recording each letter")
    print("3. Hold the sign steady during recording")
    print("4. Press 'q' to quit anytime")
    print("5. Press 's' to skip a letter")
    print("6. Press 'r' to re-record the current letter")
    
    input("\nPress Enter when ready to start...")
    
    # Metadata for the dataset
    dataset_metadata = {
        'created': datetime.now().isoformat(),
        'type': 'ASL_Alphabet',
        'fps': fps,
        'duration_seconds': duration,
        'resolution': '640x480',
        'videos': {}
    }
    
    letter_index = 0
    
    while letter_index < len(letters):
        current_letter = letters[letter_index]
        video_filename = f"{current_letter}.mp4"
        video_path = os.path.join(alphabet_dir, video_filename)
        
        print(f"\n🔤 Preparing to record letter: {current_letter}")
        print(f"📹 Video will be saved as: {video_filename}")
        
        # Show preview
        while True:
            ret, frame = cap.read()
            if not ret:
                print("❌ Failed to read from camera")
                break
            
            # Flip frame horizontally for mirror effect
            frame = cv2.flip(frame, 1)
            
            # Add text overlay
            cv2.putText(frame, f"Letter: {current_letter}", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(frame, "SPACE: Start Recording | S: Skip | R: Re-record | Q: Quit", 
                       (10, frame.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            cv2.putText(frame, "Position your hand and press SPACE", (10, 60), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            
            cv2.imshow('ASL Alphabet Recorder', frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord(' '):  # Space to start recording
                break
            elif key == ord('s'):  # Skip this letter
                print(f"⏭️  Skipping letter {current_letter}")
                letter_index += 1
                break
            elif key == ord('q'):  # Quit
                print("🛑 Recording cancelled by user")
                cap.release()
                cv2.destroyAllWindows()
                return
            elif key == ord('r') and letter_index > 0:  # Re-record previous
                letter_index -= 1
                break
        
        if key == ord(' '):  # Actually record the video
            print(f"🎬 Recording {current_letter} in...")
            
            # Countdown
            for i in range(3, 0, -1):
                ret, frame = cap.read()
                if ret:
                    frame = cv2.flip(frame, 1)
                    cv2.putText(frame, f"Recording {current_letter} in: {i}", (10, 100), 
                               cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
                    cv2.imshow('ASL Alphabet Recorder', frame)
                    cv2.waitKey(1000)
            
            # Start recording
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(video_path, fourcc, fps, (640, 480))
            
            print(f"🔴 Recording {current_letter}...")
            
            frames_recorded = 0
            start_time = time.time()
            
            while frames_recorded < frame_count:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame = cv2.flip(frame, 1)
                
                # Add recording indicator
                progress = frames_recorded / frame_count
                cv2.putText(frame, f"Recording: {current_letter}", (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                cv2.putText(frame, f"Progress: {progress:.1%}", (10, 60), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
                
                # Progress bar
                bar_width = 400
                bar_height = 20
                bar_x = 120
                bar_y = 40
                cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bar_width, bar_y + bar_height), (100, 100, 100), -1)
                cv2.rectangle(frame, (bar_x, bar_y), (bar_x + int(bar_width * progress), bar_y + bar_height), (0, 255, 0), -1)
                
                out.write(frame)
                cv2.imshow('ASL Alphabet Recorder', frame)
                
                frames_recorded += 1
                
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
            
            out.release()
            
            # Calculate actual duration
            end_time = time.time()
            actual_duration = end_time - start_time
            
            print(f"✅ Letter {current_letter} recorded successfully!")
            print(f"📊 Frames: {frames_recorded}, Duration: {actual_duration:.2f}s")
            
            # Save metadata
            dataset_metadata['videos'][current_letter] = {
                'filename': video_filename,
                'letter': current_letter,
                'frames': frames_recorded,
                'duration': actual_duration,
                'recorded_at': datetime.now().isoformat()
            }
            
            letter_index += 1
    
    cap.release()
    cv2.destroyAllWindows()
    
    # Save dataset metadata
    metadata_path = os.path.join(alphabet_dir, 'dataset_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(dataset_metadata, f, indent=2)
    
    print(f"\n🎉 Recording complete!")
    print(f"📁 Videos saved to: {alphabet_dir}")
    print(f"📋 Metadata saved to: {metadata_path}")
    print(f"🔤 Recorded {len(dataset_metadata['videos'])} letters")
    
    return alphabet_dir, dataset_metadata

if __name__ == "__main__":
    try:
        print("🎬 Starting ASL Alphabet Video Recording...")
        alphabet_dir, metadata = record_alphabet_videos()
        print("\n✅ Video recording completed successfully!")
        
        # Ask if user wants to process the videos immediately
        process_now = input("\n🔄 Do you want to process these videos for training now? (y/n): ").lower().strip()
        if process_now in ['y', 'yes']:
            print("📝 Next step: Run the processing script to extract features from your videos")
            print("💡 Command: python scripts/process_alphabet_videos.py")
        
    except Exception as e:
        print(f"❌ Error during recording: {e}")
        import traceback
        traceback.print_exc()
