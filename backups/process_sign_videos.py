#!/usr/bin/env python3
"""
Script to process ASL sign videos and extract features for training
Supports multiple categories: alphabet, numbers, greetings, common, questions
"""

import cv2
import os
import json
import numpy as np
import pickle
import mediapipe as mp
import sys
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

class SignVideoProcessor:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        
    def extract_landmarks_from_video(self, video_path):
        """Extract hand landmarks from a video"""
        landmarks_data = []
        
        cap = cv2.VideoCapture(video_path)
        frame_count = 0
        valid_frames = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_count += 1
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.hands.process(frame_rgb)
            
            if results.multi_hand_landmarks:
                frame_landmarks = []
                for hand_landmarks in results.multi_hand_landmarks:
                    hand_data = []
                    for landmark in hand_landmarks.landmark:
                        hand_data.extend([landmark.x, landmark.y, landmark.z])
                    frame_landmarks.append(hand_data)
                
                landmarks_data.append(frame_landmarks)
                valid_frames += 1
        
        cap.release()
        
        print(f"    [INFO] Processed {frame_count} frames, {valid_frames} with hands detected")
        return landmarks_data
    
    def extract_features_from_landmarks(self, landmarks_data):
        """Extract statistical features from landmarks data"""
        if not landmarks_data:
            return None
        
        features = []
        
        # Calculate statistics for each landmark coordinate
        for hand_idx in range(2):  # Support up to 2 hands
            hand_features = []
            
            # Collect all coordinates for this hand across all frames
            x_coords, y_coords, z_coords = [], [], []
            
            for frame in landmarks_data:
                if hand_idx < len(frame):
                    hand_data = frame[hand_idx]
                    for i in range(0, len(hand_data), 3):
                        if i + 2 < len(hand_data):
                            x_coords.append(hand_data[i])
                            y_coords.append(hand_data[i + 1])
                            z_coords.append(hand_data[i + 2])
            
            if x_coords:  # If we have data for this hand
                # Statistical features for each coordinate
                for coords in [x_coords, y_coords, z_coords]:
                    hand_features.extend([
                        np.mean(coords),
                        np.std(coords),
                        np.min(coords),
                        np.max(coords),
                        np.median(coords)
                    ])
            else:
                # Fill with zeros if no hand detected
                hand_features.extend([0] * 15)  # 3 coords * 5 stats
            
            features.extend(hand_features)
        
        return np.array(features)

