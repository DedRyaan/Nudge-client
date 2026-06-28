import { motion } from 'framer-motion';
import { AlertTriangle, X, ArrowRight, Shuffle } from 'lucide-react';
import { formatTimeRange } from '../../utils/helpers';
import { useToast } from '../../contexts/ToastContext';

export default function ConflictCard({ conflict, onDismiss }) {
  const { showToast } = useToast();

  if (!conflict) return null;

  const { events, overlapMinutes, suggestions } = conflict;

  return (
    <motion.div
      className="conflict-banner"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: '1rem',
        position: 'relative',
      }}
      id="conflict-banner"
    >
      <button
        className="btn btn-ghost btn-icon"
        onClick={onDismiss}
        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}
        id="btn-dismiss-conflict"
      >
        <X size={16} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          background: 'rgba(232, 115, 90, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Shuffle size={18} style={{ color: 'var(--color-accent-coral)' }} />
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            Scheduling conflict detected
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            {overlapMinutes} minutes of overlap — here are some fixes
          </div>
        </div>
      </div>

      {/* Conflicting items */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem',
        padding: '0.75rem',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 'var(--radius-md)',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
            {events[0]?.title}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
            {formatTimeRange(events[0]?.start, events[0]?.end)}
          </div>
        </div>
        <AlertTriangle size={16} style={{ color: 'var(--color-accent-coral)' }} />
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
            {events[1]?.title}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
            {formatTimeRange(events[1]?.start, events[1]?.end)}
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {suggestions?.map((suggestion, idx) => (
          <motion.button
            key={idx}
            className={idx === 0 ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              showToast(suggestion.label, 'success');
              onDismiss();
            }}
            id={`btn-resolve-${idx}`}
          >
            {suggestion.label}
            {idx === 0 && <ArrowRight size={14} />}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
