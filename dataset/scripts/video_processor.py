import cv2
import mediapipe as mp
import numpy as np
import json
import os
from pathlib import Path
import requests
import subprocess
from tqdm import tqdm
import pickle
import time
import urllib3
from urllib.parse import urlparse

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class VideoLandmarkExtractor:
    def __init__(self, processed_data_dir="../processed"):
        self.processed_dir = Path(processed_data_dir)
        self.videos_dir = self.processed_dir / "videos"
        self.landmarks_dir = self.processed_dir / "landmarks"
        
        # Create directories
        self.videos_dir.mkdir(parents=True, exist_ok=True)
        self.landmarks_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize MediaPipe
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Load processed mappings
        self.load_mappings()
    
    def load_mappings(self):
        """Load the processed video mappings and word dictionaries"""
        with open(self.processed_dir / "video_mappings.json", 'r') as f:
            self.video_data = json.load(f)
        
        with open(self.processed_dir / "word_to_id.json", 'r') as f:
            self.word_to_id = json.load(f)
            
        with open(self.processed_dir / "id_to_word.json", 'r') as f:
            self.id_to_word = {int(k): v for k, v in json.load(f).items()}
    
    def download_video_robust(self, video_url, video_id, max_retries=3):
        """Download video with better error handling and retries"""
        video_path = self.videos_dir / f"{video_id}.mp4"
        
        if video_path.exists():
            return str(video_path)
        
        for attempt in range(max_retries):
            try:
                parsed_url = urlparse(video_url)
                
                # Try different methods based on URL
                if 'youtube.com' in video_url or 'youtu.be' in video_url:
                    success = self._download_youtube(video_url, video_path)
                elif 'aslsignbank' in video_url or parsed_url.netloc:
                    success = self._download_direct(video_url, video_path)
                else:
                    print(f"Unknown URL format: {video_url}")
                    return None
                
                if success:
                    return str(video_path)
                    
            except Exception as e:
                print(f"Attempt {attempt + 1} failed for {video_id}: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
        
        return None
    
    def _download_youtube(self, video_url, video_path):
        """Download from YouTube using yt-dlp"""
        try:
            cmd = [
                'yt-dlp', 
                '--no-check-certificates',  # Skip SSL checks
                '-f', 'worst[height<=360]',  # Even lower quality
                '--socket-timeout', '30',
                '--retries', '3',
                '-o', str(video_path),
                video_url
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0 and video_path.exists():
                return True
            else:
                print(f"yt-dlp error: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            print(f"YouTube download timeout for {video_url}")
            return False
        except Exception as e:
            print(f"YouTube download error: {e}")
            return False
    
    def _download_direct(self, video_url, video_path):
        """Download directly from URL with SSL bypass"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            # Create session with SSL bypass
            session = requests.Session()
            session.verify = False  # Skip SSL verification
            
            response = session.get(
                video_url, 
                headers=headers, 
                stream=True, 
                timeout=30
            )
            response.raise_for_status()
            
            # Check if it's actually a video
            content_type = response.headers.get('content-type', '')
            if 'video' not in content_type and 'octet-stream' not in content_type:
                print(f"Not a video file: {content_type}")
                return False
            
            with open(video_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            return video_path.exists() and video_path.stat().st_size > 1000  # At least 1KB
            
        except Exception as e:
            print(f"Direct download error: {e}")
            return False
    
    def extract_landmarks_from_video(self, video_path, video_info):
        """Extract hand landmarks from video frames"""
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            print(f"Could not open video: {video_path}")
            return []
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS) or video_info.get('fps', 25)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        if total_frames == 0:
            print(f"Video has no frames: {video_path}")
            cap.release()
            return []
        
        # Calculate frame range
        start_frame = video_info.get('frame_start', 0)
        end_frame = min(video_info.get('frame_end', total_frames), total_frames)
        
        landmarks_sequence = []
        frame_count = 0
        max_frames = min(120, end_frame - start_frame)  # Limit to 120 frames max
        
        # Set to start frame
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
        
        while cap.isOpened() and frame_count < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Skip frames to reduce processing time
            if frame_count % 2 == 0:  # Process every 2nd frame
                # Convert BGR to RGB
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # Process with MediaPipe
                results = self.hands.process(rgb_frame)
                
                frame_landmarks = {
                    'frame_id': start_frame + frame_count,
                    'timestamp': frame_count / fps,
                    'hands': []
                }
                
                if results.multi_hand_landmarks:
                    for hand_idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
                        # Extract 21 landmarks (x, y, z) for each hand
                        hand_data = []
                        for landmark in hand_landmarks.landmark:
                            hand_data.extend([landmark.x, landmark.y, landmark.z])
                        
                        # Get handedness (left/right)
                        handedness = "Unknown"
                        if results.multi_handedness and hand_idx < len(results.multi_handedness):
                            handedness = results.multi_handedness[hand_idx].classification[0].label
                        
                        frame_landmarks['hands'].append({
                            'handedness': handedness,
                            'landmarks': hand_data  # 63 values (21 points × 3 coordinates)
                        })
                
                landmarks_sequence.append(frame_landmarks)
            
            frame_count += 1
        
        cap.release()
        return landmarks_sequence
    
    def process_video_batch(self, batch_size=3, max_videos=None, skip_failed_urls=True):
        """Process videos in batches with better error handling"""
        processed_count = 0
        failed_count = 0
        skipped_count = 0
        
        video_list = self.video_data[:max_videos] if max_videos else self.video_data
        
        # Filter out known problematic URLs if requested
        if skip_failed_urls:
            filtered_list = []
            for video_info in video_list:
                url = video_info.get('url', '')
                # Skip known problematic domains
                if any(domain in url for domain in ['aslsignbank.haskins.yale.edu']):
                    skipped_count += 1
                    continue
                filtered_list.append(video_info)
            video_list = filtered_list
        
        print(f"Processing {len(video_list)} videos ({skipped_count} skipped)")
        
        for i in tqdm(range(0, len(video_list), batch_size), desc="Processing batches"):
            batch = video_list[i:i+batch_size]
            
            for video_info in batch:
                video_id = video_info['video_id']
                video_url = video_info.get('url', '')
                
                if not video_url:
                    failed_count += 1
                    continue
                
                # Check if landmarks already exist
                landmarks_file = self.landmarks_dir / f"{video_id}.pkl"
                if landmarks_file.exists():
                    processed_count += 1
                    continue
                
                print(f"\nProcessing {video_info['word']}: {video_id}")
                
                # Download video
                video_path = self.download_video_robust(video_url, video_id)
                if not video_path:
                    failed_count += 1
                    continue
                
                # Extract landmarks
                try:
                    landmarks = self.extract_landmarks_from_video(video_path, video_info)
                    
                    if len(landmarks) == 0:
                        print(f"No landmarks extracted from {video_id}")
                        failed_count += 1
                        continue
                    
                    # Save landmarks with metadata
                    landmarks_data = {
                        'video_id': video_id,
                        'word': video_info['word'],
                        'class_id': video_info['class_id'],
                        'landmarks_sequence': landmarks,
                        'video_info': video_info
                    }
                    
                    with open(landmarks_file, 'wb') as f:
                        pickle.dump(landmarks_data, f)
                    
                    print(f"✅ Extracted {len(landmarks)} frames for {video_info['word']}")
                    processed_count += 1
                    
                    # Clean up video file to save space
                    if os.path.exists(video_path):
                        os.remove(video_path)
                    
                except Exception as e:
                    print(f"Error processing {video_id}: {e}")
                    failed_count += 1
        
        print(f"\n=== Processing Summary ===")
        print(f"✅ Successful: {processed_count}")
        print(f"❌ Failed: {failed_count}")
        print(f"⏭️ Skipped: {skipped_count}")
        return processed_count, failed_count

if __name__ == "__main__":
    extractor = VideoLandmarkExtractor()
    
    # Process videos with better error handling
    extractor.process_video_batch(batch_size=2, max_videos=30, skip_failed_urls=True)