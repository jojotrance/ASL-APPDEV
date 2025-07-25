import sys
import json
import os
import math

def calculate_simple_features(landmarks):
    """Calculate simple features without NumPy/SciPy"""
    if not landmarks or len(landmarks) == 0:
        return None
    
    features = []
    
    # Process each hand
    for hand_idx in range(min(2, len(landmarks[0]) if landmarks[0] else 0)):
        hand_features = []
        
        # Collect coordinates across all frames
        x_coords, y_coords, z_coords = [], [], []
        
        for frame in landmarks:
            if hand_idx < len(frame):
                hand_data = frame[hand_idx]
                for point in hand_data:
                    if isinstance(point, dict):
                        x_coords.append(point.get('x', 0))
                        y_coords.append(point.get('y', 0))
                        z_coords.append(point.get('z', 0))
        
        if x_coords:
            # Simple statistical features
            for coords in [x_coords, y_coords, z_coords]:
                mean_val = sum(coords) / len(coords)
                variance = sum((x - mean_val) ** 2 for x in coords) / len(coords)
                std_val = math.sqrt(variance)
                min_val = min(coords)
                max_val = max(coords)
                
                hand_features.extend([mean_val, std_val, min_val, max_val])
        else:
            hand_features.extend([0] * 12)  # 3 coords * 4 stats
        
        features.extend(hand_features)
    
    # Pad if only one hand detected
    while len(features) < 24:
        features.append(0)
    
    return features[:24]  # Ensure consistent feature size

def simple_prediction(landmarks):
    """Simple rule-based prediction without ML libraries"""
    try:
        features = calculate_simple_features(landmarks)
        if not features:
            return {"word": None, "confidence": 0, "error": "No valid landmarks"}
        
        # Simple heuristics based on hand movement patterns
        x_movement = abs(features[0] - features[12]) if len(features) > 12 else 0
        y_movement = abs(features[1] - features[13]) if len(features) > 13 else 0
        
        # Basic gesture recognition
        if x_movement > 0.3:
            predicted_word = "wave"
            confidence = 0.75
        elif y_movement > 0.3:
            predicted_word = "up_down"
            confidence = 0.70
        elif x_movement < 0.1 and y_movement < 0.1:
            predicted_word = "still"
            confidence = 0.65
        else:
            predicted_word = "gesture"
            confidence = 0.60
        
        return {
            "word": predicted_word,
            "confidence": confidence
        }
        
    except Exception as e:
        return {"word": None, "confidence": 0, "error": f"Prediction error: {str(e)}"}

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"word": None, "confidence": 0, "error": "No landmarks provided"}))
            sys.exit(0)
            
        # Read landmarks from file
        landmarks_file_path = sys.argv[1]
        
        if not os.path.exists(landmarks_file_path):
            print(json.dumps({"word": None, "confidence": 0, "error": "Landmarks file not found"}))
            sys.exit(1)
            
        with open(landmarks_file_path, 'r') as f:
            landmarks = json.load(f)
            
        result = simple_prediction(landmarks)
        print(json.dumps(result))
        
    except json.JSONDecodeError as e:
        print(json.dumps({"word": None, "confidence": 0, "error": f"JSON decode error: {str(e)}"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"word": None, "confidence": 0, "error": f"Script error: {str(e)}"}))
        sys.exit(1)
