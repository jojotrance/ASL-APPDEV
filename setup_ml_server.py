#!/usr/bin/env python3
"""
Setup Flask server for ML model testing
"""

import subprocess
import sys

def install_flask_packages():
    """Install required Flask packages"""
    packages = [
        "flask",
        "flask-cors"
    ]
    
    print("📦 Installing Flask packages for ML server...")
    
    for package in packages:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✅ {package} installed")
        except subprocess.CalledProcessError:
            print(f"❌ Failed to install {package}")
            return False
    
    return True

if __name__ == "__main__":
    print("🔧 Setting up ML Prediction Server...")
    
    if install_flask_packages():
        print("\n✅ Setup complete!")
        print("\nNow you can run:")
        print("  python ml_prediction_server.py")
    else:
        print("\n❌ Setup failed. Please install Flask manually:")
        print("  pip install flask flask-cors")
