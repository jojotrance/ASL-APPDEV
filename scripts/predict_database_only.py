import sys
import json
import numpy as np
import os
from pymongo import MongoClient
from urllib.parse import quote_plus
import logging

# Disable pymongo logging
logging.getLogger("pymongo").setLevel(logging.WARNING)

def calculate_similarity(landmarks1, landmarks2):
    """Calculate similarity between two landmark sequences"""
    try:
        # Convert to numpy arrays for easier manipulation
        seq1 = np.array(landmarks1)
        seq2 = np.array(landmarks2)
        
        # Ensure both sequences have the same structure
        if seq1.shape != seq2.shape:
            # Simple alignment by taking minimum length
            min_frames = min(len(seq1), len(seq2))
            seq1 = seq1[:min_frames]
            seq2 = seq2[:min_frames]
        
        # Calculate frame-by-frame differences
        differences = []
        for frame1, frame2 in zip(seq1, seq2):
            frame_diff = 0
            frame_count = 0
            
            # Compare each hand
            for hand1, hand2 in zip(frame1, frame2):
                if len(hand1) == len(hand2):
                    for point1, point2 in zip(hand1, hand2):
                        if isinstance(point1, dict) and isinstance(point2, dict):
                            diff = abs(point1.get('x', 0) - point2.get('x', 0)) + \
                                   abs(point1.get('y', 0) - point2.get('y', 0)) + \
                                   abs(point1.get('z', 0) - point2.get('z', 0))
                        else:
                            # Handle list format
                            diff = abs(point1[0] - point2[0]) + abs(point1[1] - point2[1]) + abs(point1[2] - point2[2])
                        
                        frame_diff += diff
                        frame_count += 1
            
            if frame_count > 0:
                differences.append(frame_diff / frame_count)
        
        if not differences:
            return 0
        
        # Convert difference to similarity percentage
        avg_diff = np.mean(differences)
        similarity = max(0, 100 - (avg_diff * 1000))  # Scale to 0-100
        return similarity
        
    except Exception as e:
        print(f"Error calculating similarity: {e}", file=sys.stderr)
        return 0

def predict_from_database(landmarks_data):
    """Predict ASL sign by comparing with database signs"""
    try:
        # Connect to MongoDB
        username = quote_plus("minasmaxaladze")
        password = quote_plus("Maxaladze11!!")
        client = MongoClient(f"mongodb+srv://{username}:{password}@asl-cluster.mongo.net/asl_translator?retryWrites=true&w=majority")
        db = client['asl_translator']
        signs_collection = db['signs']
        
        # Get all signs from database
        signs = list(signs_collection.find())
        
        if not signs:
            return {'error': 'No trained signs found in database'}
        
        best_match = None
        best_similarity = 0
        
        # Compare with each trained sign
        for sign in signs:
            if 'frames' not in sign or not sign['frames']:
                continue
                
            similarity = calculate_similarity(landmarks_data, sign['frames'])
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = sign.get('word') or sign.get('label', 'unknown')
        
        client.close()
        
        if best_match and best_similarity > 10:  # Minimum threshold
            return {
                'word': best_match,
                'confidence': best_similarity
            }
        else:
            return {
                'word': None,
                'confidence': 0
            }
            
    except Exception as e:
        return {'error': f'Database prediction failed: {str(e)}'}

def main():
    """Main function to handle command line prediction"""
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python predict_database_only.py <landmarks_file>'}))
        return
    
    landmarks_file = sys.argv[1]
    
    try:
        # Read landmarks data
        with open(landmarks_file, 'r', encoding='utf-8') as f:
            landmarks_data = json.load(f)
        
        # Make prediction
        result = predict_from_database(landmarks_data)
        
        # Output result
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'error': f'Failed to process landmarks: {str(e)}'}))

if __name__ == "__main__":
    main()
