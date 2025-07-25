import sys
import json
import pickle
import numpy as np
import os

def extract_features_from_landmarks(landmarks):
    """Extract 30 features from hand landmarks for prediction - lightweight version"""
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

def predict_asl_sign(landmarks_data, model_path=None):
    """Predict ASL sign from landmarks data"""
    try:
        # Determine model path relative to script location
        if model_path is None:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(script_dir)  # Go up one level from scripts/
            model_path = os.path.join(project_root, 'dataset', 'processed', 'training_data', 'asl_model.pkl')
        
        # Load model
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
        
        if not isinstance(model_data, dict):
            return {'error': 'Invalid model format'}
        
        model = model_data.get('model')
        label_encoder = model_data.get('label_encoder')
        
        if not model or not label_encoder:
            return {'error': 'Missing model components'}
        
        # Extract features
        features = extract_features_from_landmarks(landmarks_data)
        
        if features is None:
            return {'error': 'Could not extract features from landmarks'}
        
        # Make prediction
        try:
            prediction = model.predict(features)[0]
            probabilities = model.predict_proba(features)[0]
            
            # Get predicted class name
            predicted_class = label_encoder.inverse_transform([prediction])[0]
            confidence = float(probabilities[prediction])
            
            return {
                'word': predicted_class,
                'confidence': confidence
            }
            
        except Exception as pred_error:
            return {'error': f'Prediction failed: {str(pred_error)}'}
            
    except Exception as e:
        return {'error': f'Model loading failed: {str(e)}'}

def main():
    """Main function to handle command line prediction"""
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python predict_simple_light.py <landmarks_file>'}))
        return
    
    landmarks_file = sys.argv[1]
    
    try:
        # Read landmarks data
        with open(landmarks_file, 'r', encoding='utf-8') as f:
            landmarks_data = json.load(f)
        
        # Make prediction
        result = predict_asl_sign(landmarks_data)
        
        # Output result
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'error': f'Failed to process landmarks: {str(e)}'}))

if __name__ == "__main__":
    main()
