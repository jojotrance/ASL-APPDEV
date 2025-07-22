import numpy as np
import pickle
import json
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

class LandmarkDataPreprocessor:
    def __init__(self, landmarks_dir="../processed/landmarks", output_dir="../processed/training_data"):
        self.landmarks_dir = Path(landmarks_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.max_sequence_length = 60  # Maximum frames per video
        self.num_landmarks = 63  # 21 points × 3 coordinates per hand
        self.max_hands = 2
        
    def load_all_landmarks(self):
        """Load all processed landmark files"""
        landmark_files = list(self.landmarks_dir.glob("*.pkl"))
        
        all_data = []
        labels = []
        video_ids = []
        
        print(f"Loading {len(landmark_files)} landmark files...")
        
        for file_path in landmark_files:
            try:
                with open(file_path, 'rb') as f:
                    data = pickle.load(f)
                
                all_data.append(data)
                labels.append(data['class_id'])
                video_ids.append(data['video_id'])
                
            except Exception as e:
                print(f"Error loading {file_path}: {e}")
        
        return all_data, labels, video_ids
    
    def normalize_sequence_length(self, landmarks_sequence, target_length=None):
        """Normalize sequence to fixed length using interpolation or padding"""
        if target_length is None:
            target_length = self.max_sequence_length
        
        current_length = len(landmarks_sequence)
        
        if current_length == 0:
            # Return zero-padded sequence
            return np.zeros((target_length, self.max_hands, self.num_landmarks))
        
        # Extract landmark arrays
        sequence_array = []
        for frame in landmarks_sequence:
            frame_data = np.zeros((self.max_hands, self.num_landmarks))
            
            for hand_idx, hand in enumerate(frame['hands'][:self.max_hands]):
                if len(hand['landmarks']) == self.num_landmarks:
                    frame_data[hand_idx] = hand['landmarks']
            
            sequence_array.append(frame_data)
        
        sequence_array = np.array(sequence_array)
        
        if current_length == target_length:
            return sequence_array
        elif current_length < target_length:
            # Pad with zeros
            padding = np.zeros((target_length - current_length, self.max_hands, self.num_landmarks))
            return np.concatenate([sequence_array, padding], axis=0)
        else:
            # Interpolate to target length
            indices = np.linspace(0, current_length - 1, target_length, dtype=int)
            return sequence_array[indices]
    
    def preprocess_dataset(self):
        """Preprocess all landmark data for training"""
        all_data, labels, video_ids = self.load_all_landmarks()
        
        if len(all_data) == 0:
            print("❌ No landmark files found! Run video_processor.py first.")
            return None
        
        # Convert to arrays
        X = []
        y = np.array(labels)
        
        print("Normalizing sequences...")
        for data in all_data:
            normalized_seq = self.normalize_sequence_length(data['landmarks_sequence'])
            X.append(normalized_seq)
        
        X = np.array(X)
        
        print(f"Dataset shape: {X.shape}")
        print(f"Labels shape: {y.shape}")
        print(f"Unique classes: {len(np.unique(y))}")
        
        # Normalize landmark coordinates
        X_reshaped = X.reshape(-1, self.num_landmarks)
        scaler = StandardScaler()
        X_normalized = scaler.fit_transform(X_reshaped)
        X_normalized = X_normalized.reshape(X.shape)
        
        # Split dataset
        X_train, X_temp, y_train, y_temp, ids_train, ids_temp = train_test_split(
            X_normalized, y, video_ids, test_size=0.4, random_state=42, stratify=y
        )
        
        X_val, X_test, y_val, y_test, ids_val, ids_test = train_test_split(
            X_temp, y_temp, ids_temp, test_size=0.5, random_state=42, stratify=y_temp
        )
        
        # Save preprocessed data
        print("Saving preprocessed data...")
        
        np.save(self.output_dir / "X_train.npy", X_train)
        np.save(self.output_dir / "X_val.npy", X_val)
        np.save(self.output_dir / "X_test.npy", X_test)
        np.save(self.output_dir / "y_train.npy", y_train)
        np.save(self.output_dir / "y_val.npy", y_val)
        np.save(self.output_dir / "y_test.npy", y_test)
        
        # Save scaler
        with open(self.output_dir / "scaler.pkl", 'wb') as f:
            pickle.dump(scaler, f)
        
        # Save metadata
        metadata = {
            'num_classes': len(np.unique(y)),
            'sequence_length': self.max_sequence_length,
            'num_landmarks': self.num_landmarks,
            'max_hands': self.max_hands,
            'train_size': len(X_train),
            'val_size': len(X_val),
            'test_size': len(X_test),
            'train_ids': ids_train,
            'val_ids': ids_val,
            'test_ids': ids_test
        }
        
        with open(self.output_dir / "metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"✅ Training set: {X_train.shape}")
        print(f"✅ Validation set: {X_val.shape}")
        print(f"✅ Test set: {X_test.shape}")
        
        return X_train, X_val, X_test, y_train, y_val, y_test

if __name__ == "__main__":
    preprocessor = LandmarkDataPreprocessor()
    result = preprocessor.preprocess_dataset()
    if result is not None:
        print("✅ Preprocessing complete!")