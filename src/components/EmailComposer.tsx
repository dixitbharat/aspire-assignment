import { useState } from 'react';
import { Mail, Send, Clock, Calendar, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { Summary, EmailConfig } from '../types';
import './EmailComposer.css';

interface EmailComposerProps {
  summary: Summary;
  emailConfig: EmailConfig;
  onEmailConfigChange: (config: EmailConfig) => void;
  onSend: () => void;
  isSending: boolean;
}

export function EmailComposer({
  summary,
  emailConfig,
  onEmailConfigChange,
  onSend,
  isSending,
}: EmailComposerProps) {
  const [sendMode, setSendMode] = useState<'instant' | 'scheduled'>('instant');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSendModeChange = (mode: 'instant' | 'scheduled') => {
    setSendMode(mode);
    onEmailConfigChange({
      ...emailConfig,
      isScheduled: mode === 'scheduled',
      scheduledTime: mode === 'scheduled' ? new Date(Date.now() + 3600000) : undefined,
    });
  };

  const handleScheduledTimeChange = (dateStr: string) => {
    onEmailConfigChange({
      ...emailConfig,
      scheduledTime: new Date(dateStr),
    });
  };

  const handleSend = () => {
    onSend();
    // Simulate success for demo
    setTimeout(() => {
      setShowSuccess(true);
    }, 2000);
  };

  const isValid = emailConfig.to.trim().length > 0 &&
                  emailConfig.to.includes('@') &&
                  emailConfig.subject.trim().length > 0;

  const formatScheduledTime = () => {
    if (!emailConfig.scheduledTime) return '';
    return format(emailConfig.scheduledTime, "yyyy-MM-dd'T'HH:mm");
  };

  const generateEmailPreview = () => {
    return `
Summary:
${summary.bullets.map((b) => `• ${b.text}`).join('\n')}

Next Step:
${summary.nextStep}
    `.trim();
  };

  if (showSuccess) {
    return (
      <div className="email-composer success-state">
        <div className="success-content">
          <div className="success-icon">
            <Check size={48} />
          </div>
          <h3>Email {sendMode === 'scheduled' ? 'Scheduled' : 'Sent'} Successfully!</h3>
          <p>
            {sendMode === 'scheduled' 
              ? `Your email will be sent on ${emailConfig.scheduledTime ? format(emailConfig.scheduledTime, 'PPpp') : ''}`
              : `Your email has been sent to ${emailConfig.to}`
            }
          </p>
          <button className="new-recording-btn" onClick={() => window.location.reload()}>
            Start New Recording
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="email-composer">
      <div className="email-header">
        <div className="header-left">
          <Mail className="header-icon" />
          <h3>Compose Email</h3>
        </div>
      </div>

      <div className="email-content">
        <div className="send-mode-selector">
          <button
            className={`mode-btn ${sendMode === 'instant' ? 'active' : ''}`}
            onClick={() => handleSendModeChange('instant')}
          >
            <Send size={18} />
            Send Instantly
          </button>
          <button
            className={`mode-btn ${sendMode === 'scheduled' ? 'active' : ''}`}
            onClick={() => handleSendModeChange('scheduled')}
          >
            <Clock size={18} />
            Schedule
          </button>
        </div>

        {sendMode === 'scheduled' && (
          <div className="schedule-picker">
            <Calendar className="calendar-icon" />
            <input
              type="datetime-local"
              value={formatScheduledTime()}
              onChange={(e) => handleScheduledTimeChange(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              className="datetime-input"
            />
          </div>
        )}

        <div className="form-group">
          <label>Recipient Email</label>
          <input
            type="email"
            value={emailConfig.to}
            onChange={(e) => onEmailConfigChange({ ...emailConfig, to: e.target.value })}
            placeholder="recipient@example.com"
            className="email-input"
          />
        </div>

        <div className="form-group">
          <label>Subject</label>
          <input
            type="text"
            value={emailConfig.subject}
            onChange={(e) => onEmailConfigChange({ ...emailConfig, subject: e.target.value })}
            placeholder="Voice Note Summary"
            className="email-input"
          />
        </div>

        <div className="form-group">
          <label>Email Preview</label>
          <div className="email-preview">
            <div className="preview-header">
              <span className="preview-label">To:</span>
              <span>{emailConfig.to || 'recipient@example.com'}</span>
            </div>
            <div className="preview-header">
              <span className="preview-label">Subject:</span>
              <span>{emailConfig.subject || 'Voice Note Summary'}</span>
            </div>
            <div className="preview-body">
              <pre>{generateEmailPreview()}</pre>
            </div>
          </div>
        </div>

        {!isValid && (
          <div className="validation-warning">
            <AlertCircle size={16} />
            <span>Please fill in all required fields with valid information</span>
          </div>
        )}
      </div>

      <div className="email-actions">
        <button
          className={`send-btn ${sendMode}`}
          onClick={handleSend}
          disabled={!isValid || isSending}
        >
          {isSending ? (
            <>
              <span className="sending-spinner"></span>
              {sendMode === 'scheduled' ? 'Scheduling...' : 'Sending...'}
            </>
          ) : (
            <>
              {sendMode === 'scheduled' ? <Clock size={20} /> : <Send size={20} />}
              {sendMode === 'scheduled' ? 'Schedule Email' : 'Send Email'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

