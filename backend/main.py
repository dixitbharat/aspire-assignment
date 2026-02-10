from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import whisper
import tempfile
import os
import httpx
from pathlib import Path
from typing import List, Optional

app = FastAPI(
    title="Voice Agent API",
    description="API for voice transcription and summarization",
    version="1.0.0"
)

# LM Studio API configuration
LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions"
LM_STUDIO_MODEL = "meta-llama-3.1-8b-instruct"


class SummarizeRequest(BaseModel):
    transcription: str


class BulletPoint(BaseModel):
    id: str
    text: str


class SummaryResponse(BaseModel):
    success: bool
    bullets: List[BulletPoint]
    nextStep: str

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


@app.post("/summarize", response_model=SummaryResponse)
async def summarize_transcription(request: SummarizeRequest):
    """
    Summarize transcription into 5 bullet points and a next step.
    Uses Meta LLaMA 3.1 8B model hosted on LM Studio.
    """
    try:
        # Create the prompt for summarization
        system_prompt = """You are a helpful assistant that summarizes voice transcriptions. 
Your task is to create exactly 5 concise bullet points summarizing the key information from the transcription.
Also provide one clear next step or action item based on the content.

Respond in the following JSON format only, with no additional text:
{
    "bullets": [
        "First key point",
        "Second key point",
        "Third key point",
        "Fourth key point",
        "Fifth key point"
    ],
    "nextStep": "The recommended next action"
}"""

        user_prompt = f"Please summarize the following transcription into 5 bullet points and suggest a next step:\n\n{request.transcription}"

        # Call LM Studio API
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                LM_STUDIO_URL,
                json={
                    "model": LM_STUDIO_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1000,
                    "stream": False
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"LM Studio API error: {response.text}"
                )
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Parse the JSON response from the model
            import json
            try:
                # Try to extract JSON from the response
                # Sometimes the model might wrap it in markdown code blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                
                parsed = json.loads(content.strip())
                bullets = parsed.get("bullets", [])
                next_step = parsed.get("nextStep", "Review the summary and take appropriate action.")
                
                # Ensure we have exactly 5 bullets
                while len(bullets) < 5:
                    bullets.append("Additional information not available")
                bullets = bullets[:5]
                
            except json.JSONDecodeError:
                # If JSON parsing fails, try to extract bullet points manually
                lines = content.strip().split("\n")
                bullets = []
                next_step = "Review the summary and take appropriate action."
                
                for line in lines:
                    line = line.strip()
                    if line.startswith(("-", "•", "*", "1.", "2.", "3.", "4.", "5.")):
                        # Remove bullet markers
                        clean_line = line.lstrip("-•*0123456789. ")
                        if clean_line:
                            bullets.append(clean_line)
                    elif "next step" in line.lower() or "action" in line.lower():
                        next_step = line.split(":", 1)[-1].strip() if ":" in line else line
                
                # Ensure we have exactly 5 bullets
                while len(bullets) < 5:
                    bullets.append("Additional information not available")
                bullets = bullets[:5]
            
            # Create bullet point objects with UUIDs
            import uuid
            bullet_objects = [
                BulletPoint(id=str(uuid.uuid4()), text=bullet)
                for bullet in bullets
            ]
            
            return SummaryResponse(
                success=True,
                bullets=bullet_objects,
                nextStep=next_step
            )
            
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to LM Studio. Please ensure LM Studio is running with the meta-llama-3.1-8b-instruct model loaded."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Summarization failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

