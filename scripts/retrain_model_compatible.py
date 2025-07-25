import numpy as np
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import os
import json

print("Starting model retraining with compatible versions...")

FEATURES_DIR = os.path.join('dataset', 'processed', 'training_data')
MAPPINGS_PATH = os.path.join('dataset', 'processed', 'video_mappings.json')

# Check if files exist
features_path = os.path.join(FEATURES_DIR, 'features.npy')
filenames_path = os.path.join(FEATURES_DIR, 'filenames.npy')

if not os.path.exists(features_path):
    print(f"Features file not found: {features_path}")
    exit(1)

if not os.path.exists(filenames_path):
    print(f"Filenames file not found: {filenames_path}")
    exit(1)

# Load features and filenames
print("Loading features and filenames...")
X = np.load(features_path, allow_pickle=True)
filenames = np.load(filenames_path, allow_pickle=True)

print(f"Loaded {len(X)} feature samples and {len(filenames)} filenames")

# Load video mappings
print("Loading video mappings...")
with open(MAPPINGS_PATH, 'r') as f:
    video_mappings_list = json.load(f)

# Convert list to dict for easier lookup by video_id
video_mappings = {}
for mapping in video_mappings_list:
    video_mappings[str(mapping['video_id'])] = mapping['word']

print(f"Loaded {len(video_mappings)} video mappings")

# Map each filename to its label
labels = []
valid_indices = []

for i, fname in enumerate(filenames):
    # Extract video_id from filename (remove .mp4 extension)
    try:
        video_id = fname.replace('.mp4', '')
        if video_id in video_mappings:
            labels.append(video_mappings[video_id])
            valid_indices.append(i)
        else:
            print(f"Warning: No mapping found for {fname} (video_id: {video_id})")
    except:
        print(f"Warning: Could not parse filename {fname}")

print(f"Found labels for {len(labels)} samples")

if len(labels) == 0:
    print("No valid labels found. Cannot train model.")
    exit(1)

# Filter features to only include those with valid labels
X_valid = X[valid_indices]
print(f"Training with {len(X_valid)} valid samples")

# Encode labels as integers
le = LabelEncoder()
y = le.fit_transform(labels)

print(f"Label classes: {list(le.classes_)}")

# Flatten features for classifier
print("Flattening features...")
X_flat = np.array([x.flatten() for x in X_valid])

print(f"Feature shape: {X_flat.shape}")

# Train model
print("Training RandomForest classifier...")
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_flat, y)

# Save model
model_path = os.path.join(FEATURES_DIR, 'asl_model.pkl')
print(f"Saving model to {model_path}")

with open(model_path, 'wb') as f:
    pickle.dump({'model': clf, 'label_encoder': le}, f)

print('Model training complete. Model saved as asl_model.pkl.')
print(f"Model trained on {len(le.classes_)} different ASL signs: {list(le.classes_)}")
