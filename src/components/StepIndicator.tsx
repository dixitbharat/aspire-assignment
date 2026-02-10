import { Mic, FileText, ListChecks, Mail, Check } from 'lucide-react';
import type { WorkflowStep } from '../types';
import './StepIndicator.css';

interface StepIndicatorProps {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
}

const steps: { id: WorkflowStep; label: string; icon: React.ReactNode }[] = [
  { id: 'record', label: 'Record', icon: <Mic size={20} /> },
  { id: 'transcribe', label: 'Transcribe', icon: <FileText size={20} /> },
  { id: 'summarize', label: 'Summarize', icon: <ListChecks size={20} /> },
  { id: 'email', label: 'Email', icon: <Mail size={20} /> },
];

export function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  const getStepStatus = (stepId: WorkflowStep) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className="step-indicator">
      {steps.map((step, index) => {
        const status = getStepStatus(step.id);
        return (
          <div key={step.id} className="step-wrapper">
            <div className={`step ${status}`}>
              <div className="step-icon">
                {status === 'completed' ? <Check size={20} /> : step.icon}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`step-connector ${completedSteps.includes(step.id) ? 'completed' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

