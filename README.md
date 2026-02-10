# VoiceMail AI

A voice agent application that captures spoken input, transcribes it using Groq Whisper API, summarizes it using Groq LLaMA 3.1, and emails the summary to the user.

![VoiceMail AI](https://img.shields.io/badge/Voice-Agent-blue) ![React](https://img.shields.io/badge/React-18-61DAFB) ![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688) ![Groq](https://img.shields.io/badge/Groq-API-orange)

## 🌐 Live Demo

- **Frontend**: [https://aspire-assignment-eta.vercel.app](https://aspire-assignment-eta.vercel.app)
- **Backend API**: [https://aspire-assignment-production.up.railway.app](https://aspire-assignment-production.up.railway.app)

## Features

- 🎤 **Voice Recording** - Record audio directly from the browser or upload audio files
- 📝 **Transcription** - Automatic speech-to-text using Groq Whisper API (cloud-based)
- 🤖 **AI Summarization** - Generate 5 bullet points + next step using Groq LLaMA 3.1 8B
- ✏️ **Editable Summary** - Review and customize the generated summary
- 📧 **Email Delivery** - Send summary via email instantly or schedule for later
- 🎨 **Modern UI** - Beautiful, responsive interface with dark theme

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Lucide React (icons)
- date-fns (date formatting)
- **Deployed on**: Vercel

### Backend
- FastAPI (Python)
- Groq Whisper API (speech-to-text)
- Groq LLaMA 3.1 8B (summarization)
- Resend (email delivery)
- **Deployed on**: Railway

## Cloud APIs Used

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **Groq** | Whisper transcription + LLaMA summarization | ✅ Free |
| **Resend** | Email delivery | ✅ Free (100 emails/day) |

## Local Development

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)

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
GROQ_API_KEY=gsk_your_groq_api_key_here
RESEND_API_KEY=re_your_resend_api_key_here
```

**Get your API keys:**
- Groq API Key: [console.groq.com](https://console.groq.com) (Free)
- Resend API Key: [resend.com/api-keys](https://resend.com/api-keys) (Free)

### 4. Setup Frontend

```bash
# Navigate to project root
cd ..

# Install dependencies
npm install
```

### 5. Configure Frontend Environment (Optional)

Create a `.env` file in the project root:

```bash
# .env
VITE_API_URL=http://localhost:8000
```

## Running Locally

### 1. Start Backend Server

```bash
cd backend
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
python main.py
```

The backend will start on `http://localhost:8000`

### 2. Start Frontend Development Server

```bash
# In a new terminal, from project root
npm run dev
```

The frontend will start on `http://localhost:5173`

## Deployment

### Backend (Railway)

1. Create a [Railway](https://railway.app) account
2. Create new project → Deploy from GitHub
3. Set Root Directory to `backend`
4. Add environment variables:
   - `GROQ_API_KEY`
   - `RESEND_API_KEY`
5. Railway auto-deploys on push

### Frontend (Vercel)

1. Create a [Vercel](https://vercel.com) account
2. Import GitHub repository
3. Set Framework Preset to `Vite`
4. Add environment variable:
   - `VITE_API_URL=https://your-railway-backend.up.railway.app`
5. Deploy

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
| GET | `/health` | API health status with configuration info |
| POST | `/transcribe` | Transcribe audio file to text (Groq Whisper) |
| POST | `/summarize` | Generate summary from transcription (Groq LLaMA) |
| POST | `/send-email` | Send email with summary (Resend) |

## Project Structure

```
aspire-assignment/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Docker configuration for Railway
│   └── .env                 # Environment variables (local)
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
├── vercel.json              # Vercel configuration
└── README.md
```

## Troubleshooting

### "Groq API error"
- Verify your `GROQ_API_KEY` is correct
- Check Groq API status at [status.groq.com](https://status.groq.com)

### "Transcription failed"
- Ensure audio file format is supported (wav, mp3, m4a, webm, ogg, flac, aac)
- Check file size is under 25MB

### "Email service not configured"
- Add your Resend API key to environment variables
- With free Resend account, you can only send to your verified email

### "NetworkError when attempting to fetch resource"
- Check that the backend URL is correctly set in `VITE_API_URL`
- Verify the backend is running and accessible

## Demo Mode

If you don't have a microphone or want to quickly test the app:
1. Click "Try Demo" on the recording step
2. This uses a pre-defined transcription to demonstrate the full workflow

## Environment Variables Summary

### Backend (Railway)
```
GROQ_API_KEY=gsk_xxxxx
RESEND_API_KEY=re_xxxxx
```

### Frontend (Vercel)
```
VITE_API_URL=https://your-backend.up.railway.app
```

## License

MIT License

## Author

Built for the Aspire AI Engineer Assessment
