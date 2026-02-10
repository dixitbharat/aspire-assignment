import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Pause, Play, Square, RotateCcw, Zap, Upload, FileAudio, X } from 'lucide-react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import type { RecordingMode } from '../types';
import './VoiceRecorder.css';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onDemoMode?: () => void;
  disabled?: boolean;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function VoiceRecorder({ onRecordingComplete, onDemoMode, disabled }: VoiceRecorderProps) {
  const {
    mode,
    audioBlob,
    audioUrl,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    error,
  } = useVoiceRecorder();

  const hasNotifiedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (audioBlob && mode === 'stopped' && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      onRecordingComplete(audioBlob);
    }
  }, [audioBlob, mode, onRecordingComplete]);

  useEffect(() => {
    if (mode === 'idle') {
      hasNotifiedRef.current = false;
    }
  }, [mode]);

  // Cleanup uploaded audio URL on unmount
  useEffect(() => {
    return () => {
      if (uploadedAudioUrl) {
        URL.revokeObjectURL(uploadedAudioUrl);
      }
    };
  }, [uploadedAudioUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/m4a', 'audio/x-m4a', 'audio/mp4'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|webm|ogg|m4a)$/i)) {
      setUploadError('Please upload a valid audio file (MP3, WAV, WebM, OGG, or M4A)');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File size must be less than 50MB');
      return;
    }

    setUploadError(null);
    setUploadedFile(file);
    
    // Create preview URL
    if (uploadedAudioUrl) {
      URL.revokeObjectURL(uploadedAudioUrl);
    }
    setUploadedAudioUrl(URL.createObjectURL(file));
  };

  const handleUploadConfirm = () => {
    if (uploadedFile) {
      onRecordingComplete(uploadedFile);
    }
  };

  const handleUploadCancel = () => {
    setUploadedFile(null);
    if (uploadedAudioUrl) {
      URL.revokeObjectURL(uploadedAudioUrl);
      setUploadedAudioUrl(null);
    }
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getModeLabel = (currentMode: RecordingMode): string => {
    switch (currentMode) {
      case 'idle':
        return 'Ready to record';
      case 'recording':
        return 'Recording...';
      case 'paused':
        return 'Paused';
      case 'stopped':
        return 'Recording complete';
      default:
        return '';
    }
  };

  // If a file is uploaded, show the upload preview
  if (uploadedFile && uploadedAudioUrl) {
    return (
      <div className="voice-recorder uploaded">
        <div className="recorder-visual">
          <div className="waveform-container">
            <div className="uploaded-file-preview">
              <FileAudio className="file-icon" />
              <div className="file-info">
                <span className="file-name">{uploadedFile.name}</span>
                <span className="file-size">{formatFileSize(uploadedFile.size)}</span>
              </div>
            </div>
          </div>

          <div className="audio-preview uploaded-audio">
            <audio controls src={uploadedAudioUrl} />
          </div>
        </div>

        <div className="recorder-controls">
          <button
            className="control-btn secondary"
            onClick={handleUploadCancel}
            aria-label="Cancel upload"
          >
            <X />
            <span>Cancel</span>
          </button>
          <button
            className="control-btn primary"
            onClick={handleUploadConfirm}
            disabled={disabled}
            aria-label="Use this audio"
          >
            <Play />
            <span>Use This Audio</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`voice-recorder ${mode}`}>
      <div className="recorder-visual">
        <div className="waveform-container">
          {mode === 'recording' && (
            <div className="waveform">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="waveform-bar"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}
          {mode === 'idle' && (
            <div className="idle-visual">
              <Mic className="mic-icon" />
            </div>
          )}
          {mode === 'paused' && (
            <div className="paused-visual">
              <MicOff className="mic-icon" />
            </div>
          )}
          {mode === 'stopped' && audioUrl && (
            <div className="audio-preview">
              <audio controls src={audioUrl} />
            </div>
          )}
        </div>

        <div className="recorder-info">
          <span className="duration">{formatDuration(duration)}</span>
          <span className="mode-label">{getModeLabel(mode)}</span>
        </div>
      </div>

      {error && <div className="recorder-error">{error}</div>}
      {uploadError && <div className="recorder-error">{uploadError}</div>}

      <div className="recorder-controls">
        {mode === 'idle' && (
          <button
            className="control-btn primary"
            onClick={startRecording}
            disabled={disabled}
            aria-label="Start recording"
          >
            <Mic />
            <span>Start Recording</span>
          </button>
        )}

        {mode === 'recording' && (
          <>
            <button
              className="control-btn secondary"
              onClick={pauseRecording}
              aria-label="Pause recording"
            >
              <Pause />
            </button>
            <button
              className="control-btn danger"
              onClick={stopRecording}
              aria-label="Stop recording"
            >
              <Square />
              <span>Stop</span>
            </button>
          </>
        )}

        {mode === 'paused' && (
          <>
            <button
              className="control-btn secondary"
              onClick={resumeRecording}
              aria-label="Resume recording"
            >
              <Play />
            </button>
            <button
              className="control-btn danger"
              onClick={stopRecording}
              aria-label="Stop recording"
            >
              <Square />
              <span>Stop</span>
            </button>
          </>
        )}

        {mode === 'stopped' && (
          <button
            className="control-btn secondary"
            onClick={resetRecording}
            aria-label="Record again"
          >
            <RotateCcw />
            <span>Record Again</span>
          </button>
        )}
      </div>

      {/* Upload Audio Section */}
      {mode === 'idle' && (
        <div className="upload-section">
          <div className="section-divider">
            <span>or</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.webm,.ogg,.m4a"
            onChange={handleFileSelect}
            className="file-input-hidden"
            disabled={disabled}
          />
          <button
            className="control-btn upload"
            onClick={triggerFileInput}
            disabled={disabled}
            aria-label="Upload audio file"
          >
            <Upload />
            <span>Upload Audio File</span>
          </button>
          <p className="upload-hint">Supports MP3, WAV, WebM, OGG, M4A (max 50MB)</p>
        </div>
      )}

      {mode === 'idle' && onDemoMode && (
        <div className="demo-mode-section">
          <p className="demo-hint">No microphone? Try demo mode:</p>
          <button
            className="control-btn demo"
            onClick={onDemoMode}
            disabled={disabled}
          >
            <Zap />
            <span>Try Demo</span>
          </button>
        </div>
      )}
    </div>
  );
}

