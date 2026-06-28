import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, MessageSquare, Check, X, Edit3, 
  ArrowRight, Inbox, Clock, AlertCircle 
} from 'lucide-react';
import { useNudge } from '../../contexts/NudgeContext';
import { useAuth } from '../../contexts/AuthContext';
import { demoTriageItems } from '../../utils/demoData';
import { formatRelative, formatDate } from '../../utils/helpers';

const sourceIcons = {
  gmail: Mail,
  whatsapp: MessageSquare,
};

const sourceColors = {
  gmail: 'var(--color-accent-coral)',
  whatsapp: 'var(--color-accent-teal)',
};

export default function TriagePanel() {
  const { triageItems, acceptTriageItem, dismissTriageItem } = useNudge();
  const { isDemoMode } = useAuth();
  
  const items = isDemoMode && triageItems.length === 0 ? demoTriageItems : triageItems;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 700, 
          fontFamily: 'var(--font-heading)',
          marginBottom: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <Inbox size={24} style={{ color: 'var(--color-accent-amber)' }} />
          Smart Triage
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          I found these in your emails and messages — want to add any? 🔍
        </p>
      </div>

      {items.length === 0 ? (
        <motion.div
          className="card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ 
            textAlign: 'center', 
            padding: '3rem 2rem',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🧹</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            All clear!
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Nothing new to review right now. I'll let you know when something comes up.
          </div>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <AnimatePresence>
            {items.map((item, idx) => {
              const SourceIcon = sourceIcons[item.source] || AlertCircle;
              const sourceColor = sourceColors[item.source] || 'var(--color-text-secondary)';

              return (
                <motion.div
                  key={item.id}
                  className="triage-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  layout
                  id={`triage-${item.id}`}
                >
                  {/* Source icon */}
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-md)',
                    background: `${sourceColor}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <SourceIcon size={18} style={{ color: sourceColor }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '0.9375rem', 
                      fontWeight: 600,
                      marginBottom: '0.25rem',
                    }}>
                      {item.title}
                    </div>
                    <div style={{ 
                      fontSize: '0.8125rem', 
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '0.5rem',
                    }}>
                      {item.description}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span className={`badge ${item.source === 'gmail' ? 'badge-coral' : 'badge-teal'}`}>
                        {item.source === 'gmail' ? '📧 Email' : '💬 WhatsApp'}
                      </span>
                      {item.sender && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                          from {item.sender}
                        </span>
                      )}
                      {item.suggested_time && (
                        <span style={{ 
                          fontSize: '0.6875rem', 
                          color: 'var(--color-text-tertiary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}>
                          <Clock size={10} />
                          Suggested: {formatDate(item.suggested_time)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="triage-actions">
                      <motion.button
                        className="btn btn-primary btn-sm"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => acceptTriageItem(item.id, item)}
                        id={`btn-accept-${item.id}`}
                      >
                        <Check size={14} />
                        Add to plan
                      </motion.button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        id={`btn-edit-${item.id}`}
                      >
                        <Edit3 size={14} />
                        Edit first
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={() => dismissTriageItem(item.id)}
                        id={`btn-dismiss-${item.id}`}
                      >
                        <X size={14} />
                        Dismiss
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
