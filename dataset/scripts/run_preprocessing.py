"""
Complete preprocessing pipeline for WLASL dataset
Run this script to download videos, extract landmarks, and prepare training data
"""

from video_processor import VideoLandmarkExtractor
from data_preprocessor import LandmarkDataPreprocessor
import time

def main():
    print("🚀 === WLASL Dataset Preprocessing Pipeline ===\n")
    
    # Step 1: Extract landmarks from videos
    print("📹 Step 1: Processing videos and extracting landmarks...")
    print("This will download videos and extract hand landmarks using MediaPipe")
    
    extractor = VideoLandmarkExtractor()
    
    # Show available signs
    print(f"Available signs: {len(extractor.word_to_id)} classes")
    print(f"Total videos: {len(extractor.video_data)} instances")
    
    # Ask user how many videos to process
    max_videos = input(f"\nHow many videos to process? (Enter number or 'all', default=20): ").strip()
    if max_videos.lower() == 'all':
        max_videos = None
    else:
        try:
            max_videos = int(max_videos) if max_videos else 20
        except ValueError:
            max_videos = 20
    
    print(f"Processing {max_videos if max_videos else 'all'} videos...")
    
    # Start with smaller batch for testing
    processed, failed = extractor.process_video_batch(
        batch_size=3, 
        max_videos=max_videos
    )
    
    if processed == 0:
        print("❌ No videos were processed successfully.")
        print("Common issues:")
        print("- Internet connection problems")
        print("- Video URLs are broken/expired")
        print("- Missing yt-dlp (install with: pip install yt-dlp)")
        return
    
    print(f"✅ Successfully processed {processed} videos, {failed} failed\n")
    
    # Step 2: Preprocess landmark data
    print("🔄 Step 2: Preprocessing landmark data for training...")
    print("Converting landmarks to training-ready arrays...")
    
    preprocessor = LandmarkDataPreprocessor()
    
    try:
        result = preprocessor.preprocess_dataset()
        
        if result is None:
            print("❌ No landmark data found. Check if Step 1 completed successfully.")
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
        print("\n✅ You can now proceed to model training!")
        
    except Exception as e:
        print(f"❌ Error in preprocessing: {e}")
        print("Make sure landmarks were extracted successfully first.")

if __name__ == "__main__":
    main()