import sys
import json
import os

print("Debug info:", file=sys.stderr)
print(f"Args: {sys.argv}", file=sys.stderr)
print(f"Working dir: {os.getcwd()}", file=sys.stderr)

if len(sys.argv) < 2:
    print('{"error": "No file argument"}')
    sys.exit(1)

file_path = sys.argv[1]
print(f"File path: {file_path}", file=sys.stderr)
print(f"File exists: {os.path.exists(file_path)}", file=sys.stderr)

try:
    with open(file_path, 'r') as f:
        content = f.read()
        print(f"File content: {content[:100]}", file=sys.stderr)
        
    with open(file_path, 'r') as f:
        data = json.load(f)
        print(f"JSON loaded successfully: {len(data)} items", file=sys.stderr)
        print('{"word": "test", "confidence": 0.8}')
        
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    print('{"error": "Failed to read file"}')
