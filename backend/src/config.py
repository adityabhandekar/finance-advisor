import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env from backend directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Config:
    # API Keys - Read from .env
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    
    # Database
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "financeadvisor")
    
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key-change-this")
    
    # Model Configuration
    LLM_MODEL = "gemini-1.5-pro"  # or gemini-1.5-flash
    
    # Currency Settings
    CURRENCY_SYMBOL = "₹"
    CURRENCY_CODE = "INR"
    
    # CrewAI Settings
    CREWAI_VERBOSE = os.getenv("DEBUG", "true").lower() == "true"
    
    @classmethod
    def validate(cls):
        print("\n🔍 Checking Configuration:")
        print(f"✓ Gemini API Key: {'Set' if cls.GEMINI_API_KEY else 'Missing'}")
        print(f"✓ OpenAI API Key: {'Set' if cls.OPENAI_API_KEY else 'Missing'}")
        print(f"✓ MongoDB URI: {cls.MONGODB_URI}")
        print(f"✓ Database Name: {cls.DATABASE_NAME}")
        print(f"✓ Currency: {cls.CURRENCY_SYMBOL} {cls.CURRENCY_CODE}")
        
        if not cls.GEMINI_API_KEY:
            print("\n⚠️ WARNING: GEMINI_API_KEY not found in .env file!")
            print("Please add your Gemini API key to backend/.env")
        
        return cls

# Validate on import
Config.validate()