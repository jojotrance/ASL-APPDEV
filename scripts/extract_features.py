import os
import cv2
import numpy as np
import mediapipe as mp
from tqdm import tqdm

VIDEOS_DIR = os.path.join('dataset', 'processed', 'videos')
FEATURES_DIR = os.path.join('dataset', 'processed', 'training_data')

mp_hands = mp.solutions.hands

os.makedirs(FEATURES_DIR, exist_ok=True)

# Helper to extract hand landmarks from a video
def extract_landmarks_from_video(video_path):
    cap = cv2.VideoCapture(video_path)
    hands = mp_hands.Hands(static_image_mode=False, max_num_hands=2)
    landmarks = []
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(frame_rgb)
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                coords = []
                for lm in hand_landmarks.landmark:
                    coords.extend([lm.x, lm.y, lm.z])
                landmarks.append(coords)
        else:
            landmarks.append([0]*63)  # 21 landmarks * 3 coords
    cap.release()
    hands.close()
    return np.array(landmarks)

# Process all videos
features = []
filenames = []
for fname in tqdm(os.listdir(VIDEOS_DIR)):
    if fname.endswith('.mp4') or fname.endswith('.webm'):
        video_path = os.path.join(VIDEOS_DIR, fname)
        lm = extract_landmarks_from_video(video_path)
        features.append(lm)
        filenames.append(fname)

# Save features and filenames
np.save(os.path.join(FEATURES_DIR, 'features.npy'), features)
np.save(os.path.join(FEATURES_DIR, 'filenames.npy'), filenames)
print('Feature extraction complete.')
