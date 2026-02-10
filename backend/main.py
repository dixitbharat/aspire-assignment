from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import whisper
import tempfile
import os
from pathlib import Path

app = FastAPI(
    title="Voice Agent API",
    description="API for voice transcription using OpenAI Whisper",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper model (using "base" for balance between speed and accuracy)
# Options: tiny, base, small, medium, large
print("Loading Whisper model...")
model = whisper.load_model("base")
print("Whisper model loaded successfully!")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Voice Agent API is running"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "model": "whisper-base"}


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe audio file to text using OpenAI Whisper.
    
    Accepts audio files (wav, mp3, m4a, webm, etc.)
    Returns transcribed text in English.
    """
    # Validate file type
    allowed_extensions = {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".flac", ".aac"}
    file_ext = Path(file.filename).suffix.lower() if file.filename else ""
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Allowed formats: {', '.join(allowed_extensions)}"
        )
    
    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Transcribe using Whisper
        result = model.transcribe(
            temp_file_path,
            language="en",  # Force English language
            task="transcribe"
        )
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        return JSONResponse(content={
            "success": True,
            "transcription": result["text"].strip(),
            "language": "en"
        })
        
    except Exception as e:
        # Clean up temporary file if it exists
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

