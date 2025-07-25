#!/usr/bin/env python3
"""
Quick Training Script - Train model immediately with a single video
This recreates the "effortless" workflow where you record one sign and get instant recognition
"""

import sys
import json
import cv2
import mediapipe as mp
import numpy as np
import pickle
import os
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

def extract_landmarks_from_video(video_path):
    """Extract hand landmarks from a single video file"""
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    cap = cv2.VideoCapture(video_path)
    landmarks_sequence = []
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(frame_rgb)
        
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                # Extract x, y, z coordinates for each landmark
                landmarks = []
                for landmark in hand_landmarks.landmark:
                    landmarks.extend([landmark.x, landmark.y, landmark.z])
                landmarks_sequence.append(landmarks)
    
    cap.release()
    hands.close()
    
    return landmarks_sequence

def extract_features_from_landmarks(landmarks_sequence):
    """Extract statistical features from landmarks sequence"""
    if not landmarks_sequence or len(landmarks_sequence) == 0:
        return np.zeros(30)  # Return zeros if no landmarks
    
    landmarks_array = np.array(landmarks_sequence)
    
    # Extract statistical features (same format as training)
    features = []
    
    # For each coordinate (x, y, z) across all landmarks and frames
    for coord_idx in range(landmarks_array.shape[1]):
        coord_data = landmarks_array[:, coord_idx]
        features.extend([
            np.mean(coord_data),
            np.std(coord_data),
            np.min(coord_data),
            np.max(coord_data),
            np.median(coord_data)
        ])
    
    # Ensure we have exactly 30 features (6 coords * 5 stats)
    # Take first 30 or pad with zeros
    if len(features) > 30:
        features = features[:30]
    elif len(features) < 30:
        features.extend([0] * (30 - len(features)))
    
    return np.array(features)

def quick_train_model(video_path, sign_label):
    """Train model immediately with a single video"""
    try:
        # Paths for model storage
        script_dir = Path(__file__).parent
        model_dir = script_dir.parent / 'dataset' / 'processed' / 'training_data'
        model_path = model_dir / 'asl_model.pkl'
        encoder_path = model_dir / 'label_encoder.pkl'
        
        # Create directories if they don't exist
        model_dir.mkdir(parents=True, exist_ok=True)
        
        # Extract features from the new video
        landmarks = extract_landmarks_from_video(video_path)
        if not landmarks:
            return {"error": "No hand landmarks detected in video", "accuracy": 0}
        
        new_features = extract_features_from_landmarks(landmarks)
        
        # Load existing model and data if available
        existing_features = []
        existing_labels = []
        label_encoder = LabelEncoder()
        
        if model_path.exists() and encoder_path.exists():
            try:
                # Load existing model and encoder
                with open(model_path, 'rb') as f:
                    existing_model = pickle.load(f)
                with open(encoder_path, 'rb') as f:
                    label_encoder = pickle.load(f)
                
                # If we have training data, load it
                X_train_path = model_dir / 'X_train.npy'
                y_train_path = model_dir / 'y_train.npy'
                
                if X_train_path.exists() and y_train_path.exists():
                    existing_features = np.load(X_train_path).tolist()
                    existing_labels = np.load(y_train_path).tolist()
                    
                    # Convert back to string labels
                    existing_labels = label_encoder.inverse_transform(existing_labels).tolist()
                    
            except Exception as e:
                print(f"Could not load existing model, starting fresh: {e}")
        
        # Add new training sample
        all_features = existing_features + [new_features.tolist()]
        all_labels = existing_labels + [sign_label]
        
        # Encode labels
        label_encoder.fit(all_labels)
        encoded_labels = label_encoder.transform(all_labels)
        
        # Train new model
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced'
        )
        
        X_train = np.array(all_features)
        y_train = encoded_labels
        
        model.fit(X_train, y_train)
        
        # Calculate accuracy (simple train accuracy for quick feedback)
        train_accuracy = model.score(X_train, y_train)
        
        # Save updated model and data
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        with open(encoder_path, 'wb') as f:
            pickle.dump(label_encoder, f)
        
        # Save training data for future incremental updates
        np.save(model_dir / 'X_train.npy', X_train)
        np.save(model_dir / 'y_train.npy', y_train)
        
        return {
            "success": True,
            "sign": sign_label,
            "accuracy": float(train_accuracy),
            "total_samples": len(all_labels),
            "message": f"Model trained with {len(all_labels)} samples including your new '{sign_label}' sign"
        }
        
    except Exception as e:
        return {
            "error": f"Training failed: {str(e)}",
            "accuracy": 0
        }

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python quick_train_single.py <video_path> <sign_label>"}))
        sys.exit(1)
    
    video_path = sys.argv[1]
    sign_label = sys.argv[2]
    
    result = quick_train_model(video_path, sign_label)
    print(json.dumps(result))
