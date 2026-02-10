import { useState, useEffect } from 'react';
import { ListChecks, Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import type { Summary, BulletPoint } from '../types';
import './SummaryEditor.css';

interface SummaryEditorProps {
  summary: Summary;
  isProcessing: boolean;
  onSummaryChange: (summary: Summary) => void;
  onProceed: () => void;
}

export function SummaryEditor({
  summary,
  isProcessing,
  onSummaryChange,
  onProceed,
}: SummaryEditorProps) {
  const [bullets, setBullets] = useState<BulletPoint[]>(summary.bullets);
  const [nextStep, setNextStep] = useState(summary.nextStep);

  useEffect(() => {
    setBullets(summary.bullets);
    setNextStep(summary.nextStep);
  }, [summary]);

  const updateBullet = (id: string, text: string) => {
    const updated = bullets.map((b) => (b.id === id ? { ...b, text } : b));
    setBullets(updated);
    onSummaryChange({ bullets: updated, nextStep });
  };

  const addBullet = () => {
    if (bullets.length >= 5) return;
    const newBullet: BulletPoint = {
      id: crypto.randomUUID(),
      text: '',
    };
    const updated = [...bullets, newBullet];
    setBullets(updated);
    onSummaryChange({ bullets: updated, nextStep });
  };

  const removeBullet = (id: string) => {
    if (bullets.length <= 3) return;
    const updated = bullets.filter((b) => b.id !== id);
    setBullets(updated);
    onSummaryChange({ bullets: updated, nextStep });
  };

  const handleNextStepChange = (text: string) => {
    setNextStep(text);
    onSummaryChange({ bullets, nextStep: text });
  };

  const isValid = bullets.length >= 3 && 
                  bullets.length <= 5 && 
                  bullets.every((b) => b.text.trim().length > 0) &&
                  nextStep.trim().length > 0;

  return (
    <div className="summary-editor">
      <div className="summary-header">
        <div className="header-left">
          <ListChecks className="header-icon" />
          <h3>Summary</h3>
        </div>
        <span className="bullet-count">
          {bullets.length}/5 bullet points
        </span>
      </div>

      <div className="summary-content">
        {isProcessing ? (
          <div className="processing-state">
            <Loader2 className="spinner" />
            <span>Generating summary...</span>
            <div className="processing-bar">
              <div className="processing-bar-fill"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="bullets-section">
              <label className="section-label">Key Points (3-5 bullets)</label>
              <div className="bullets-list">
                {bullets.map((bullet, index) => (
                  <div key={bullet.id} className="bullet-item">
                    <GripVertical className="drag-handle" />
                    <span className="bullet-number">{index + 1}</span>
                    <input
                      type="text"
                      value={bullet.text}
                      onChange={(e) => updateBullet(bullet.id, e.target.value)}
                      placeholder={`Bullet point ${index + 1}...`}
                      className="bullet-input"
                    />
                    <button
                      className="remove-btn"
                      onClick={() => removeBullet(bullet.id)}
                      disabled={bullets.length <= 3}
                      aria-label="Remove bullet"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              {bullets.length < 5 && (
                <button className="add-bullet-btn" onClick={addBullet}>
                  <Plus size={18} />
                  Add Bullet Point
                </button>
              )}
            </div>

            <div className="next-step-section">
              <label className="section-label">Next Step</label>
              <textarea
                value={nextStep}
                onChange={(e) => handleNextStepChange(e.target.value)}
                placeholder="What's the recommended next step?"
                rows={3}
                className="next-step-input"
              />
            </div>
          </>
        )}
      </div>

      {!isProcessing && (
        <div className="summary-actions">
          <button
            className="proceed-btn"
            onClick={onProceed}
            disabled={!isValid}
          >
            Compose Email
            <span className="arrow">→</span>
          </button>
        </div>
      )}
    </div>
  );
}

