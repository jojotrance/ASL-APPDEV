import os
import cv2
import numpy as np
import mediapipe as mp
import pickle

FEATURES_DIR = os.path.join('dataset', 'processed', 'training_data')
MODEL_PATH = os.path.join(FEATURES_DIR, 'asl_model.pkl')

# Load model and label encoder
with open(MODEL_PATH, 'rb') as f:
    data = pickle.load(f)
    clf = data['model']
    le = data['label_encoder']

mp_hands = mp.solutions.hands

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
            landmarks.append([0]*63)
    cap.release()
    hands.close()
    return np.array(landmarks)

def predict(video_path):
    lm = extract_landmarks_from_video(video_path)
    X_flat = lm.flatten().reshape(1, -1)
    pred = clf.predict(X_flat)
    asl_word = le.inverse_transform(pred)[0]
    return asl_word

if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print('Usage: python predict_asl.py <video_path>')
        exit(1)
    video_path = sys.argv[1]
    result = predict(video_path)
    print(f'Predicted ASL word: {result}')
