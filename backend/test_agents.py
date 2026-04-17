import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

def test_config():
    """Test if configuration loads correctly"""
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    print("🔍 Configuration Check:")
    print(f"Gemini API Key: {'✓ Set' if gemini_key else '✗ Missing'}")
    print(f"OpenAI API Key: {'✓ Set' if openai_key else '✗ Missing'}")
    print(f"MongoDB URI: {os.getenv('MONGODB_URI', 'Not set')}")
    
    if not gemini_key:
        print("\n⚠️ Please set GEMINI_API_KEY in .env file")
        print("Get your API key from: https://makersuite.google.com/app/apikey")

if __name__ == "__main__":
    test_config()