import json
import pandas as pd
import pickle
import os
from pathlib import Path
from collections import defaultdict

class WLASLParser:
    def __init__(self, dataset_path="../WLASL-master"):  # Changed from "dataset/WLASL-master"
        self.dataset_path = Path(dataset_path)
        self.dataset_dir = str(self.dataset_path)
        self.video_data = []
        self.word_to_id = {}
        self.id_to_word = {}
        
    def load_main_dataset(self):
        # Try multiple possible locations
        possible_paths = [
            os.path.join(self.dataset_dir, 'WLASL_v0.3.json'),
            os.path.join(self.dataset_dir, 'start_kit', 'WLASL_v0.3.json'),
            os.path.join(self.dataset_dir, 'start_kit', 'data', 'WLASL_v0.3.json'),
            # Add more potential paths
            os.path.join(self.dataset_dir, 'data', 'WLASL_v0.3.json'),
            os.path.join(self.dataset_dir, 'WLASL_v0.3', 'WLASL_v0.3.json')
        ]

        print(f"Looking for dataset files...")
        for i, json_path in enumerate(possible_paths):
            print(f"  {i+1}. Checking: {json_path}")
            if os.path.exists(json_path):
                print(f"✓ Found dataset at: {json_path}")
                with open(json_path, 'r') as f:
                    data = json.load(f)
                print(f"Loaded {len(data)} sign entries")
                return data

        # If none found, list available files
        print(f"\n❌ No dataset found. Searching in: {self.dataset_dir}")
        print(f"Absolute path: {os.path.abspath(self.dataset_dir)}")
        
        if not os.path.exists(self.dataset_dir):
            print(f"❌ Directory doesn't exist: {self.dataset_dir}")
            return
            
        for root, dirs, files in os.walk(self.dataset_dir):
            if files:  # Show all files, not just JSON
                print(f"📁 {root}:")
                for file in files[:10]:  # Limit to first 10 files
                    print(f"   - {file}")
                if len(files) > 10:
                    print(f"   ... and {len(files) - 10} more files")

        raise FileNotFoundError("No JSON dataset file found")
        
    def parse_dataset(self, max_classes=None):
        """Parse the dataset and create mappings"""
        data = self.load_main_dataset()
        
        # Group by sign/word
        word_videos = defaultdict(list)
        
        for entry in data:
            word = entry.get('gloss', '').strip().upper()
            if not word:
                continue
                
            # Extract video instances
            instances = entry.get('instances', [])
            for instance in instances:
                video_id = instance.get('video_id', '')
                if video_id:
                    word_videos[word].append({
                        'video_id': video_id,
                        'instance_id': instance.get('instance_id', ''),
                        'bbox': instance.get('bbox', []),
                        'fps': instance.get('fps', 25),
                        'frame_start': instance.get('frame_start', 0),
                        'frame_end': instance.get('frame_end', 0),
                        'url': instance.get('url', ''),
                        'word': word
                    })
        
        # Sort by frequency and take top classes if specified
        sorted_words = sorted(word_videos.items(), key=lambda x: len(x[1]), reverse=True)
        
        if max_classes:
            sorted_words = sorted_words[:max_classes]
            print(f"Using top {max_classes} most frequent signs")
        
        # Create word mappings
        self.word_to_id = {word: idx for idx, (word, _) in enumerate(sorted_words)}
        self.id_to_word = {idx: word for word, idx in self.word_to_id.items()}
        
        # Flatten video data
        self.video_data = []
        for word, videos in sorted_words:
            for video_info in videos:
                video_info['class_id'] = self.word_to_id[word]
                self.video_data.append(video_info)
        
        print(f"Dataset summary:")
        print(f"- Total classes: {len(self.word_to_id)}")
        print(f"- Total video instances: {len(self.video_data)}")
        
        # Show class distribution
        class_counts = defaultdict(int)
        for video in self.video_data:
            class_counts[video['word']] += 1
        
        print(f"\nTop 10 classes by video count:")
        for word, count in sorted(class_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  {word}: {count} videos")
        
        return self.video_data
    
    def save_mappings(self, output_dir="../processed"):  # Changed from "dataset/processed"
        """Save the processed mappings"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)  # Added parents=True
        
        # Save as JSON
        with open(output_path / "video_mappings.json", 'w') as f:
            json.dump(self.video_data, f, indent=2)
        
        with open(output_path / "word_to_id.json", 'w') as f:
            json.dump(self.word_to_id, f, indent=2)
        
        with open(output_path / "id_to_word.json", 'w') as f:
            json.dump(self.id_to_word, f, indent=2)
        
        # Save as DataFrame for easy analysis
        df = pd.DataFrame(self.video_data)
        df.to_csv(output_path / "video_dataset.csv", index=False)
        
        print(f"Saved processed data to {output_path}")
        return output_path

if __name__ == "__main__":
    parser = WLASLParser()
    
    # Parse dataset (use top 50 classes for initial testing)
    video_data = parser.parse_dataset(max_classes=50)
    
    # Save processed data
    parser.save_mappings()