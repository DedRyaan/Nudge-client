import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Calendar as CalendarIcon, MapPin, AlignLeft, CheckCircle2, User } from 'lucide-react';
import { useNudge } from '../../contexts/NudgeContext';

export default function AddTaskPopover({ isOpen, onClose, initialDate, position }) {
  const { addTask } = useNudge();
  const [activeTab, setActiveTab] = useState('event'); // 'event' or 'task'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [deadline, setDeadline] = useState('');
  const popoverRef = useRef(null);

  // Format YYYY-MM-DDThh:mm
  const formatForInput = (date) => {
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    if (isOpen && initialDate) {
      const formatted = formatForInput(initialDate);
      setScheduledTime(formatted);
      
      // Default end time to 1 hour later
      const endDate = new Date(new Date(initialDate).getTime() + 60 * 60 * 1000);
      setDeadline(formatForInput(endDate));
    }
  }, [isOpen, initialDate]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addTask({
      title: title.trim(),
      description: description.trim(),
      type: activeTab === 'task' ? 'work' : 'event',
      priority: 'medium',
      scheduled_time: scheduledTime ? new Date(scheduledTime).toISOString() : null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      source: 'app',
    });

    setTitle('');
    setDescription('');
    onClose();
  };

  if (!isOpen || !position) return null;

  // Calculate rendering position (avoid going off-screen)
  const popoverWidth = 440;
  const popoverHeight = 320;
  const padding = 20;
  
  let left = position.x + 20; // Default slightly to the right of cursor
  let top = position.y - popoverHeight / 2; // Default centered vertically on cursor

  // Adjust for screen edges
  if (left + popoverWidth > window.innerWidth - padding) {
    left = position.x - popoverWidth - 20; // Flip to left side
  }
  if (top < padding) {
    top = padding; // Push down
  } else if (top + popoverHeight > window.innerHeight - padding) {
    top = window.innerHeight - popoverHeight - padding; // Push up
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          width: `${popoverWidth}px`,
          background: 'var(--color-bg-elevated)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-2xl), 0 0 0 1px var(--color-border-subtle)',
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Header area - Drag handle placeholder & Close */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 12px', background: 'var(--color-bg-elevated)' }}>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '4px' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: '0 24px 24px 24px' }}>
            {/* Title Input */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add title"
              autoFocus
              required
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid var(--color-accent-blue)',
                color: 'var(--color-text-primary)',
                fontSize: '1.5rem',
                padding: '4px 0',
                marginBottom: '16px',
                outline: 'none',
              }}
            />

            {/* Segmented Control: Event vs Task */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('event')}
                style={{
                  background: activeTab === 'event' ? 'var(--color-bg-hover)' : 'transparent',
                  color: activeTab === 'event' ? 'var(--color-accent-blue)' : 'var(--color-text-secondary)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Event
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('task')}
                style={{
                  background: activeTab === 'task' ? 'var(--color-bg-hover)' : 'transparent',
                  color: activeTab === 'task' ? 'var(--color-accent-blue)' : 'var(--color-text-secondary)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Task
              </button>
            </div>

            {/* Times */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <Clock size={20} color="var(--color-text-muted)" />
              <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid transparent',
                    color: 'var(--color-text-primary)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    flex: 1,
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.border = '1px solid var(--color-accent-blue)'}
                  onBlur={(e) => e.target.style.border = '1px solid transparent'}
                />
                <span style={{ color: 'var(--color-text-secondary)' }}>to</span>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid transparent',
                    color: 'var(--color-text-primary)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    flex: 1,
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.border = '1px solid var(--color-accent-blue)'}
                  onBlur={(e) => e.target.style.border = '1px solid transparent'}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '32px' }}>
              <AlignLeft size={20} color="var(--color-text-muted)" style={{ marginTop: '8px' }} />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid transparent',
                  color: 'var(--color-text-primary)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  flex: 1,
                  minHeight: '80px',
                  resize: 'none',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.border = '1px solid var(--color-accent-blue)'}
                onBlur={(e) => e.target.style.border = '1px solid transparent'}
              />
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={!title.trim()}
                style={{
                  background: 'var(--color-accent-blue)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 24px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: title.trim() ? 'pointer' : 'not-allowed',
                  opacity: title.trim() ? 1 : 0.5,
                  transition: 'all 0.2s'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
