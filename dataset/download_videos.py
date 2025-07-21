import json
import os
from yt_dlp import YoutubeDL

json_path = r'C:\Users\L14\.cache\kagglehub\datasets\saurabhshahane\american-sign-language-dataset\versions\1\MSASL_train.json'
save_folder = r'C:\Users\L14\Documents\ASL-APPDEV\backend\data\asl_videos'
os.makedirs(save_folder, exist_ok=True)

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for entry in data:
    if not isinstance(entry, dict):
        continue
    label = entry.get('clean_text', '') or entry.get('text', '')
    if not isinstance(label, str) or not label:
        continue
    label = label.upper().replace(' ', '_')
    url = entry.get('url')
    start_time = entry.get('start_time')
    end_time = entry.get('end_time')
    if not url or not label or start_time is None or end_time is None:
        continue
    if not url.startswith('http'):
        url = 'https://' + url
    outtmpl = os.path.join(save_folder, f'{label}_{start_time:.3f}_{end_time:.3f}.%(ext)s')
    print(f"Downloading {label} from {url} [{start_time}-{end_time}]...")
    try:
        ydl_opts = {
            'outtmpl': outtmpl,
            'format': 'mp4/bestaudio/best',
            'quiet': False,
            'noplaylist': True,
            'download_sections': [f'*{start_time}-{end_time}'],
        }
        with YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        print(f"Saved: {label}")
    except Exception as e:
        print(f"Error downloading {url}: {e}")