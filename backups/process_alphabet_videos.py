#!/usr/bin/env python3
"""
Script to process ASL alphabet videos and extract features for training
"""

import cv2
import os
import json
import numpy as np
import pickle
import mediapipe as mp
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

class AlphabetVideoProcessor:
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
        
        print(f"    📊 Processed {frame_count} frames, {valid_frames} with hands detected")
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

def process_alphabet_videos():
    """Process all alphabet videos and create training data"""
    
    # Paths
    alphabet_dir = os.path.join('dataset', 'alphabet_videos')
    processed_dir = os.path.join('dataset', 'processed')
    training_dir = os.path.join(processed_dir, 'training_data')
    
    # Create directories
    os.makedirs(training_dir, exist_ok=True)
    
    # Check if alphabet videos exist
    if not os.path.exists(alphabet_dir):
        print(f"❌ Alphabet videos directory not found: {alphabet_dir}")
        print("💡 Please run 'python scripts/record_alphabet.py' first to record videos")
        return False
    
    # Load metadata
    metadata_path = os.path.join(alphabet_dir, 'dataset_metadata.json')
    if not os.path.exists(metadata_path):
        print(f"❌ Metadata file not found: {metadata_path}")
        return False
    
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    print("🔄 Processing ASL Alphabet Videos")
    print("=" * 50)
    print(f"📁 Source: {alphabet_dir}")
    print(f"💾 Output: {training_dir}")
    print(f"🔤 Letters to process: {len(metadata['videos'])}")
    
    # Initialize processor
    processor = AlphabetVideoProcessor()
    
    all_features = []
    all_labels = []
    processed_videos = []
    
    # Process each video
    for letter, video_info in metadata['videos'].items():
        video_path = os.path.join(alphabet_dir, video_info['filename'])
        
        if not os.path.exists(video_path):
            print(f"⚠️  Video not found: {video_path}")
            continue
        
        print(f"🎬 Processing letter: {letter}")
        print(f"    📹 Video: {video_info['filename']}")
        
        # Extract landmarks
        landmarks_data = processor.extract_landmarks_from_video(video_path)
        
        if not landmarks_data:
            print(f"    ❌ No hand landmarks detected in {letter}")
            continue
        
        # Extract features
        features = processor.extract_features_from_landmarks(landmarks_data)
        
        if features is not None:
            all_features.append(features)
            all_labels.append(letter)
            processed_videos.append(video_info)
            print(f"    ✅ Features extracted: {features.shape}")
        else:
            print(f"    ❌ Failed to extract features for {letter}")
    
    if not all_features:
        print("❌ No features extracted from any video!")
        return False
    
    # Convert to numpy arrays
    X = np.array(all_features)
    y = np.array(all_labels)
    
    print(f"\n📊 Dataset Summary:")
    print(f"    Total samples: {len(X)}")
    print(f"    Feature dimensions: {X.shape[1]}")
    print(f"    Unique letters: {len(np.unique(y))}")
    print(f"    Letters: {sorted(np.unique(y))}")
    
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
        print("ℹ️  Using all data for training (too few samples for proper split)")
    
    print(f"\n🎯 Training Model:")
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
    
    print(f"\n📈 Model Performance:")
    print(f"    Accuracy: {accuracy:.4f}")
    
    if len(np.unique(y_test)) > 1:
        print(f"\n📋 Classification Report:")
        print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))
    
    # Save model
    model_data = {
        'model': model,
        'label_encoder': label_encoder,
        'accuracy': accuracy,
        'training_samples': len(X_train),
        'alphabet_type': 'ASL_Alphabet',
        'feature_type': 'hand_landmarks_statistical'
    }
    
    model_path = os.path.join(training_dir, 'asl_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model_data, f)
    
    # Save training data
    np.save(os.path.join(training_dir, 'alphabet_features.npy'), X)
    np.save(os.path.join(training_dir, 'alphabet_labels.npy'), y)
    
    # Save updated mappings
    word_to_id = {word: i for i, word in enumerate(label_encoder.classes_)}
    id_to_word = {i: word for word, i in word_to_id.items()}
    
    with open(os.path.join(processed_dir, 'word_to_id.json'), 'w') as f:
        json.dump(word_to_id, f, indent=2)
    
    with open(os.path.join(processed_dir, 'id_to_word.json'), 'w') as f:
        json.dump(id_to_word, f, indent=2)
    
    # Save processing metadata
    processing_metadata = {
        'type': 'ASL_Alphabet_Training',
        'processed_at': json.dumps(metadata.get('created')),
        'total_videos': len(processed_videos),
        'total_features': len(X),
        'feature_dimensions': int(X.shape[1]),
        'model_accuracy': float(accuracy),
        'available_letters': sorted(list(label_encoder.classes_))
    }
    
    with open(os.path.join(training_dir, 'alphabet_metadata.json'), 'w') as f:
        json.dump(processing_metadata, f, indent=2)
    
    print(f"\n✅ Training Complete!")
    print(f"📁 Model saved: {model_path}")
    print(f"🔤 Available letters: {sorted(label_encoder.classes_)}")
    print(f"🎯 Accuracy: {accuracy:.4f}")
    
    return True

if __name__ == "__main__":
    try:
        success = process_alphabet_videos()
        if success:
            print("\n🎉 Alphabet model training completed successfully!")
            print("💡 Your learning app is now ready to recognize ASL alphabet letters!")
            print("🚀 Start your backend server and test the prediction system")
        else:
            print("\n❌ Training failed. Please check the error messages above.")
    except Exception as e:
        print(f"❌ Error during processing: {e}")
        import traceback
        traceback.print_exc()
