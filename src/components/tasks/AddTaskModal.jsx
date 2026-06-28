import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Calendar as CalendarIcon, Clock, Briefcase, User, GraduationCap } from 'lucide-react';
import { useNudge } from '../../contexts/NudgeContext';

export default function AddTaskModal({ isOpen, onClose, initialDate }) {
  const { addTask } = useNudge();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('work');
  const [priority, setPriority] = useState('medium');
  const [deadline, setDeadline] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Update initialDate if provided
  useEffect(() => {
    if (isOpen && initialDate) {
      // Format as YYYY-MM-DDThh:mm for the input
      const date = new Date(initialDate);
      const pad = (n) => String(n).padStart(2, '0');
      const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
      setScheduledTime(formatted);
      setDeadline(formatted);
    } else if (isOpen && !initialDate) {
      setScheduledTime('');
      setDeadline('');
    }
  }, [isOpen, initialDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addTask({
      title: title.trim(),
      description: description.trim(),
      type,
      priority,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      scheduled_time: scheduledTime ? new Date(scheduledTime).toISOString() : null,
      source: 'app',
    });

    // Reset and close
    setTitle('');
    setDescription('');
    setType('work');
    setPriority('medium');
    setDeadline('');
    setScheduledTime('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="card"
          style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'var(--color-bg-primary)',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Add New Task</h3>
            <button 
              onClick={onClose}
              className="btn btn-ghost btn-icon"
              style={{ margin: '-0.5rem' }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="chat-input"
                style={{ width: '100%', padding: '0.75rem' }}
                autoFocus
                required
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any details or context..."
                className="chat-input"
                style={{ width: '100%', padding: '0.75rem', minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {/* Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                  Category
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'work', icon: Briefcase, label: 'Work', color: 'var(--color-accent-blue)' },
                    { id: 'personal', icon: User, label: 'Personal', color: 'var(--color-accent-teal)' },
                    { id: 'academic', icon: GraduationCap, label: 'Academic', color: 'var(--color-accent-violet)' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className="badge"
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: type === t.id ? t.color : 'var(--color-bg-tertiary)',
                        color: type === t.id ? '#fff' : 'var(--color-text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      <t.icon size={14} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                  Priority
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['low', 'medium', 'high'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className="badge"
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: priority === p 
                          ? (p === 'high' ? 'var(--color-accent-coral)' : p === 'medium' ? 'var(--color-accent-amber)' : 'var(--color-accent-teal)')
                          : 'var(--color-bg-tertiary)',
                        color: priority === p ? '#fff' : 'var(--color-text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        transition: 'all 0.2s',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Times */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                  Scheduled Time (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="chat-input"
                    style={{ width: '100%', padding: '0.75rem', paddingLeft: '2.5rem' }}
                  />
                  <Clock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                  Deadline (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="chat-input"
                    style={{ width: '100%', padding: '0.75rem', paddingLeft: '2.5rem' }}
                  />
                  <CalendarIcon size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!title.trim()}
              >
                <Plus size={16} />
                Add Task
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