def process_sign_videos(category='alphabet'):
    """Process all sign videos and create training data"""
    
    # Paths
    videos_dir = os.path.join('dataset', f'{category}_videos')
    processed_dir = os.path.join('dataset', 'processed')
    training_dir = os.path.join(processed_dir, 'training_data')
    
    # Create directories
    os.makedirs(training_dir, exist_ok=True)
    
    # Check if videos exist
    if not os.path.exists(videos_dir):
        print(f"[ERROR] Videos directory not found: {videos_dir}")
        print(f"[INFO] Please record {category} videos first")
        return False
    
    # Load metadata
    metadata_path = os.path.join(videos_dir, 'dataset_metadata.json')
    if not os.path.exists(metadata_path):
        print(f"[ERROR] Metadata file not found: {metadata_path}")
        return False
    
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    print(f"[INFO] Processing ASL {category.title()} Videos")
    print("=" * 50)
    print(f"[INFO] Source: {videos_dir}")
    print(f"[INFO] Output: {training_dir}")
    # Get all available video files and group by letter/sign
    all_video_files = [f for f in os.listdir(videos_dir) if f.endswith('.webm')]
    
    # Filter to only numbered files (e.g., A_1.webm, A_2.webm) to avoid old single files
    numbered_video_files = [f for f in all_video_files if '_' in f and f.split('_')[1].split('.')[0].isdigit()]
    
    # Group videos by letter/sign (e.g., A_1.webm, A_2.webm -> group 'A')
    sign_videos = {}
    for video_file in numbered_video_files:
        # Extract sign name (everything before the last underscore)
        sign_name = video_file.rsplit('_', 1)[0]
        if sign_name not in sign_videos:
            sign_videos[sign_name] = []
        sign_videos[sign_name].append(video_file)
    
    print(f"[INFO] Signs to process: {len(sign_videos)}")
    print(f"[INFO] Total video files found: {len(numbered_video_files)} (filtered from {len(all_video_files)} total)")
    
    # Show video count per sign
    for sign, videos in sorted(sign_videos.items()):
        print(f"[INFO] {sign}: {len(videos)} videos")
    
    # Initialize processor
    processor = SignVideoProcessor()
    
    all_features = []
    all_labels = []
    processed_videos = []
    
    # Process each sign and all its videos
    for sign, video_files in sorted(sign_videos.items()):
        print(f"\n[PROCESSING] Sign '{sign}' - {len(video_files)} videos")
        
        for video_file in video_files:
            video_path = os.path.join(videos_dir, video_file)
            
            if not os.path.exists(video_path):
                print(f"    [WARNING] Video not found: {video_path}")
                continue
            
            print(f"    [INFO] Processing: {video_file}")
            
            # Extract landmarks
            landmarks_data = processor.extract_landmarks_from_video(video_path)
            
            if not landmarks_data:
                print(f"    [WARNING] No hand landmarks detected in {video_file}")
                continue
            
            # Extract features
            features = processor.extract_features_from_landmarks(landmarks_data)
            
            if features is not None:
                all_features.append(features)
                all_labels.append(sign)
                processed_videos.append({
                    'filename': video_file,
                    'sign': sign,
                    'category': category
                })
                print(f"    [SUCCESS] Features extracted: {features.shape}")
            else:
                print(f"    [ERROR] Failed to extract features for {video_file}")
    
    if not all_features:
        print("[ERROR] No features extracted from any video!")
        return False
    
    # Convert to numpy arrays
    X = np.array(all_features)
    y = np.array(all_labels)
    
    print(f"\n[INFO] Dataset Summary:")
    print(f"    Total samples: {len(X)}")
    print(f"    Feature dimensions: {X.shape[1]}")
    print(f"    Unique signs: {len(np.unique(y))}")
    print(f"    Signs: {sorted(np.unique(y))}")
    
    # Encode labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    # Split data
    test_size = 0.2 if len(X) > 5 else 0  # No test split if too few samples
    
    if test_size > 0:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_encoded, test_size=test_size, random_state=42
        )
    else:
        X_train, X_test = X, X
        y_train, y_test = y_encoded, y_encoded
        print("[INFO] Using all data for training (too few samples for proper split)")
    
    print(f"\n[TRAINING] Training Model:")
    print(f"    Training samples: {len(X_train)}")
    print(f"    Test samples: {len(X_test)}")
    
    # Train model
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\n[PERFORMANCE] Model Performance:")
    print(f"    Accuracy: {accuracy:.4f}")
    
    if len(np.unique(y_test)) > 1:
        print(f"\n[REPORT] Classification Report:")
        # Get unique classes in test set and their corresponding names
        unique_test_classes = np.unique(y_test)
        test_class_names = [label_encoder.classes_[i] for i in unique_test_classes]
        print(classification_report(y_test, y_pred, target_names=test_class_names, labels=unique_test_classes))
    
    # Save model
    model_data = {
        'model': model,
        'label_encoder': label_encoder,
        'accuracy': accuracy,
        'training_samples': len(X_train),
        'category': category,
        'feature_type': 'hand_landmarks_statistical'
    }
    
    model_path = os.path.join(training_dir, 'asl_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model_data, f)
    
    # Save training data
    np.save(os.path.join(training_dir, f'{category}_features.npy'), X)
    np.save(os.path.join(training_dir, f'{category}_labels.npy'), y)
    
    # Save updated mappings
    word_to_id = {word: i for i, word in enumerate(label_encoder.classes_)}
    id_to_word = {i: word for word, i in word_to_id.items()}
    
    with open(os.path.join(processed_dir, 'word_to_id.json'), 'w') as f:
        json.dump(word_to_id, f, indent=2)
    
    with open(os.path.join(processed_dir, 'id_to_word.json'), 'w') as f:
        json.dump(id_to_word, f, indent=2)
    
    # Save processing metadata
    processing_metadata = {
        'type': f'ASL_{category.title()}_Training',
        'processed_at': metadata.get('created'),
        'total_videos': len(processed_videos),
        'total_features': len(X),
        'feature_dimensions': int(X.shape[1]),
        'model_accuracy': float(accuracy),
        'available_signs': sorted(list(label_encoder.classes_)),
        'category': category
    }
    
    with open(os.path.join(training_dir, f'{category}_metadata.json'), 'w') as f:
        json.dump(processing_metadata, f, indent=2)
    
    print(f"\n[SUCCESS] Training Complete!")
    print(f"[INFO] Model saved: {model_path}")
    print(f"[INFO] Available signs: {sorted(label_encoder.classes_)}")
    print(f"[INFO] Accuracy: {accuracy:.4f}")
    
    return True

if __name__ == "__main__":
    try:
        # Get category from command line argument
        category = sys.argv[1] if len(sys.argv) > 1 else 'alphabet'
        
        print(f"[INFO] Starting ASL {category.title()} Video Processing...")
        success = process_sign_videos(category)
        
        if success:
            print(f"\n[SUCCESS] {category.title()} model training completed successfully!")
            print("[INFO] Your learning app is now ready to recognize these signs!")
            print("[INFO] Start your backend server and test the prediction system")
        else:
            print(f"\n[ERROR] Training failed. Please check the error messages above.")
    except Exception as e:
        print(f"[ERROR] Error during processing: {e}")
        import traceback
        traceback.print_exc()
