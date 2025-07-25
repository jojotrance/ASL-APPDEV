import json

# Create a realistic landmark buffer with 15 frames and full 21-point hand landmarks
def create_test_landmarks():
    landmarks_buffer = []
    
    for frame in range(15):  # 15 frames as per BUFFER_SIZE
        frame_data = []
        
        # Add one hand with 21 landmarks (MediaPipe standard)
        hand_landmarks = []
        for i in range(21):
            hand_landmarks.append({
                "x": 0.5 + (i * 0.01) + (frame * 0.001),
                "y": 0.5 + (i * 0.01) + (frame * 0.001), 
                "z": 0.1 + (i * 0.001) + (frame * 0.0001)
            })
        
        frame_data.append(hand_landmarks)
        landmarks_buffer.append(frame_data)
    
    return landmarks_buffer

# Generate and save test data
test_data = create_test_landmarks()
with open('test_landmarks_full.json', 'w') as f:
    json.dump(test_data, f)

print(f"Created test data: {len(test_data)} frames, {len(test_data[0])} hands, {len(test_data[0][0])} landmarks per hand")
