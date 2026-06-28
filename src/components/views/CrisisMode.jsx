import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Clock, CheckCircle, ArrowRight, 
  ChevronRight, Zap, Timer, Coffee
} from 'lucide-react';
import { useNudge } from '../../contexts/NudgeContext';

const crisisSteps = [
  {
    id: 1,
    title: 'Take a breath',
    description: 'You\'ve got this. Let\'s break this into small, doable steps.',
    icon: Coffee,
    duration: '30 seconds',
  },
  {
    id: 2,
    title: 'Identify the key deliverable',
    description: 'What\'s the ONE thing that absolutely must be done? Focus only on that.',
    icon: Zap,
    duration: '2 minutes',
  },
  {
    id: 3,
    title: 'Gather your materials',
    description: 'Open the files, tabs, and tools you need. Close everything else.',
    icon: Timer,
    duration: '3 minutes',
  },
  {
    id: 4,
    title: 'Execute — no editing',
    description: 'Write the first draft / complete the core task. Don\'t polish yet.',
    icon: ArrowRight,
    duration: '45-60 minutes',
  },
  {
    id: 5,
    title: 'Quick review & submit',
    description: 'One quick pass for obvious errors, then submit. Done is better than perfect.',
    icon: CheckCircle,
    duration: '15 minutes',
  },
];

export default function CrisisMode() {
  const { tasks, completeTask } = useNudge();
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Find the most urgent task
  const urgentTask = tasks.find(t => t.priority === 'high' && t.status !== 'done') || tasks.find(t => t.status !== 'done');

  if (!isActive) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '3rem' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(232, 115, 90, 0.2), rgba(245, 166, 35, 0.2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <AlertTriangle size={36} style={{ color: 'var(--color-accent-coral)' }} />
          </div>

          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: 800, 
            fontFamily: 'var(--font-heading)',
            marginBottom: '0.75rem',
            background: 'linear-gradient(135deg, var(--color-accent-coral), var(--color-accent-amber))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Crisis Mode
          </h2>

          <p style={{ 
            fontSize: '1rem', 
            color: 'var(--color-text-secondary)',
            marginBottom: '2rem',
            lineHeight: 1.6,
          }}>
            Something's due soon and you're feeling the heat? <br />
            I'll guide you through it step by step. No panic, just progress.
          </p>

          {urgentTask && (
            <div className="card" style={{ 
              textAlign: 'left', 
              marginBottom: '2rem',
              borderColor: 'rgba(232, 115, 90, 0.2)',
              background: 'rgba(232, 115, 90, 0.05)',
            }}>
              <div style={{ 
                fontSize: '0.6875rem', 
                fontWeight: 600, 
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-accent-coral)',
                marginBottom: '0.5rem',
              }}>
                ⚡ Most urgent right now
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                {urgentTask.title}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                {urgentTask.description}
              </div>
            </div>
          )}

          <motion.button
            className="btn btn-primary btn-lg"
            onClick={() => setIsActive(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            id="btn-start-crisis"
            style={{ fontSize: '1rem', padding: '1rem 2.5rem' }}
          >
            <Zap size={18} />
            Start Guided Flow
            <ArrowRight size={18} />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ 
      maxWidth: '600px', 
      margin: '0 auto',
      paddingTop: '2rem',
    }}>
      {/* Progress bar */}
      <div style={{
        display: 'flex',
        gap: '0.375rem',
        marginBottom: '2rem',
      }}>
        {crisisSteps.map((_, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background: idx <= currentStep 
                ? 'linear-gradient(90deg, var(--color-accent-coral), var(--color-accent-amber))'
                : 'var(--color-bg-tertiary)',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Current step */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          {crisisSteps[currentStep] && (() => {
            const step = crisisSteps[currentStep];
            const StepIcon = step.icon;
            return (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '1rem',
                }}>
                  Step {step.id} of {crisisSteps.length}
                </div>

                <motion.div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 'var(--radius-xl)',
                    background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.2), rgba(232, 115, 90, 0.2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                  }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <StepIcon size={28} style={{ color: 'var(--color-accent-amber)' }} />
                </motion.div>

                <h3 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 700, 
                  fontFamily: 'var(--font-heading)',
                  marginBottom: '0.75rem',
                }}>
                  {step.title}
                </h3>

                <p style={{ 
                  fontSize: '1.0625rem', 
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: '0.75rem',
                  maxWidth: '450px',
                  margin: '0 auto 0.75rem',
                }}>
                  {step.description}
                </p>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  background: 'var(--color-bg-tertiary)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '2.5rem',
                }}>
                  <Clock size={12} />
                  {step.duration}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  {currentStep > 0 && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      id="btn-crisis-back"
                    >
                      Back
                    </button>
                  )}
                  
                  {currentStep < crisisSteps.length - 1 ? (
                    <motion.button
                      className="btn btn-primary btn-lg"
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      id="btn-crisis-next"
                    >
                      Got it, next step
                      <ChevronRight size={18} />
                    </motion.button>
                  ) : (
                    <motion.button
                      className="btn btn-primary btn-lg"
                      onClick={() => {
                        if (urgentTask && urgentTask.id) {
                          completeTask(urgentTask.id);
                        }
                        setIsActive(false);
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      id="btn-crisis-done"
                      style={{
                        background: 'linear-gradient(135deg, var(--color-accent-teal), var(--color-success))',
                      }}
                    >
                      <CheckCircle size={18} />
                      Done & Mark Complete 🎉
                    </motion.button>
                  )}
                </div>
              </div>
            );
          })()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
