import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'scripts'))

from predict_realtime import predict_sign

# Test with sample landmarks data
test_landmarks = [
    [
        {"x": 0.5, "y": 0.5, "z": 0.1},
        {"x": 0.6, "y": 0.4, "z": 0.2},
        # Add more points...
    ]
]

result = predict_sign(test_landmarks)
print("Test prediction result:", result)
