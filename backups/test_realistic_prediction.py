import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'scripts'))

from predict_realtime import predict_sign
import numpy as np

# Create realistic test landmarks data (multiple frames with 21 landmarks each)
test_landmarks = []
for frame in range(10):  # 10 frames
    frame_landmarks = []
    hand_landmarks = []
    
    # Create 21 landmarks for one hand (MediaPipe standard)
    for i in range(21):
        hand_landmarks.append({
            "x": 0.5 + np.random.normal(0, 0.1),  # Random variation around center
            "y": 0.5 + np.random.normal(0, 0.1),
            "z": 0.1 + np.random.normal(0, 0.05)
        })
    
    frame_landmarks.append(hand_landmarks)  # Add hand to frame
    test_landmarks.append(frame_landmarks)  # Add frame to buffer

print(f"Test data: {len(test_landmarks)} frames, {len(test_landmarks[0])} hands, {len(test_landmarks[0][0])} landmarks per hand")

result = predict_sign(test_landmarks)
print("Prediction result:", result)
