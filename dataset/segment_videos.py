import json
import os
from yt_dlp import YoutubeDL
import subprocess

json_path = r'C:\Users\L14\.cache\kagglehub\datasets\saurabhshahane\american-sign-language-dataset\versions\1\MSASL_train.json'
full_videos_folder = r'C:\Users\L14\Documents\ASL-APPDEV\backend\data\full_videos'
segments_folder = r'C:\Users\L14\Documents\ASL-APPDEV\backend\data\segment_videos'

os.makedirs(full_videos_folder, exist_ok=True)
os.makedirs(segments_folder, exist_ok=True)

def cut_with_ffmpeg(full_video_path, start_time, end_time, segment_path):
    """Cut segment from full video using ffmpeg"""
    ffmpeg_path = r'C:\ffmpeg-7.1.1-essentials_build\bin\ffmpeg.exe'
    cmd = [
        ffmpeg_path, '-y',
        '-ss', str(start_time),
        '-to', str(end_time),
        '-i', full_video_path,
        '-c', 'copy',
        segment_path
    ]
    subprocess.run(cmd, check=True)

# Load dataset
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Track downloaded videos to avoid re-downloading
downloaded = {}

for entry in data:
    # Get URL and clean it
    url = entry.get('url')
    if not url or not url.startswith('http'):
        url = 'https://' + url if url else None
    if not url:
        continue
    
    # Extract video ID from URL
    video_id = url.split('v=')[-1]
    
    # Download full video if not already downloaded
    full_video_path = os.path.join(full_videos_folder, f'{video_id}.mp4')
    if not os.path.exists(full_video_path):
        print(f'Downloading full video {url}...')
        ydl_opts = {
            'outtmpl': full_video_path,
            'format': 'mp4/bestaudio/best',
            'quiet': False
        }
        try:
            with YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
        except Exception as e:
            print(f"Error downloading {url}: {e}")
            continue

    # Segment logic should always run if full video exists
    label = entry.get('clean_text', '') or entry.get('text', '')
    if not isinstance(label, str) or not label:
        continue
    label = label.upper().replace(' ', '_')

    start_time = entry.get('start_time')
    end_time = entry.get('end_time')
    if start_time is None or end_time is None:
        continue

    segment_path = os.path.join(segments_folder, f'{label}_{start_time:.3f}_{end_time:.3f}.mp4')
    if not os.path.exists(segment_path):
        print(f'Cutting segment {label} [{start_time}-{end_time}]...')
        try:
            cut_with_ffmpeg(full_video_path, start_time, end_time, segment_path)
            print(f'Saved segment: {segment_path}')
        except Exception as e:
            print(f"Error cutting segment: {e}")
