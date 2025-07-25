#!/usr/bin/env python3
"""
Setup script for SimpleTrainer Helper
Installs all required Python packages
"""

import subprocess
import sys

def install_package(package):
    """Install a Python package using pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        return True
    except subprocess.CalledProcessError:
        return False

def main():
    print("🔧 Setting up SimpleTrainer Helper...")
    print("Installing required packages...")
    
    packages = [
        "pymongo",
        "numpy", 
        "scikit-learn",
        "opencv-python",
        "mediapipe"
    ]
    
    failed_packages = []
    
    for package in packages:
        print(f"📦 Installing {package}...")
        if install_package(package):
            print(f"✅ {package} installed successfully")
        else:
            print(f"❌ Failed to install {package}")
            failed_packages.append(package)
    
    if failed_packages:
        print(f"\n⚠️ Some packages failed to install: {failed_packages}")
        print("Please install them manually using:")
        for package in failed_packages:
            print(f"  pip install {package}")
    else:
        print("\n🎉 All packages installed successfully!")
        print("You can now run: python simple_trainer_helper.py")

if __name__ == "__main__":
    main()
