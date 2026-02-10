# VoiceMail AI

A voice agent application that captures spoken input, transcribes it using OpenAI Whisper, summarizes it using LLaMA 3.1 (via LM Studio), and emails the summary to the user.

![VoiceMail AI](https://img.shields.io/badge/Voice-Agent-blue) ![React](https://img.shields.io/badge/React-18-61DAFB) ![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688) ![Whisper](https://img.shields.io/badge/Whisper-OpenAI-412991)

## Features

- 🎤 **Voice Recording** - Record audio directly from the browser or upload audio files
- 📝 **Transcription** - Automatic speech-to-text using OpenAI Whisper (self-hosted)
- 🤖 **AI Summarization** - Generate 5 bullet points + next step using LLaMA 3.1 (via LM Studio)
- ✏️ **Editable Summary** - Review and customize the generated summary
- 📧 **Email Delivery** - Send summary via email instantly or schedule for later
- 🎨 **Modern UI** - Beautiful, responsive interface with dark theme

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Lucide React (icons)
- date-fns (date formatting)

### Backend
- FastAPI (Python)
- OpenAI Whisper (speech-to-text)
- LM Studio with LLaMA 3.1 8B (summarization)
- Resend (email delivery)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **LM Studio** - Download from [lmstudio.ai](https://lmstudio.ai/)
- **ffmpeg** - Required for Whisper audio processing

### Install ffmpeg

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH.

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/dixitbharat/aspire-assignment.git
cd aspire-assignment
```

### 2. Setup Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# backend/.env
RESEND_API_KEY=re_your_resend_api_key_here
```

Get your Resend API key from [resend.com/api-keys](https://resend.com/api-keys)

### 4. Setup LM Studio

1. Download and install [LM Studio](https://lmstudio.ai/)
2. Download the **Meta LLaMA 3.1 8B Instruct** model
3. Start the local server in LM Studio (default: `http://localhost:1234`)

### 5. Setup Frontend

```bash
# Navigate to project root
cd ..

# Install dependencies
npm install
```

### 6. Configure Frontend Environment (Optional)

Create a `.env` file in the project root if you need to customize the API URL:

```bash
# .env
VITE_API_URL=http://localhost:8000
```

## Running the Application

### 1. Start LM Studio Server

1. Open LM Studio
2. Load the LLaMA 3.1 8B Instruct model
3. Click "Start Server" (runs on port 1234 by default)

### 2. Start Backend Server

```bash
cd backend
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
python main.py
```

The backend will start on `http://localhost:8000`

> **Note:** First startup may take a few minutes as Whisper downloads the model.

### 3. Start Frontend Development Server

```bash
# In a new terminal, from project root
npm run dev
```

The frontend will start on `http://localhost:5173`

## Usage

1. **Record Voice** - Click the microphone button to record your voice message, or upload an audio file
2. **Review Transcription** - The audio is automatically transcribed. Edit if needed.
3. **Generate Summary** - AI generates 5 bullet points and a suggested next step
4. **Edit Summary** - Customize the bullet points and next step as needed
5. **Send Email** - Enter recipient email and send instantly or schedule for later

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/health` | API health status |
| POST | `/transcribe` | Transcribe audio file to text |
| POST | `/summarize` | Generate summary from transcription |
| POST | `/send-email` | Send email with summary |

## Project Structure

```
aspire-assignment/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables
├── src/
│   ├── components/
│   │   ├── VoiceRecorder.tsx
│   │   ├── TranscriptionDisplay.tsx
│   │   ├── SummaryEditor.tsx
│   │   ├── EmailComposer.tsx
│   │   └── StepIndicator.tsx
│   ├── hooks/
│   │   └── useVoiceRecorder.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── README.md
```

## Troubleshooting

### "Cannot connect to LM Studio"
- Ensure LM Studio is running with the server started
- Check that the model is loaded (LLaMA 3.1 8B Instruct)
- Verify the server is running on `http://localhost:1234`

### "Transcription failed"
- Ensure ffmpeg is installed and in PATH
- Check that the audio file format is supported (wav, mp3, m4a, webm, ogg, flac, aac)
- First transcription may be slow as Whisper downloads the model

### "Email service not configured"
- Add your Resend API key to `backend/.env`
- With free Resend account, you can only send to your verified email

### Network Error (when using ngrok)
- The backend must be accessible from where the frontend is accessed
- For local testing via ngrok, access from the same machine running the backend

## Demo Mode

If you don't have a microphone or want to quickly test the app:
1. Click "Try Demo" on the recording step
2. This uses a pre-defined transcription to demonstrate the full workflow

## License

MIT License

## Author

Built for the Aspire AI Engineer Assessment
