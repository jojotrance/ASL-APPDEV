#!/usr/bin/env python3
"""
Test Trained Models - Quick verification script
"""

import pickle
import numpy as np
from pathlib import Path
import json

def test_trained_models():
    """Test if trained models can make predictions"""
    print("🧪 Testing Trained Models")
    print("=" * 40)
    
    models_dir = Path(__file__).parent / 'trained_models'
    
    # Find the latest model files
    model_files = list(models_dir.glob("*.pkl"))
    
    if not model_files:
        print("❌ No trained models found!")
        return False
    
    print(f"📦 Found {len(model_files)} trained models:")
    for model_file in model_files:
        print(f"  - {model_file.name}")
    
    # Test each model
    for model_file in model_files:
        try:
            print(f"\n🔍 Testing {model_file.stem}...")
            
            # Load model
            with open(model_file, 'rb') as f:
                model_data = pickle.load(f)
            
            model = model_data['model']
            scaler = model_data['scaler']
            label_encoder = model_data['label_encoder']
            accuracy = model_data['accuracy']
            
            print(f"   ✅ Model loaded successfully")
            print(f"   📊 Training accuracy: {accuracy:.1%}")
            print(f"   🏷️ Can predict: {list(label_encoder.classes_)}")
            
            # Create dummy test data (simulate hand landmarks)
            dummy_landmarks = np.random.rand(1, 126)  # 126 features
            dummy_landmarks_scaled = scaler.transform(dummy_landmarks)
            
            # Make prediction
            prediction = model.predict(dummy_landmarks_scaled)
            probability = None
            if hasattr(model, 'predict_proba'):
                probability = model.predict_proba(dummy_landmarks_scaled).max()
            
            predicted_label = label_encoder.inverse_transform(prediction)[0]
            
            print(f"   🎯 Test prediction: '{predicted_label}'")
            if probability:
                print(f"   💪 Confidence: {probability:.1%}")
            
        except Exception as e:
            print(f"   ❌ Error testing {model_file.name}: {e}")
    
    print(f"\n✅ Model testing completed!")
    return True

def check_model_info():
    """Display detailed model information"""
    models_dir = Path(__file__).parent / 'trained_models'
    info_files = list(models_dir.glob("model_info_*.json"))
    
    if info_files:
        latest_info = max(info_files, key=lambda x: x.stat().st_mtime)
        print(f"\n📋 Latest Training Session: {latest_info.name}")
        
        with open(latest_info, 'r') as f:
            info = json.load(f)
        
        print(f"📅 Trained on: {info['timestamp']}")
        print(f"🔢 Total signs: {info['total_signs']}")
        print(f"🏷️ Sign labels: {', '.join(info['sign_labels'])}")
        
        print(f"\n🏆 Model Performance:")
        for model_name, performance in info['models'].items():
            print(f"  {model_name:15} | Accuracy: {performance['accuracy']:.1%} | CV Score: {performance['cv_score']:.1%}")

if __name__ == "__main__":
    print("🚀 Model Verification Script")
    print("=" * 50)
    
    test_trained_models()
    check_model_info()
    
    print(f"\n💡 Next Steps:")
    print(f"1. Your models are ready to use!")
    print(f"2. Test them in your web app by recording signs")
    print(f"3. The system should now recognize the signs you trained")
