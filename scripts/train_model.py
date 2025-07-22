
import numpy as np
import pickle
from sklearn.ensemble import RandomForestClassifier
import os
import json

FEATURES_DIR = os.path.join('dataset', 'processed', 'training_data')
MAPPINGS_PATH = os.path.join('dataset', 'processed', 'video_mappings.json')

# Load features and filenames
X = np.load(os.path.join(FEATURES_DIR, 'features.npy'), allow_pickle=True)
filenames = np.load(os.path.join(FEATURES_DIR, 'filenames.npy'), allow_pickle=True)

# Load video to label mapping
with open(MAPPINGS_PATH, 'r') as f:
    video_mappings = json.load(f)

# Map each filename to its label
labels = [video_mappings.get(fname, None) for fname in filenames]
if None in labels:
    print('Warning: Some filenames do not have a label mapping.')

# Encode labels as integers
from sklearn.preprocessing import LabelEncoder
le = LabelEncoder()
y = le.fit_transform(labels)

# Flatten features for classifier (simple approach)
X_flat = np.array([x.flatten() for x in X])

clf = RandomForestClassifier()
clf.fit(X_flat, y)

with open(os.path.join(FEATURES_DIR, 'asl_model.pkl'), 'wb') as f:
    pickle.dump({'model': clf, 'label_encoder': le}, f)

print('Model training complete. Model saved as asl_model.pkl.')
