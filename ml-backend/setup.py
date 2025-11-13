"""
Setup and Installation Script
Handles environment setup, dependency installation, and validation
"""

import subprocess
import sys
import os
from pathlib import Path

def print_section(title):
    """Print formatted section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def check_python_version():
    """Check if Python version is 3.9 or higher"""
    print_section("Checking Python Version")
    
    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 9):
        print("❌ Python 3.9 or higher is required!")
        print("Please upgrade Python and try again.")
        return False
    
    print("✅ Python version is compatible")
    return True

def install_dependencies():
    """Install required Python packages"""
    print_section("Installing Dependencies")
    
    requirements_file = Path(__file__).parent / "requirements.txt"
    
    if not requirements_file.exists():
        print("❌ requirements.txt not found!")
        return False
    
    print("Installing packages from requirements.txt...")
    print("This may take a few minutes...\n")
    
    try:
        subprocess.check_call([
            sys.executable, 
            "-m", 
            "pip", 
            "install", 
            "-r", 
            str(requirements_file)
        ])
        print("\n✅ All dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error installing dependencies: {e}")
        return False

def verify_installation():
    """Verify all required packages are installed"""
    print_section("Verifying Installation")
    
    required_packages = [
        "numpy",
        "pandas",
        "scikit-learn",
        "xgboost",
        "tensorflow",
        "fastapi",
        "uvicorn"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - NOT FOUND")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n❌ Missing packages: {', '.join(missing_packages)}")
        print("Please run: pip install -r requirements.txt")
        return False
    
    print("\n✅ All required packages are installed!")
    return True

def create_directories():
    """Create necessary directories"""
    print_section("Creating Directories")
    
    directories = ["models", "logs", "data"]
    
    for directory in directories:
        dir_path = Path(__file__).parent / directory
        if not dir_path.exists():
            dir_path.mkdir(parents=True, exist_ok=True)
            print(f"✅ Created: {directory}/")
        else:
            print(f"ℹ️  Already exists: {directory}/")
    
    return True

def check_disk_space():
    """Check available disk space"""
    print_section("Checking Disk Space")
    
    import shutil
    
    total, used, free = shutil.disk_usage(Path(__file__).parent)
    free_gb = free // (2**30)
    
    print(f"Available disk space: {free_gb} GB")
    
    if free_gb < 2:
        print("⚠️  Warning: Low disk space. At least 2GB recommended.")
        return False
    
    print("✅ Sufficient disk space available")
    return True

def print_next_steps():
    """Print instructions for next steps"""
    print_section("Setup Complete!")
    
    print("✅ Environment is ready for ML training!\n")
    print("Next steps:")
    print("  1. Run data preparation:")
    print("     python data_preparation.py\n")
    print("  2. Train models:")
    print("     python train_models.py\n")
    print("  3. Start API server:")
    print("     python api.py\n")
    print("  4. Access API documentation:")
    print("     http://localhost:8000/docs\n")
    print("For detailed instructions, see README.md")

def main():
    """Main setup process"""
    print("\n" + "="*60)
    print("  Cardiac Insight AI - ML Backend Setup")
    print("="*60)
    
    steps = [
        ("Python Version", check_python_version),
        ("Disk Space", check_disk_space),
        ("Directories", create_directories),
        ("Dependencies", install_dependencies),
        ("Installation Verification", verify_installation)
    ]
    
    for step_name, step_func in steps:
        if not step_func():
            print(f"\n❌ Setup failed at: {step_name}")
            print("Please fix the issue and run setup again.")
            sys.exit(1)
    
    print_next_steps()

if __name__ == "__main__":
    main()
