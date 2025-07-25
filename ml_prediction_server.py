#!/usr/bin/env python3
"""
ML Model Prediction Server - Serves trained ML models via Flask API
This creates a separate server for testing ML model predictions
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import json
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Global variables to hold loaded models
loaded_models = {}
model_info = {}

def load_models():
    """Load all trained models at startup"""
    try:
        models_dir = Path(__file__).parent / 'trained_models'
        
        if not models_dir.exists():
            logger.warning("No trained_models directory found")
            return False
        
        # Load model info
        info_files = list(models_dir.glob("model_info_*.json"))
        if info_files:
            latest_info = max(info_files, key=lambda x: x.stat().st_mtime)
            with open(latest_info, 'r') as f:
                global model_info
                model_info = json.load(f)
            logger.info(f"Loaded model info from {latest_info.name}")
        
        # Load model files
        model_files = list(models_dir.glob("*.pkl"))
        
        for model_file in model_files:
            try:
                with open(model_file, 'rb') as f:
                    model_data = pickle.load(f)
                
                # Extract model name from filename
                model_name = model_file.stem.rsplit('_', 1)[0]  # Remove timestamp
                
                loaded_models[model_name] = {
                    'model': model_data['model'],
                    'scaler': model_data['scaler'],
                    'label_encoder': model_data['label_encoder'],
                    'accuracy': model_data.get('accuracy', 0),
                    'cv_score': model_data.get('cv_score', 0),
                    'timestamp': model_data.get('timestamp', 'unknown')
                }
                
                logger.info(f"Loaded model: {model_name} (accuracy: {model_data.get('accuracy', 0):.3f})")
                
            except Exception as e:
                logger.error(f"Error loading model {model_file}: {e}")
        
        logger.info(f"Successfully loaded {len(loaded_models)} models")
        return len(loaded_models) > 0
        
    except Exception as e:
        logger.error(f"Error loading models: {e}")
        return False

def flatten_landmarks_for_ml(landmarks):
    """Convert landmarks to flat feature vector for ML models"""
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
        
        return np.array(features).reshape(1, -1) if features else None
        
    except Exception as e:
        logger.error(f"Error flattening landmarks: {e}")
        return None

@app.route('/api/models', methods=['GET'])
def get_available_models():
    """Get list of available models"""
    try:
        models_list = []
        for model_name, model_data in loaded_models.items():
            models_list.append({
                'name': model_name,
                'accuracy': model_data['accuracy'],
                'cv_score': model_data['cv_score'],
                'timestamp': model_data['timestamp']
            })
        
        return jsonify({
            'models': models_list,
            'model_info': model_info,
            'total_models': len(loaded_models)
        })
        
    except Exception as e:
        logger.error(f"Error getting models: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict-ml', methods=['POST'])
def predict_with_ml():
    """Predict using specified ML model"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        landmarks = data.get('landmarks')
        model_name = data.get('model', 'neural_network')
        
        if not landmarks:
            return jsonify({'error': 'No landmarks provided'}), 400
        
        if model_name not in loaded_models:
            available_models = list(loaded_models.keys())
            return jsonify({
                'error': f'Model {model_name} not found. Available models: {available_models}'
            }), 400
        
        # Get the specified model
        model_data = loaded_models[model_name]
        model = model_data['model']
        scaler = model_data['scaler']
        label_encoder = model_data['label_encoder']
        
        # Process landmarks
        flattened_landmarks = flatten_landmarks_for_ml(landmarks)
        
        if flattened_landmarks is None:
            return jsonify({'error': 'Could not process landmarks'}), 400
        
        # Scale features
        scaled_landmarks = scaler.transform(flattened_landmarks)
        
        # Make prediction
        prediction = model.predict(scaled_landmarks)
        
        # Get probability if available
        confidence = 0
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(scaled_landmarks)
            confidence = float(probabilities.max() * 100)
        
        # Convert prediction back to label
        predicted_label = label_encoder.inverse_transform(prediction)[0]
        
        # Apply confidence threshold (similar to database detection)
        min_confidence = 50
        if confidence < min_confidence:
            return jsonify({
                'word': None,
                'confidence': 0,
                'model': model_name,
                'raw_confidence': confidence
            })
        
        return jsonify({
            'word': predicted_label,
            'confidence': confidence,
            'model': model_name,
            'accuracy': model_data['accuracy']
        })
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': len(loaded_models),
        'available_models': list(loaded_models.keys())
    })

@app.route('/', methods=['GET'])
def home():
    """Home endpoint with info"""
    return jsonify({
        'message': 'ML Model Prediction Server',
        'endpoints': {
            '/api/models': 'GET - List available models',
            '/api/predict-ml': 'POST - Make prediction with specified model',
            '/api/health': 'GET - Health check'
        },
        'models_loaded': len(loaded_models)
    })

if __name__ == '__main__':
    print("🚀 Starting ML Model Prediction Server...")
    print("=" * 50)
    
    # Load models at startup
    if load_models():
        print(f"✅ Loaded {len(loaded_models)} models successfully")
        print(f"🔗 Available models: {list(loaded_models.keys())}")
        print("🌐 Starting server on http://localhost:5001")
        print("💡 Use this server to test your ML models!")
        
        app.run(host='0.0.0.0', port=5001, debug=True)
    else:
        print("❌ Failed to load models. Make sure you have trained models in the 'trained_models' folder.")
        print("💡 Run 'python simple_trainer_helper.py' first to train models.")
