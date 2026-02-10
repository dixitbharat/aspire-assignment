export type RecordingMode = 'idle' | 'recording' | 'paused' | 'stopped';

export type WorkflowStep = 'record' | 'transcribe' | 'summarize' | 'email';

export interface BulletPoint {
  id: string;
  text: string;
}

export interface Summary {
  bullets: BulletPoint[];
  nextStep: string;
}

export interface EmailConfig {
  to: string;
  subject: string;
  isScheduled: boolean;
  scheduledTime?: Date;
}

export interface AppState {
  currentStep: WorkflowStep;
  audioBlob: Blob | null;
  transcription: string;
  summary: Summary;
  emailConfig: EmailConfig;
  isProcessing: boolean;
}

