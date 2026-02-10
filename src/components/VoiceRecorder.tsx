import { useEffect, useRef } from 'react';
import { Mic, MicOff, Pause, Play, Square, RotateCcw, Zap } from 'lucide-react';
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

