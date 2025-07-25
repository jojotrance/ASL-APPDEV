#!/usr/bin/env python3
"""
Script to fix the ASL model by retraining it with proper word labels instead of video IDs
"""

import pandas as pd
import numpy as np
import pickle
import json
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

def fix_model_labels():
    """Retrain the model with proper word labels"""
    
    # Paths
    dataset_dir = os.path.join('dataset', 'processed')
    training_dir = os.path.join(dataset_dir, 'training_data')
    
    # Load existing data
    print("Loading existing training data...")
    features = np.load(os.path.join(training_dir, 'features.npy'))
    filenames = np.load(os.path.join(training_dir, 'filenames.npy'))
    
    # Load video dataset to get word mappings
    video_df = pd.read_csv(os.path.join(dataset_dir, 'video_dataset.csv'))
    
    # Create a mapping from video_id to word
    video_to_word = {}
    for _, row in video_df.iterrows():
        video_id = str(row['video_id'])
        word = row['word']
        video_to_word[video_id] = word
    
    print(f"Found {len(video_to_word)} video-to-word mappings")
    
    # Map filenames to words
    words = []
    valid_indices = []
    
    for i, filename in enumerate(filenames):
        # Extract video ID from filename (remove .pkl extension)
        video_id = os.path.splitext(filename)[0]
        
        if video_id in video_to_word:
            words.append(video_to_word[video_id])
            valid_indices.append(i)
        else:
            print(f"Warning: No word mapping found for video ID: {video_id}")
    
    # Filter features to only include videos with word mappings
    features_filtered = features[valid_indices]
    words_filtered = np.array(words)
    
    print(f"Training with {len(words_filtered)} samples")
    print(f"Unique words: {np.unique(words_filtered)}")
    
    # Encode labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(words_filtered)
    
    # Filter out classes with only one sample for proper training
    from collections import Counter
    label_counts = Counter(y_encoded)
    valid_labels = [label for label, count in label_counts.items() if count >= 2]
    
    # Keep only samples with labels that have at least 2 examples
    valid_mask = np.isin(y_encoded, valid_labels)
    features_final = features_filtered[valid_mask]
    y_final = y_encoded[valid_mask]
    
    print(f"After filtering single-sample classes: {len(y_final)} samples")
    print(f"Classes with multiple samples: {len(valid_labels)}")
    
    # Split data (use stratify only if we have enough samples per class)
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            features_final, y_final, test_size=0.2, random_state=42, stratify=y_final
        )
    except ValueError:
        # Fall back to simple split without stratification
        X_train, X_test, y_train, y_test = train_test_split(
            features_final, y_final, test_size=0.2, random_state=42
        )
    
    print(f"Training set size: {X_train.shape[0]}")
    print(f"Test set size: {X_test.shape[0]}")
    
    # Train model
    print("Training Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model accuracy: {accuracy:.4f}")
    
    # Print classification report (only for classes that appear in test set)
    print("\nClassification Report:")
    unique_test_labels = np.unique(y_test)
    test_target_names = [label_encoder.classes_[i] for i in unique_test_labels]
    print(classification_report(y_test, y_pred, labels=unique_test_labels, target_names=test_target_names))
    
    # Save the corrected model
    model_data = {
        'model': model,
        'label_encoder': label_encoder,
        'accuracy': accuracy,
        'feature_names': None,  # We don't have feature names for landmark data
        'training_samples': len(X_train)
    }
    
    model_path = os.path.join(training_dir, 'asl_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model_data, f)
    
    print(f"Model saved to: {model_path}")
    
    # Save updated word mappings
    word_to_id = {word: i for i, word in enumerate(label_encoder.classes_)}
    id_to_word = {i: word for word, i in word_to_id.items()}
    
    with open(os.path.join(dataset_dir, 'word_to_id.json'), 'w') as f:
        json.dump(word_to_id, f, indent=2)
    
    with open(os.path.join(dataset_dir, 'id_to_word.json'), 'w') as f:
        json.dump(id_to_word, f, indent=2)
    
    print("Word mappings updated!")
    print(f"Available words for recognition: {list(label_encoder.classes_)}")
    
    return model_data

if __name__ == "__main__":
    try:
        model_data = fix_model_labels()
        print("\n✅ Model labels fixed successfully!")
        print("Your model can now recognize these words:", list(model_data['label_encoder'].classes_))
    except Exception as e:
        print(f"❌ Error fixing model: {e}")
        import traceback
        traceback.print_exc()
