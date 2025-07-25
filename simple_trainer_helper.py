#!/usr/bin/env python3
"""
SimpleTrainer Helper Script - Optimize and Train Models from SimpleTrainer Data
This script connects to your MongoDB database and helps train/optimize models
from signs recorded using the SimpleTrainer component.
"""

import sys
import json
import numpy as np
import os
from pathlib import Path
from pymongo import MongoClient
from urllib.parse import quote_plus
import logging
from datetime import datetime
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')
logging.getLogger("pymongo").setLevel(logging.WARNING)

class SimpleTrainerHelper:
    def __init__(self):
        self.db_connection = None
        self.signs_data = []
        self.models = {}
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        
    def connect_to_database(self):
        """Connect to MongoDB database using credentials from .env"""
        try:
            # Load credentials from .env file in backend folder
            env_path = Path(__file__).parent / 'backend' / '.env'
            if not env_path.exists():
                # Try root folder as fallback
                env_path = Path(__file__).parent / '.env'
            
            if env_path.exists():
                with open(env_path, 'r') as f:
                    env_vars = {}
                    for line in f:
                        if '=' in line and not line.startswith('#'):
                            key, value = line.strip().split('=', 1)
                            env_vars[key] = value.strip('"\'')
                
                # Extract MongoDB URI from your .env file
                mongodb_uri = env_vars.get('MONGODB_URI', '')
                print(f"🔗 Using MongoDB URI from .env: {mongodb_uri[:50]}...")
                
                if mongodb_uri:
                    self.db_connection = MongoClient(mongodb_uri)
                else:
                    print("❌ No MONGODB_URI found in .env file")
                    return False
            else:
                print("❌ .env file not found")
                return False
            
            # Test connection
            self.db_connection.admin.command('ping')
            print("✅ Successfully connected to MongoDB database")
            return True
            
        except Exception as e:
            print(f"❌ Failed to connect to database: {e}")
            print(f"💡 Make sure your .env file contains MONGODB_URI")
            return False
    
    def load_signs_from_database(self):
        """Load all recorded signs from the database"""
        try:
            if not self.db_connection:
                print("❌ No database connection")
                return False
            
            # Use the database name from your connection string (ASL-AppDev)
            db = self.db_connection['ASL-AppDev']
            signs_collection = db['signs']
            
            # Get all signs
            signs = list(signs_collection.find())
            
            if not signs:
                print("❌ No signs found in database")
                print("💡 Make sure you've recorded some signs using the SimpleTrainer web interface")
                return False
            
            print(f"📦 Found {len(signs)} signs in database:")
            
            self.signs_data = []
            for sign in signs:
                if 'frames' in sign and 'word' in sign:
                    # Process frames to extract landmarks
                    processed_frames = self.process_sign_frames(sign['frames'])
                    if processed_frames:
                        self.signs_data.append({
                            'label': sign['word'],
                            'frames': processed_frames,
                            'original_frames': len(sign['frames'])
                        })
                        print(f"  - {sign['word']}: {len(sign['frames'])} frames")
            
            print(f"✅ Loaded {len(self.signs_data)} valid signs")
            return len(self.signs_data) > 0
            
        except Exception as e:
            print(f"❌ Error loading signs: {e}")
            return False
    
    def process_sign_frames(self, frames):
        """Process and normalize landmark frames"""
        try:
            processed = []
            
            for frame in frames:
                if isinstance(frame, dict) and 'landmarks' in frame:
                    # Database format: {timestamp: ..., landmarks: [...], handedness: ...}
                    landmarks = frame['landmarks']
                elif isinstance(frame, list):
                    # Direct landmarks format
                    landmarks = frame
                else:
                    continue
                
                # Flatten landmarks for ML processing
                flattened = self.flatten_landmarks(landmarks)
                if flattened is not None:
                    processed.append(flattened)
            
            return processed if processed else None
            
        except Exception as e:
            print(f"⚠️ Error processing frames: {e}")
            return None
    
    def flatten_landmarks(self, landmarks):
        """Convert landmarks to flat feature vector"""
        try:
            features = []
            
            # Handle different landmark formats
            if isinstance(landmarks, list):
                for hand_landmarks in landmarks:
                    if isinstance(hand_landmarks, list):
                        # List of landmark points
                        for point in hand_landmarks:
                            if isinstance(point, dict):
                                features.extend([
                                    point.get('x', 0),
                                    point.get('y', 0),
                                    point.get('z', 0)
                                ])
                            elif isinstance(point, list) and len(point) >= 3:
                                features.extend(point[:3])
                    
            # Ensure consistent feature vector length (21 landmarks * 3 coords * 2 hands = 126 features)
            target_length = 126
            if len(features) < target_length:
                features.extend([0] * (target_length - len(features)))
            elif len(features) > target_length:
                features = features[:target_length]
            
            return np.array(features) if features else None
            
        except Exception as e:
            print(f"⚠️ Error flattening landmarks: {e}")
            return None
    
    def prepare_training_data(self):
        """Prepare data for machine learning training"""
        try:
            if not self.signs_data:
                print("❌ No signs data available")
                return None, None
            
            X = []  # Features
            y = []  # Labels
            
            print("🔄 Preparing training data...")
            
            for sign in self.signs_data:
                label = sign['label']
                frames = sign['frames']
                
                # Use all frames for training
                for frame in frames:
                    if frame is not None and len(frame) > 0:
                        X.append(frame)
                        y.append(label)
            
            if not X:
                print("❌ No valid training data found")
                return None, None
            
            # Convert to numpy arrays
            X = np.array(X)
            y = np.array(y)
            
            print(f"✅ Prepared training data: {X.shape[0]} samples, {X.shape[1]} features")
            print(f"📊 Labels: {np.unique(y)}")
            
            return X, y
            
        except Exception as e:
            print(f"❌ Error preparing training data: {e}")
            return None, None
    
    def train_models(self, X, y):
        """Train multiple ML models and compare performance"""
        try:
            print("\n🤖 Training machine learning models...")
            
            # Split data for training and testing
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Encode labels
            y_train_encoded = self.label_encoder.fit_transform(y_train)
            y_test_encoded = self.label_encoder.transform(y_test)
            
            # Define models to train
            models_to_train = {
                'Random Forest': RandomForestClassifier(
                    n_estimators=100,
                    max_depth=10,
                    random_state=42,
                    n_jobs=-1
                ),
                'Neural Network': MLPClassifier(
                    hidden_layer_sizes=(128, 64),
                    max_iter=1000,
                    random_state=42,
                    alpha=0.01
                ),
                'SVM': SVC(
                    kernel='rbf',
                    C=1.0,
                    gamma='scale',
                    probability=True,
                    random_state=42
                )
            }
            
            best_model = None
            best_score = 0
            
            print("\n📈 Model Performance:")
            print("-" * 50)
            
            for name, model in models_to_train.items():
                try:
                    # Train model
                    model.fit(X_train_scaled, y_train_encoded)
                    
                    # Predict and evaluate
                    y_pred = model.predict(X_test_scaled)
                    accuracy = accuracy_score(y_test_encoded, y_pred)
                    
                    # Cross-validation
                    cv_scores = cross_val_score(model, X_train_scaled, y_train_encoded, cv=3)
                    cv_mean = cv_scores.mean()
                    
                    print(f"{name:15} | Accuracy: {accuracy:.3f} | CV Score: {cv_mean:.3f}")
                    
                    # Save model
                    self.models[name] = {
                        'model': model,
                        'accuracy': accuracy,
                        'cv_score': cv_mean
                    }
                    
                    # Track best model
                    if cv_mean > best_score:
                        best_score = cv_mean
                        best_model = name
                        
                except Exception as e:
                    print(f"❌ Error training {name}: {e}")
            
            if best_model:
                print(f"\n🏆 Best model: {best_model} (CV Score: {best_score:.3f})")
                
                # Detailed report for best model
                best_model_obj = self.models[best_model]['model']
                y_pred = best_model_obj.predict(X_test_scaled)
                
                print(f"\n📊 Detailed Report for {best_model}:")
                print(classification_report(
                    y_test_encoded, 
                    y_pred, 
                    target_names=self.label_encoder.classes_
                ))
            
            return len(self.models) > 0
            
        except Exception as e:
            print(f"❌ Error training models: {e}")
            return False
    
    def save_models(self):
        """Save trained models to disk"""
        try:
            models_dir = Path(__file__).parent / 'trained_models'
            models_dir.mkdir(exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            for name, model_data in self.models.items():
                # Save model
                model_filename = f"{name.lower().replace(' ', '_')}_{timestamp}.pkl"
                model_path = models_dir / model_filename
                
                with open(model_path, 'wb') as f:
                    pickle.dump({
                        'model': model_data['model'],
                        'scaler': self.scaler,
                        'label_encoder': self.label_encoder,
                        'accuracy': model_data['accuracy'],
                        'cv_score': model_data['cv_score'],
                        'timestamp': timestamp
                    }, f)
                
                print(f"💾 Saved {name} model: {model_path}")
            
            # Save model info
            info_path = models_dir / f"model_info_{timestamp}.json"
            with open(info_path, 'w') as f:
                json.dump({
                    'timestamp': timestamp,
                    'total_signs': len(self.signs_data),
                    'sign_labels': [sign['label'] for sign in self.signs_data],
                    'models': {
                        name: {
                            'accuracy': data['accuracy'],
                            'cv_score': data['cv_score']
                        }
                        for name, data in self.models.items()
                    }
                }, f, indent=2)
            
            print(f"📋 Saved model info: {info_path}")
            return True
            
        except Exception as e:
            print(f"❌ Error saving models: {e}")
            return False
    
    def analyze_signs_quality(self):
        """Analyze the quality and characteristics of recorded signs"""
        try:
            print("\n🔍 Sign Quality Analysis:")
            print("=" * 50)
            
            for sign in self.signs_data:
                label = sign['label']
                frames = sign['frames']
                original_frames = sign['original_frames']
                
                # Calculate statistics
                frame_lengths = [len(frame) for frame in frames if frame is not None]
                avg_length = np.mean(frame_lengths) if frame_lengths else 0
                
                print(f"\n📝 Sign: {label}")
                print(f"   Original frames: {original_frames}")
                print(f"   Valid frames: {len(frames)}")
                print(f"   Avg feature length: {avg_length:.1f}")
                print(f"   Quality score: {len(frames)/original_frames*100:.1f}%")
            
            return True
            
        except Exception as e:
            print(f"❌ Error analyzing signs: {e}")
            return False
    
    def run_complete_training(self):
        """Run the complete training pipeline"""
        print("🚀 Starting SimpleTrainer Helper Pipeline")
        print("=" * 50)
        
        # Step 1: Connect to database
        if not self.connect_to_database():
            return False
        
        # Step 2: Load signs data
        if not self.load_signs_from_database():
            return False
        
        # Step 3: Analyze sign quality
        self.analyze_signs_quality()
        
        # Step 4: Prepare training data
        X, y = self.prepare_training_data()
        if X is None or y is None:
            return False
        
        # Step 5: Train models
        if not self.train_models(X, y):
            return False
        
        # Step 6: Save models
        if not self.save_models():
            return False
        
        print("\n🎉 Training pipeline completed successfully!")
        print("\nNext steps:")
        print("1. Test your models with new recordings")
        print("2. Use the best performing model in your application")
        print("3. Continue recording more signs to improve accuracy")
        
        return True

def main():
    """Main function to run the training helper"""
    try:
        helper = SimpleTrainerHelper()
        success = helper.run_complete_training()
        
        if success:
            print(f"\n✅ All done! Check the 'trained_models' folder for your ML models.")
        else:
            print(f"\n❌ Training failed. Check the error messages above.")
            
    except KeyboardInterrupt:
        print("\n⏹️ Training interrupted by user")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")

if __name__ == "__main__":
    main()
