"""
Complete preprocessing pipeline for WLASL dataset
Run this script to download videos, extract landmarks, and prepare training data
"""

from video_processor import VideoLandmarkExtractor
from data_preprocessor import LandmarkDataPreprocessor
from create_sample_data import create_sample_landmarks
from pathlib import Path
import time

def main():
    print("🚀 === WLASL Dataset Preprocessing Pipeline ===\n")
    
    # Check if we have existing landmark data
    landmarks_dir = Path("../processed/landmarks")
    existing_files = list(landmarks_dir.glob("*.pkl")) if landmarks_dir.exists() else []
    
    print(f"Found {len(existing_files)} existing landmark files")
    
    if len(existing_files) < 20:  # If we don't have enough data
        print("\n📹 Step 1: Video download issues detected...")
        print("The WLASL video URLs are mostly broken/private/expired.")
        print("Would you like to:")
        print("1. Try downloading videos anyway (likely to fail)")
        print("2. Create sample landmark data for testing")
        print("3. Skip to preprocessing existing data")
        
        choice = input("\nChoose option (1/2/3, default=2): ").strip() or "2"
        
        if choice == "1":
            # Try video processing
            print("\n📹 Attempting video processing...")
            extractor = VideoLandmarkExtractor()
            
            max_videos = input(f"\nHow many videos to try? (default=10): ").strip()
            max_videos = int(max_videos) if max_videos.isdigit() else 10
            
            processed, failed = extractor.process_video_batch(
                batch_size=2, 
                max_videos=max_videos,
                skip_failed_urls=True
            )
            
            print(f"✅ Processed: {processed}, ❌ Failed: {failed}")
            
        elif choice == "2":
            # Create sample data
            print("\n📝 Creating sample landmark data...")
            create_sample_landmarks()
            
        elif choice == "3":
            if len(existing_files) == 0:
                print("❌ No existing landmark data found. Creating sample data...")
                create_sample_landmarks()
            else:
                print(f"✅ Using {len(existing_files)} existing landmark files")
    else:
        print(f"✅ Using {len(existing_files)} existing landmark files")
    
    # Step 2: Preprocess landmark data
    print("\n🔄 Step 2: Preprocessing landmark data for training...")
    print("Converting landmarks to training-ready arrays...")
    
    preprocessor = LandmarkDataPreprocessor()
    
    try:
        result = preprocessor.preprocess_dataset()
        
        if result is None:
            print("❌ No landmark data found. Something went wrong.")
            print("Try running create_sample_data.py manually.")
            return
            
        X_train, X_val, X_test, y_train, y_val, y_test = result
        
        print("\n🎉 === Preprocessing Complete! ===")
        print(f"📁 Training data saved to: dataset/processed/training_data/")
        print(f"📊 Data shapes:")
        print(f"   - Training:   {X_train.shape} features, {y_train.shape} labels")
        print(f"   - Validation: {X_val.shape} features, {y_val.shape} labels") 
        print(f"   - Test:       {X_test.shape} features, {y_test.shape} labels")
        print(f"📝 Format: [samples, frames, hands, landmarks_per_hand]")
        print(f"🏷️  Classes: {len(set(y_train))} ASL signs")
        
        # Show what we can do next
        print(f"\n🚀 Next Steps:")
        print(f"   1. Train a model using this data")
        print(f"   2. Test the ASL recognition pipeline")
        print(f"   3. Integrate with your React frontend")
        print("\n✅ Ready for model development!")
        
    except Exception as e:
        print(f"❌ Error in preprocessing: {e}")
        import traceback
        traceback.print_exc()
        print("\nTrying to create sample data as fallback...")
        create_sample_landmarks()

if __name__ == "__main__":
    main()