#!/usr/bin/env python3
"""
Test script to verify the ML model integration works correctly
"""
import sys
import json
import os

# Add the scripts directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_prediction_script():
    """Test the predict_realtime.py script"""
    print("Testing ML model prediction...")
    
    # Create dummy landmarks data (2 hands, 21 points each, x,y,z coordinates)
    dummy_landmarks = []
    for hand in range(2):
        hand_landmarks = []
        for point in range(21):
            hand_landmarks.append({
                'x': 0.5 + (point * 0.01),
                'y': 0.5 + (point * 0.01), 
                'z': 0.0
            })
        dummy_landmarks.append(hand_landmarks)
    
    # Import and test the prediction function
    try:
        from predict_realtime import predict_sign
        result = predict_sign(dummy_landmarks)
        print("✅ Prediction script working!")
        print(f"Result: {result}")
        return True
    except Exception as e:
        print(f"❌ Prediction script error: {e}")
        return False

def test_model_files():
    """Check if model files exist"""
    model_path = os.path.join('..', 'dataset', 'processed', 'training_data', 'asl_model.pkl')
    if os.path.exists(model_path):
        print("✅ Model file found!")
        return True
    else:
        print("❌ Model file not found. Run train_model.py first.")
        return False

if __name__ == "__main__":
    print("🧪 Testing ASL ML Model Integration\n")
    
    # Test 1: Check if model files exist
    model_exists = test_model_files()
    
    # Test 2: Test prediction script
    if model_exists:
        prediction_works = test_prediction_script()
    else:
        print("⏭️  Skipping prediction test - no model file")
        prediction_works = False
    
    print("\n" + "="*50)
    if model_exists and prediction_works:
        print("✅ All tests passed! ML model integration is ready.")
        print("🚀 You can now start your backend server and test the real-time prediction.")
    else:
        print("❌ Some tests failed. Please fix the issues above.")
        if not model_exists:
            print("💡 Run 'python scripts/train_model.py' to create the model first.")
