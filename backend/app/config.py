import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Replicate Configuration
    REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")
    REPLICATE_MODEL = os.getenv("REPLICATE_MODEL", "meta/llama-2-7b-chat")

    # File Storage
    UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "data/uploads"))
    INDEX_DIR = Path(os.getenv("INDEX_DIR", "data/index"))

    # Create directories if they don't exist
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    INDEX_DIR.mkdir(parents=True, exist_ok=True)

settings = Settings()
