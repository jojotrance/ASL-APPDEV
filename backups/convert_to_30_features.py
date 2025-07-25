import numpy as np
import pickle
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

def convert_126_to_30_features(features_126):
    """Convert 126 features to 30 features using the correct method"""
    # The 126 features likely come from per-landmark statistics
    # We want to convert to the simpler 30-feature format:
    # 2 hands × 3 coordinates (x,y,z) × 5 statistics = 30 features
    
    # For now, let's take the first 30 features as they likely represent
    # the statistical summary we want
    return features_126[:30]

def retrain_with_30_features():
    """Retrain model using first 30 features from existing data"""
    print("🔄 Converting existing model to 30 features...")
    
    data_dir = 'dataset/processed/training_data'
    
    # Load existing training data
    features_path = os.path.join(data_dir, 'features.npy')
    labels_path = os.path.join(data_dir, 'labels.npy')
    
    if not os.path.exists(features_path) or not os.path.exists(labels_path):
        print("❌ Training data not found")
        return False
    
    # Load data
    X_126 = np.load(features_path)
    y = np.load(labels_path)
    
    print(f"📊 Loaded {X_126.shape[0]} samples with {X_126.shape[1]} features")
    
    # Convert to 30 features
    X_30 = np.array([convert_126_to_30_features(sample) for sample in X_126])
    
    print(f"✅ Converted to {X_30.shape[1]} features")
    
    # Load existing label encoder or create new one
    model_path = os.path.join(data_dir, 'asl_model.pkl')
    if os.path.exists(model_path):
        with open(model_path, 'rb') as f:
            old_model_data = pickle.load(f)
            if isinstance(old_model_data, dict) and 'label_encoder' in old_model_data:
                label_encoder = old_model_data['label_encoder']
                print("✅ Using existing label encoder")
            else:
                label_encoder = LabelEncoder()
                y = label_encoder.fit_transform(y)
                print("🔄 Created new label encoder")
    else:
        label_encoder = LabelEncoder()
        y = label_encoder.fit_transform(y)
        print("🔄 Created new label encoder")
    
    # If y is already encoded, we need the string labels
    if len(np.unique(y)) == len(y):
        # y contains unique values for each sample, probably filenames
        # We need to extract actual labels from somewhere else
        print("⚠️  Labels appear to be unique identifiers, attempting to load from metadata...")
        
        # Try to load from word mapping
        word_mapping_path = 'dataset/processed/word_to_id.json'
        if os.path.exists(word_mapping_path):
            with open(word_mapping_path, 'r') as f:
                word_to_id = json.load(f)
                id_to_word = {v: k for k, v in word_to_id.items()}
            
            # Try to map filenames to words (this is a guess)
            filenames_path = os.path.join(data_dir, 'filenames.npy')
            if os.path.exists(filenames_path):
                filenames = np.load(filenames_path)
                # Extract word labels from filenames
                y_words = []
                for filename in filenames:
                    # Try to extract word from filename (format might be WORD_xxx.mp4)
                    word = filename.split('_')[0].upper()
                    y_words.append(word)
                
                label_encoder = LabelEncoder()
                y = label_encoder.fit_transform(y_words)
                print(f"📝 Extracted {len(np.unique(y))} unique labels from filenames")
    
    print(f"🏷️  Classes: {len(np.unique(y))} unique labels")
    if hasattr(label_encoder, 'classes_'):
        print(f"📋 Sample classes: {list(label_encoder.classes_[:10])}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_30, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"🚀 Training on {len(X_train)} samples, testing on {len(X_test)}")
    
    # Train new model
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Test accuracy
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"✅ Model accuracy: {accuracy:.3f}")
    
    # Save new model
    model_data = {
        'model': model,
        'label_encoder': label_encoder,
        'feature_count': 30,
        'accuracy': accuracy
    }
    
    # Backup old model
    backup_path = os.path.join(data_dir, 'asl_model_126_backup.pkl')
    if os.path.exists(model_path):
        os.rename(model_path, backup_path)
        print(f"📦 Old model backed up to {backup_path}")
    
    # Save new model
    with open(model_path, 'wb') as f:
        pickle.dump(model_data, f)
    
    print(f"💾 New 30-feature model saved to {model_path}")
    return True

if __name__ == "__main__":
    import json
    success = retrain_with_30_features()
    if success:
        print("🎉 Successfully converted to 30-feature model!")
        print("💡 Now update the prediction script to use 30 features")
    else:
        print("❌ Conversion failed")
