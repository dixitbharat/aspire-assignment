import { useState, useCallback } from 'react';
import { Mic } from 'lucide-react';
import { VoiceRecorder } from './components/VoiceRecorder';
import { TranscriptionDisplay } from './components/TranscriptionDisplay';
import { SummaryEditor } from './components/SummaryEditor';
import { EmailComposer } from './components/EmailComposer';
import { StepIndicator } from './components/StepIndicator';
import type { WorkflowStep, Summary, EmailConfig } from './types';
import './App.css';

// API base URL for the FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Transcribe audio using the FastAPI backend with Whisper
const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const formData = new FormData();
  
  // Determine the file extension based on the blob type
  let extension = '.webm';
  if (audioBlob.type.includes('wav')) extension = '.wav';
  else if (audioBlob.type.includes('mp3') || audioBlob.type.includes('mpeg')) extension = '.mp3';
  else if (audioBlob.type.includes('ogg')) extension = '.ogg';
  else if (audioBlob.type.includes('m4a') || audioBlob.type.includes('mp4')) extension = '.m4a';
  
  formData.append('file', audioBlob, `recording${extension}`);
  
  const response = await fetch(`${API_BASE_URL}/transcribe`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Transcription failed' }));
    throw new Error(error.detail || 'Transcription failed');
  }
  
  const data = await response.json();
  return data.transcription;
};

// Simulated transcription for demo mode (when no actual audio is recorded)
const simulateTranscription = (): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        "Hi team, I wanted to give you a quick update on the project. We've completed the initial design phase and the client has approved the mockups. The development team will start working on the frontend next week. We need to schedule a meeting with the stakeholders to discuss the timeline and budget adjustments. Also, don't forget that we have a deadline for the MVP by the end of next month. Let me know if you have any questions or concerns."
      );
    }, 2000);
  });
};

// Simulated summary generation for demo purposes
const simulateSummaryGeneration = (_transcription: string): Promise<Summary> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        bullets: [
          { id: crypto.randomUUID(), text: 'Initial design phase completed with client approval on mockups' },
          { id: crypto.randomUUID(), text: 'Frontend development scheduled to begin next week' },
          { id: crypto.randomUUID(), text: 'Stakeholder meeting needed for timeline and budget discussion' },
          { id: crypto.randomUUID(), text: 'MVP deadline set for end of next month' },
        ],
        nextStep: 'Schedule a meeting with stakeholders to align on timeline and budget before development begins.',
      });
    }, 1500);
  });
};

function App() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('record');
  const [completedSteps, setCompletedSteps] = useState<WorkflowStep[]>([]);
  const [_audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState<Summary>({
    bullets: [],
    nextStep: '',
  });
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    to: '',
    subject: 'Voice Note Summary',
    isScheduled: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  const handleRecordingComplete = useCallback(async (blob: Blob) => {
    setAudioBlob(blob);
    setCompletedSteps((prev) => [...prev, 'record']);
    setCurrentStep('transcribe');
    setIsProcessing(true);
    setTranscriptionError(null);

    try {
      // Call the FastAPI backend for transcription using Whisper
      const result = await transcribeAudio(blob);
      setTranscription(result);
    } catch (error) {
      console.error('Transcription failed:', error);
      setTranscriptionError(error instanceof Error ? error.message : 'Transcription failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDemoMode = useCallback(async () => {
    // Create a dummy blob for demo purposes
    const dummyBlob = new Blob(['demo audio'], { type: 'audio/webm' });
    setAudioBlob(dummyBlob);
    setCompletedSteps((prev) => [...prev, 'record']);
    setCurrentStep('transcribe');
    setIsProcessing(true);

    try {
      const result = await simulateTranscription();
      setTranscription(result);
    } catch (error) {
      console.error('Transcription failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleTranscriptionChange = useCallback((text: string) => {
    setTranscription(text);
  }, []);

  const handleProceedToSummary = useCallback(async () => {
    setCompletedSteps((prev) => [...prev, 'transcribe']);
    setCurrentStep('summarize');
    setIsProcessing(true);

    try {
      // In production, this would call an actual AI summarization API
      const result = await simulateSummaryGeneration(transcription);
      setSummary(result);
    } catch (error) {
      console.error('Summary generation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [transcription]);

  const handleSummaryChange = useCallback((newSummary: Summary) => {
    setSummary(newSummary);
  }, []);

  const handleProceedToEmail = useCallback(() => {
    setCompletedSteps((prev) => [...prev, 'summarize']);
    setCurrentStep('email');
  }, []);

  const handleEmailConfigChange = useCallback((config: EmailConfig) => {
    setEmailConfig(config);
  }, []);

  const handleSendEmail = useCallback(async () => {
    setIsSending(true);
    
    // In production, this would call an actual email API
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setIsSending(false);
    setCompletedSteps((prev) => [...prev, 'email']);
  }, []);

  const renderStepContent = () => {
    switch (currentStep) {
      case 'record':
        return (
          <div className="step-content">
            <h2 className="step-title">
              <span className="step-number">1</span>
              Record Your Voice
            </h2>
            <p className="step-description">
              Click the button below to start recording your voice message. 
              You can pause and resume as needed.
            </p>
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              onDemoMode={handleDemoMode}
              disabled={isProcessing}
            />
          </div>
        );

      case 'transcribe':
        return (
          <div className="step-content">
            <h2 className="step-title">
              <span className="step-number">2</span>
              Review Transcription
            </h2>
            <p className="step-description">
              Your audio is being transcribed. Review and edit the text if needed.
            </p>
            {transcriptionError && (
              <div className="error-message">
                <p>{transcriptionError}</p>
                <button 
                  className="retry-btn"
                  onClick={() => {
                    setCurrentStep('record');
                    setCompletedSteps((prev) => prev.filter(s => s !== 'record'));
                  }}
                >
                  Try Again
                </button>
              </div>
            )}
            <TranscriptionDisplay
              transcription={transcription}
              isProcessing={isProcessing}
              onTranscriptionChange={handleTranscriptionChange}
              onProceed={handleProceedToSummary}
            />
          </div>
        );

      case 'summarize':
        return (
          <div className="step-content">
            <h2 className="step-title">
              <span className="step-number">3</span>
              Edit Summary
            </h2>
            <p className="step-description">
              Review and customize the AI-generated summary with 3-5 bullet points.
            </p>
            <SummaryEditor
              summary={summary}
              isProcessing={isProcessing}
              onSummaryChange={handleSummaryChange}
              onProceed={handleProceedToEmail}
            />
          </div>
        );

      case 'email':
        return (
          <div className="step-content">
            <h2 className="step-title">
              <span className="step-number">4</span>
              Send Email
            </h2>
            <p className="step-description">
              Configure and send your summary email instantly or schedule it for later.
            </p>
            <EmailComposer
              summary={summary}
              emailConfig={emailConfig}
              onEmailConfigChange={handleEmailConfigChange}
              onSend={handleSendEmail}
              isSending={isSending}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <div className="logo">
            <div className="logo-icon">
              <Mic size={28} />
            </div>
            <h1 className="app-title">VoiceMail AI</h1>
          </div>
          <p className="app-subtitle">
            Record, transcribe, summarize, and email in seconds
          </p>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <div className="workflow-container">
            <StepIndicator
              currentStep={currentStep}
              completedSteps={completedSteps}
            />
            {renderStepContent()}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p className="footer-text">
            Built with ❤️ for the Aspire Assessment
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
