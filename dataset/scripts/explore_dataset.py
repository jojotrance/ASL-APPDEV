import os
import json
import pandas as pd
from pathlib import Path

def explore_wlasl_structure():
    """Explore and understand the WLASL dataset structure"""
    # Get the correct path - go up one level from scripts/ to dataset/, then into WLASL-master/
    script_dir = Path(__file__).parent  # dataset/scripts/
    dataset_path = script_dir.parent / "WLASL-master"  # dataset/WLASL-master/
    
    print(f"Looking for dataset at: {dataset_path.absolute()}")
    
    if not dataset_path.exists():
        print(f"❌ Dataset not found at {dataset_path}")
        print("Available directories in dataset/:")
        parent_dir = script_dir.parent
        for item in parent_dir.iterdir():
            if item.is_dir():
                print(f"  📁 {item.name}")
        return
    
    print("=== WLASL Dataset Structure ===")
    for root, dirs, files in os.walk(dataset_path):
        level = root.replace(str(dataset_path), '').count(os.sep)
        if level > 2:  # Limit depth to avoid too much output
            continue
        indent = ' ' * 2 * level
        print(f"{indent}{os.path.basename(root)}/")
        subindent = ' ' * 2 * (level + 1)
        for file in files[:5]:  # Show first 5 files
            print(f"{subindent}{file}")
        if len(files) > 5:
            print(f"{subindent}... and {len(files) - 5} more files")
    
    # Look for key files - CORRECTED PATHS
    key_files = [
        "start_kit/WLASL_v0.3.json",  # The JSON is in start_kit folder!
        "start_kit/video_downloader.py",
        "start_kit/preprocess.py",
        "start_kit/data_reader.py"
    ]
    
    print("\n=== Key Files Found ===")
    for file_path in key_files:
        full_path = dataset_path / file_path
        if full_path.exists():
            print(f"✓ {file_path}")
            if file_path.endswith('.json'):
                try:
                    with open(full_path, 'r') as f:
                        data = json.load(f)
                    print(f"  - Contains {len(data)} entries")
                    if data and isinstance(data, list):
                        print(f"  - Sample entry keys: {list(data[0].keys())}")
                        # Show a sample entry structure
                        if len(data) > 0:
                            sample = data[0]
                            print(f"  - Sample gloss: '{sample.get('gloss', 'N/A')}'")
                            instances = sample.get('instances', [])
                            print(f"  - Sample has {len(instances)} instances")
                            if instances:
                                print(f"  - First instance keys: {list(instances[0].keys())}")
                except Exception as e:
                    print(f"  - Error reading: {e}")
        else:
            print(f"✗ {file_path} (not found)")
    
    # Check for videos directory
    print("\n=== Video Directories ===")
    video_dirs = ["videos", "raw_videos", "data"]
    for video_dir in video_dirs:
        video_path = dataset_path / video_dir
        if video_path.exists():
            video_files = list(video_path.glob("*.mp4")) + list(video_path.glob("*.avi"))
            print(f"✓ {video_dir}/ - Contains {len(video_files)} video files")
        else:
            print(f"✗ {video_dir}/ (not found)")
    
    # Check for any JSON files anywhere
    print("\n=== All JSON files in dataset ===")
    json_files = list(dataset_path.rglob("*.json"))
    if json_files:
        for json_file in json_files:
            relative_path = json_file.relative_to(dataset_path)
            print(f"📄 {relative_path}")
    else:
        print("No JSON files found in dataset")

if __name__ == "__main__":
    explore_wlasl_structure()