import sys
import json
import pickle
import numpy as np
import os
from sklearn.preprocessing import LabelEncoder

def extract_features_from_landmarks(landmarks):
    """Extract statistical features from hand landmarks for prediction - matching training format exactly"""
    if not landmarks or len(landmarks) == 0:
        return None
    
    features = []
    
    # Calculate statistics for each landmark coordinate (match training exactly)
    for hand_idx in range(2):  # Support up to 2 hands
        hand_features = []
        
        # Collect all coordinates for this hand across all frames
        x_coords, y_coords, z_coords = [], [], []
        
        for frame in landmarks:
            if hand_idx < len(frame):
                hand_data = frame[hand_idx]
                
                # Extract coordinates from each landmark point
                for point in hand_data:
                    if isinstance(point, dict):
                        x_coords.append(point.get('x', 0))
                        y_coords.append(point.get('y', 0))
                        z_coords.append(point.get('z', 0))
                    elif isinstance(point, list) and len(point) >= 3:
                        x_coords.append(point[0])
                        y_coords.append(point[1])
                        z_coords.append(point[2])
        
        if x_coords:  # If we have data for this hand
            # Statistical features for each coordinate type (exactly like training)
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
    
    # Should be exactly 30 features (2 hands * 15 features each)
    if len(features) != 30:
        # Pad or truncate to exactly 30
        if len(features) < 30:
            features.extend([0] * (30 - len(features)))
        else:
            features = features[:30]
    
    return np.array(features).reshape(1, -1)

def predict_sign(landmarks):
    """Predict ASL sign from landmarks using trained model"""
    try:
        # Remove all debug prints to avoid JSON parsing issues
        
        # Define paths relative to script location
        script_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(script_dir, '..', 'dataset', 'processed', 'training_data', 'asl_model.pkl')
        
        # Check if model exists
        if not os.path.exists(model_path):
            return {"word": "unknown", "confidence": 0.5, "error": f"Model not found at {model_path}"}
        
        # Load the trained model
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
        
        # Handle different model save formats
        if isinstance(model_data, dict):
            model = model_data.get('model')
            label_encoder = model_data.get('label_encoder')
        else:
            model = model_data
            label_encoder = None
        
        # Extract features
        features = extract_features_from_landmarks(landmarks)
        if features is None:
            return {"word": None, "confidence": 0, "error": "No valid landmarks"}
        
        # Remove debug prints to avoid JSON parsing issues
        
        # Make prediction
        prediction = model.predict(features)[0]
        
        # Get confidence score
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(features)[0]
            confidence = float(np.max(probabilities))
        else:
            confidence = 0.8
        
        # Decode the prediction
        if label_encoder:
            try:
                predicted_word = label_encoder.inverse_transform([prediction])[0]
            except:
                predicted_word = f"sign_{prediction}"
        else:
            predicted_word = f"sign_{prediction}"
        
        # Removed debug print to avoid JSON parsing issues
        
        return {
            "word": predicted_word,
            "confidence": confidence
        }
        
    except Exception as e:
        error_msg = f"Error in prediction: {str(e)}"
        print(error_msg, file=sys.stderr)
        return {"word": None, "confidence": 0, "error": error_msg}

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"word": None, "confidence": 0, "error": "No landmarks provided"}))
            sys.exit(0)
            
        # Read landmarks from file path (not direct JSON)
        landmarks_file_path = sys.argv[1]
        
        # Check if file exists
        if not os.path.exists(landmarks_file_path):
            print(json.dumps({"word": None, "confidence": 0, "error": "Landmarks file not found"}))
            sys.exit(1)
            
        # Read and parse the JSON file
        with open(landmarks_file_path, 'r') as f:
            landmarks = json.load(f)
            
        result = predict_sign(landmarks)
        print(json.dumps(result))
        
    except json.JSONDecodeError as e:
        print(json.dumps({"word": None, "confidence": 0, "error": f"JSON decode error: {str(e)}"}), file=sys.stderr)
        sys.exit(1)
    except FileNotFoundError as e:
        print(json.dumps({"word": None, "confidence": 0, "error": f"File not found: {str(e)}"}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"word": None, "confidence": 0, "error": f"Script error: {str(e)}"}), file=sys.stderr)
        sys.exit(1)
