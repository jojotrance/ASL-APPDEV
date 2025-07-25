import sys
import json

def main():
    """Simple dummy prediction that returns no match"""
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python predict_dummy.py <landmarks_file>'}))
        return
    
    try:
        # Just return no match for now - we'll handle database comparison in JavaScript
        result = {
            'word': None,
            'confidence': 0
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'error': f'Failed to process landmarks: {str(e)}'}))

if __name__ == "__main__":
    main()
