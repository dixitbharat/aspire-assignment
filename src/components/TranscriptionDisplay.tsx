import { useState, useEffect } from 'react';
import { FileText, Loader2, RefreshCw, Check } from 'lucide-react';
import './TranscriptionDisplay.css';

interface TranscriptionDisplayProps {
  transcription: string;
  isProcessing: boolean;
  onTranscriptionChange: (text: string) => void;
  onProceed: () => void;
}

export function TranscriptionDisplay({
  transcription,
  isProcessing,
  onTranscriptionChange,
  onProceed,
}: TranscriptionDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(transcription);

  useEffect(() => {
    setEditedText(transcription);
  }, [transcription]);

  const handleSave = () => {
    onTranscriptionChange(editedText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(transcription);
    setIsEditing(false);
  };

  return (
    <div className="transcription-display">
      <div className="transcription-header">
        <div className="header-left">
          <FileText className="header-icon" />
          <h3>Transcription</h3>
        </div>
        {!isProcessing && transcription && !isEditing && (
          <button
            className="edit-btn"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        )}
      </div>

      <div className="transcription-content">
        {isProcessing ? (
          <div className="processing-state">
            <Loader2 className="spinner" />
            <span>Transcribing your audio...</span>
            <div className="processing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        ) : transcription ? (
          isEditing ? (
            <div className="edit-mode">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                placeholder="Edit transcription..."
                rows={6}
              />
              <div className="edit-actions">
                <button className="cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
                <button className="save-btn" onClick={handleSave}>
                  <Check size={16} />
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="transcription-text">
              <p>{transcription}</p>
            </div>
          )
        ) : (
          <div className="empty-state">
            <RefreshCw className="empty-icon" />
            <span>No transcription yet</span>
          </div>
        )}
      </div>

      {!isProcessing && transcription && !isEditing && (
        <div className="transcription-actions">
          <button className="proceed-btn" onClick={onProceed}>
            Generate Summary
            <span className="arrow">→</span>
          </button>
        </div>
      )}
    </div>
  );
}

