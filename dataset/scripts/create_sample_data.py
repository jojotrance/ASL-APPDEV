import numpy as np
import pickle
import json
from pathlib import Path
import os

def create_sample_landmarks():
    """Create sample landmark data for testing when video downloads fail"""
    
    processed_dir = Path("../processed")
    landmarks_dir = processed_dir / "landmarks"
    landmarks_dir.mkdir(parents=True, exist_ok=True)
    
    # Load word mappings
    with open(processed_dir / "id_to_word.json", 'r') as f:
        id_to_word = json.load(f)
    
    print("📝 Creating sample landmark data for testing...")
    
    # Check existing landmarks
    existing_files = list(landmarks_dir.glob("*.pkl"))
    existing_words = set()
    
    for file in existing_files:
        try:
            with open(file, 'rb') as f:
                data = pickle.load(f)
            existing_words.add(data['word'])
        except:
            continue
    
    print(f"Found {len(existing_files)} existing files covering {len(existing_words)} words")
    
    # Create sample data for first 15 words
    created_count = 0
    for class_id in range(min(15, len(id_to_word))):
        word = id_to_word[str(class_id)]
        
        # Skip if we already have real data for this word
        if word in existing_words:
            print(f"✅ {word}: Using existing real data")
            continue
        
        # Create 4-5 samples per word
        samples_per_word = np.random.randint(4, 6)
        print(f"📝 Creating {samples_per_word} samples for {word}")
        
        for sample_idx in range(samples_per_word):
            video_id = f"sample_{class_id}_{sample_idx}"
            
            # Generate realistic hand landmarks sequence
            sequence_length = np.random.randint(45, 85)  # Random length
            landmarks_sequence = []
            
            for frame_idx in range(sequence_length):
                # Generate hand landmarks for this frame
                base_landmarks = generate_hand_landmarks(frame_idx, sequence_length, word)
                
                frame_data = {
                    'frame_id': frame_idx,
                    'timestamp': frame_idx / 25.0,  # 25 FPS
                    'hands': [
                        {
                            'handedness': 'Right',
                            'landmarks': base_landmarks
                        }
                    ]
                }
                landmarks_sequence.append(frame_data)
            
            # Save sample landmark data
            landmarks_data = {
                'video_id': video_id,
                'word': word,
                'class_id': int(class_id),
                'landmarks_sequence': landmarks_sequence,
                'video_info': {
                    'sample_data': True,
                    'word': word,
                    'class_id': int(class_id),
                    'generated': True
                }
            }
            
            landmarks_file = landmarks_dir / f"{video_id}.pkl"
            with open(landmarks_file, 'wb') as f:
                pickle.dump(landmarks_data, f)
            
            created_count += 1
    
    # Final count
    total_files = len(list(landmarks_dir.glob("*.pkl")))
    
    print(f"\n✅ Sample data creation complete!")
    print(f"   Created: {created_count} new samples")
    print(f"   Total landmark files: {total_files}")
    print(f"   Covering: {len(set(id_to_word[str(i)] for i in range(min(15, len(id_to_word)))))} words")

def generate_hand_landmarks(frame_idx, total_frames, word):
    """Generate realistic hand landmark coordinates based on word patterns"""
    landmarks = []
    
    # Create movement patterns based on word type
    progress = frame_idx / total_frames
    
    # Different movement patterns for different sign types
    if word in ['BOOK', 'COMPUTER', 'TABLE', 'CHAIR']:
        # Object words - more static with small movements
        base_x = 0.5 + 0.08 * np.sin(progress * np.pi)
        base_y = 0.5 + 0.04 * np.cos(progress * np.pi)
    elif word in ['GO', 'WALK', 'FINISH', 'BEFORE']:
        # Movement/direction words - linear or curved paths
        base_x = 0.3 + 0.4 * progress
        base_y = 0.5 + 0.15 * np.sin(progress * 2 * np.pi)
    elif word in ['DRINK', 'HELP', 'KISS']:
        # Action words - bring hand toward body
        base_x = 0.6 - 0.1 * progress
        base_y = 0.4 + 0.2 * progress
    elif word in ['YES', 'NO', 'WHO', 'WHAT']:
        # Question/response words - nodding/shaking motions
        base_x = 0.5 + 0.05 * np.sin(progress * 4 * np.pi)
        base_y = 0.5 + 0.1 * np.sin(progress * 2 * np.pi)
    else:
        # Default circular pattern
        base_x = 0.5 + 0.12 * np.sin(progress * 1.5 * np.pi)
        base_y = 0.5 + 0.08 * np.cos(progress * 1.5 * np.pi)
    
    # Hand landmark structure (21 points)
    # 0: Wrist, 1-4: Thumb, 5-8: Index, 9-12: Middle, 13-16: Ring, 17-20: Pinky
    hand_structure = [
        (0, 0),      # 0: Wrist (base)
        # Thumb
        (-0.05, -0.03), (-0.08, -0.06), (-0.10, -0.09), (-0.12, -0.11),
        # Index finger  
        (-0.02, 0.06), (0, 0.12), (0.02, 0.16), (0.03, 0.19),
        # Middle finger
        (0.01, 0.07), (0.03, 0.14), (0.04, 0.19), (0.05, 0.23),
        # Ring finger
        (0.04, 0.05), (0.06, 0.10), (0.07, 0.14), (0.08, 0.17),
        # Pinky
        (0.06, 0.02), (0.09, 0.05), (0.11, 0.08), (0.12, 0.10)
    ]
    
    # Generate landmarks with noise and movement
    for i, (offset_x, offset_y) in enumerate(hand_structure):
        # Add realistic noise
        noise_x = np.random.normal(0, 0.01)
        noise_y = np.random.normal(0, 0.01)
        noise_z = np.random.normal(0, 0.005)
        
        # Add finger-specific movement for certain words
        if word in ['WAVE', 'HELLO', 'GOODBYE'] and i > 4:  # Fingers
            wave_motion = 0.02 * np.sin(progress * 6 * np.pi + i)
            offset_x += wave_motion
        
        x = base_x + offset_x + noise_x
        y = base_y + offset_y + noise_y
        z = 0.0 + noise_z
        
        # Clamp to valid MediaPipe range [0, 1]
        x = max(0.05, min(0.95, x))
        y = max(0.05, min(0.95, y))
        
        landmarks.extend([x, y, z])
    
    return landmarks

if __name__ == "__main__":
    create_sample_landmarks()