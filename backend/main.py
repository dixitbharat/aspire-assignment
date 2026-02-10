from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import tempfile
import os
import httpx
import resend
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from dotenv import load_dotenv
import json
import uuid

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Voice Agent API",
    description="API for voice transcription and summarization",
    version="1.0.0"
)

# Groq API configuration (cloud-based Whisper + LLaMA)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_WHISPER_MODEL = "whisper-large-v3"
GROQ_LLM_MODEL = "llama-3.1-8b-instant"

# Resend API configuration - strip whitespace/newlines from API key
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
resend.api_key = RESEND_API_KEY


class SummarizeRequest(BaseModel):
    transcription: str


class BulletPoint(BaseModel):
    id: str
    text: str


class SummaryResponse(BaseModel):
    success: bool
    bullets: List[BulletPoint]
    nextStep: str


class EmailRequest(BaseModel):
    to: str
    subject: str
    bullets: List[BulletPoint]
    nextStep: str
    isScheduled: bool = False
    scheduledTime: Optional[str] = None


class EmailResponse(BaseModel):
    success: bool
    message: str
    emailId: Optional[str] = None


# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Voice Agent API initialized with Groq Cloud APIs")
print(f"Groq API Key configured: {'Yes' if GROQ_API_KEY else 'No'}")
print(f"Resend API Key configured: {'Yes' if RESEND_API_KEY else 'No'}")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Voice Agent API is running"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "whisper": "groq-whisper-large-v3",
        "llm": "groq-llama-3.1-8b-instant",
        "groq_configured": bool(GROQ_API_KEY),
        "resend_configured": bool(RESEND_API_KEY)
    }


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe audio file to text using Groq Whisper API.
    
    Accepts audio files (wav, mp3, m4a, webm, etc.)
    Returns transcribed text in English.
    """
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Groq API not configured. Please set GROQ_API_KEY environment variable."
        )
    
    # Validate file type
    allowed_extensions = {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".flac", ".aac"}
    file_ext = Path(file.filename).suffix.lower() if file.filename else ""
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Allowed formats: {', '.join(allowed_extensions)}"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Save to temporary file for Groq API
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Call Groq Whisper API
        async with httpx.AsyncClient(timeout=120.0) as client:
            with open(temp_file_path, "rb") as audio_file:
                files = {
                    "file": (file.filename or f"audio{file_ext}", audio_file, f"audio/{file_ext[1:]}")
                }
                data = {
                    "model": GROQ_WHISPER_MODEL,
                    "language": "en",
                    "response_format": "json"
                }
                headers = {
                    "Authorization": f"Bearer {GROQ_API_KEY}"
                }
                
                response = await client.post(
                    GROQ_WHISPER_URL,
                    files=files,
                    data=data,
                    headers=headers
                )
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Groq Whisper API error: {response.text}"
            )
        
        result = response.json()
        transcription = result.get("text", "").strip()
        
        return JSONResponse(content={
            "success": True,
            "transcription": transcription,
            "language": "en"
        })
        
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Transcription timed out. Please try with a shorter audio file."
        )
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
    Uses Groq LLaMA 3.1 8B model.
    """
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Groq API not configured. Please set GROQ_API_KEY environment variable."
        )
    
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

        # Call Groq Chat API
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                GROQ_CHAT_URL,
                json={
                    "model": GROQ_LLM_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1000,
                    "stream": False
                },
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {GROQ_API_KEY}"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"Groq API error: {response.text}"
                )
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Parse the JSON response from the model
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
            detail="Cannot connect to Groq API. Please check your internet connection."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Summarization failed: {str(e)}"
        )


@app.post("/send-email", response_model=EmailResponse)
async def send_email(request: EmailRequest):
    """
    Send an email with the summary to the specified recipient.
    Uses Resend API for email delivery.
    """
    if not RESEND_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Email service not configured. Please set RESEND_API_KEY environment variable."
        )
    
    try:
        # Format the email body with HTML
        bullets_html = "\n".join([f"<li>{bullet.text}</li>" for bullet in request.bullets])
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px 10px 0 0;
                    text-align: center;
                }}
                .content {{
                    background: #f9fafb;
                    padding: 20px;
                    border: 1px solid #e5e7eb;
                    border-top: none;
                }}
                .summary-section {{
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }}
                h2 {{
                    color: #667eea;
                    margin-top: 0;
                    font-size: 18px;
                }}
                ul {{
                    padding-left: 20px;
                }}
                li {{
                    margin-bottom: 8px;
                }}
                .next-step {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 15px;
                }}
                .next-step h3 {{
                    margin: 0 0 10px 0;
                    font-size: 16px;
                }}
                .next-step p {{
                    margin: 0;
                }}
                .footer {{
                    text-align: center;
                    padding: 15px;
                    color: #6b7280;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📧 Voice Note Summary</h1>
            </div>
            <div class="content">
                <div class="summary-section">
                    <h2>Key Points</h2>
                    <ul>
                        {bullets_html}
                    </ul>
                </div>
                <div class="next-step">
                    <h3>🎯 Next Step</h3>
                    <p>{request.nextStep}</p>
                </div>
            </div>
            <div class="footer">
                <p>Sent via VoiceMail AI</p>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        bullets_text = "\n".join([f"• {bullet.text}" for bullet in request.bullets])
        text_content = f"""Voice Note Summary

Key Points:
{bullets_text}

Next Step:
{request.nextStep}

---
Sent via VoiceMail AI
"""
        
        # Send email using Resend
        params = {
            "from": "VoiceMail AI <onboarding@resend.dev>",
            "to": [request.to],
            "subject": request.subject,
            "html": html_content,
            "text": text_content,
        }
        
        # If scheduled, add scheduled_at parameter
        if request.isScheduled and request.scheduledTime:
            # Parse the scheduled time and convert to ISO format
            params["scheduled_at"] = request.scheduledTime
        
        email = resend.Emails.send(params)
        
        return EmailResponse(
            success=True,
            message="Email sent successfully!" if not request.isScheduled else f"Email scheduled for {request.scheduledTime}",
            emailId=email.get("id") if isinstance(email, dict) else str(email)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
