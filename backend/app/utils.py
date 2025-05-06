import aiofiles
from pathlib import Path
from fastapi import UploadFile
from app.config import settings
import hashlib
import os

async def save_uploaded_file(file: UploadFile) -> Path:
    """Save uploaded file with collision-safe filename"""
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    file_hash = hashlib.md5(file.filename.encode()).hexdigest()
    safe_filename = f"{file_hash}{file_ext}"
    file_path = settings.UPLOAD_DIR / safe_filename
    
    # Save file
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(await file.read())
    
    return file_path

def clear_upload_directory():
    """Clear all files in upload directory"""
    for file in settings.UPLOAD_DIR.glob("*"):
        if file.is_file():
            file.unlink()