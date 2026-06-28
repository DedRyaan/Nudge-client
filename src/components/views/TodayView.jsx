import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isSameDay, parseISO } from 'date-fns';
import { 
  Clock, CheckCircle2, AlertTriangle, Calendar, 
  ChevronRight, MoreHorizontal, Sparkles, ArrowRight,
  Circle, CheckCircle, Timer, Coffee, Plus
} from 'lucide-react';
import { useNudge } from '../../contexts/NudgeContext';
import { 
  formatTime, formatTimeRange, formatRelative, 
  getTimelineHours, getUrgencyLevel, getTaskSummary,
  detectConflicts, isUrgent
} from '../../utils/helpers';
import { demoCalendarEvents, demoTasks, demoConflicts } from '../../utils/demoData';
import ConflictCard from '../calendar/ConflictCard';
import AddTaskModal from '../tasks/AddTaskModal';
import { useAuth } from '../../contexts/AuthContext';

const statusIcons = {
  pending: Circle,
  in_progress: Timer,
  done: CheckCircle,
  snoozed: Coffee,
};

const typeColors = {
  academic: '#9b72cf',
  personal: '#4ecdc4',
  work: '#5b8def',
  task: '#f5a623',
  urgent: '#e8735a',
};

export default function TodayView() {
  const { 
    tasks: firestoreTasks, 
    calendarEvents: rawCalendarEvents, 
    completeTask, 
    snoozeTask,
    calendarLoading
  } = useNudge();
  const { isDemoMode } = useAuth();
  const [showConflicts, setShowConflicts] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const tasks = isDemoMode && firestoreTasks.length === 0 ? demoTasks : firestoreTasks;
  const events = isDemoMode && rawCalendarEvents.length === 0 ? demoCalendarEvents : rawCalendarEvents;
  const conflicts = demoConflicts;

  const hours = getTimelineHours();
  const currentHour = new Date().getHours();

  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const completedTasks = tasks.filter(t => t.status === 'done');
  const urgentTasks = pendingTasks.filter(t => t.deadline && isUrgent(t.deadline));

  // Group events and scheduled tasks by hour
  const eventsByHour = useMemo(() => {
    const grouped = {};
    
    events.forEach(event => {
      const startStr = event.start?.dateTime || event.start?.date || event.start;
      if (!startStr) return;
      try {
        const date = new Date(startStr);
        if (!isSameDay(date, new Date())) return;
        
        const hour = date.getHours();
        if (!grouped[hour]) grouped[hour] = [];
        grouped[hour].push(event);
      } catch (err) {
        console.error('Failed to parse event start date:', err);
      }
    });

    tasks.forEach(task => {
      if (task.status !== 'done' && task.scheduled_time) {
        try {
          const date = parseISO(task.scheduled_time);
          if (!isSameDay(date, new Date())) return;
          
          const hour = date.getHours();
          if (!grouped[hour]) grouped[hour] = [];
          const taskEvent = {
            id: task.id,
            title: task.title,
            start: task.scheduled_time,
            end: task.deadline || new Date(new Date(task.scheduled_time).getTime() + 60 * 60 * 1000).toISOString(),
            source: task.type || 'task',
            type: task.type || 'task',
            color: typeColors[task.type] || '#f5a623',
            isTask: true,
          };
          grouped[hour].push(taskEvent);
        } catch (err) {
          console.error('Failed to parse task scheduled time:', err);
        }
      }
    });
    
    return grouped;
  }, [events, tasks]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px' }}>
      {/* Summary Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div className="card" style={{ 
          flex: '1 1 200px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          padding: '1rem 1.25rem',
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.15), rgba(232, 115, 90, 0.15))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles size={20} style={{ color: 'var(--color-accent-amber)' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Today's Summary
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {getTaskSummary(tasks)}
            </div>
          </div>
        </div>

        <div className="card" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          padding: '1rem 1.25rem',
        }}>
          <Calendar size={18} style={{ color: 'var(--color-accent-blue)' }} />
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{events.length}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Events</div>
          </div>
        </div>

        <div className="card" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          padding: '1rem 1.25rem',
        }}>
          <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              {completedTasks.length}/{tasks.length}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Tasks Done</div>
          </div>
        </div>

        {urgentTasks.length > 0 && (
          <div className="card" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderColor: 'rgba(232, 115, 90, 0.3)',
            background: 'rgba(232, 115, 90, 0.05)',
          }}>
            <AlertTriangle size={18} style={{ color: 'var(--color-accent-coral)' }} />
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--color-accent-coral)' }}>
                {urgentTasks.length}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-accent-coral)', textTransform: 'uppercase' }}>Urgent</div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Conflict Banner */}
      <AnimatePresence>
        {showConflicts && conflicts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: '1.5rem' }}
          >
            <ConflictCard 
              conflict={conflicts[0]} 
              onDismiss={() => setShowConflicts(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content: Timeline + Tasks sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
        
        {/* Timeline */}
        <div>
          <h2 style={{ 
            fontSize: '0.875rem', 
            fontWeight: 600, 
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <Clock size={16} />
            Timeline
          </h2>

          <div className="timeline">
            {hours.map((hour, idx) => {
              const h = hour.getHours();
              const isCurrentHour = h === currentHour;
              const hourEvents = eventsByHour[h] || [];

              return (
                <motion.div 
                  key={h}
                  className="timeline-hour"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <span className="timeline-hour-label">
                    {h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}
                  </span>
                  <div className={`timeline-hour-dot ${isCurrentHour ? 'now' : ''}`} />
                  
                  {isCurrentHour && (
                    <div style={{
                      position: 'absolute',
                      left: '-1.5rem',
                      top: '0.65rem',
                      right: 0,
                      height: '2px',
                      background: 'linear-gradient(90deg, var(--color-accent-amber), transparent)',
                      zIndex: 1,
                    }} />
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%' }}>
                    {calendarLoading ? (
                      (h === 9 || h === 11 || h === 14) ? (
                        <motion.div 
                          className="skeleton" 
                          initial={{ opacity: 0.1 }}
                          animate={{ opacity: [0.1, 0.3, 0.1] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          style={{ 
                            height: '56px', 
                            width: '100%', 
                            borderRadius: 'var(--radius-md)'
                          }} 
                        />
                      ) : null
                    ) : (
                      <>
                        {hourEvents.map(event => (
                          <motion.div
                            key={event.id}
                            className={`event-block ${event.isTask ? (event.type || 'task') : event.source}`}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            id={`event-${event.id}`}
                          >
                            <div className="event-block-title">{event.title}</div>
                            <div className="event-block-time">
                              {formatTimeRange(event.start, event.end)}
                            </div>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem',
                              marginTop: '0.375rem',
                            }}>
                              <span className={`badge badge-${event.isTask ? 'violet' : event.source === 'google' ? 'blue' : event.source === 'ai' ? 'amber' : 'violet'}`}>
                                {event.isTask ? '📋 Task' : event.source === 'google' ? '📅 Calendar' : event.source === 'ai' ? '✨ AI Planned' : '🖊️ Manual'}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                        
                        {hourEvents.length === 0 && isCurrentHour && (
                          <div style={{ 
                            fontSize: '0.8125rem', 
                            color: 'var(--color-text-tertiary)',
                            fontStyle: 'italic',
                            padding: '0.25rem 0',
                          }}>
                            Free right now ✨
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Tasks Sidebar */}
        <div>
          <h2 style={{ 
            fontSize: '0.875rem', 
            fontWeight: 600, 
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <Sparkles size={16} />
            Tasks
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pendingTasks.map((task, idx) => {
              const StatusIcon = statusIcons[task.status] || Circle;
              const urgency = task.deadline ? getUrgencyLevel(task.deadline) : 'comfortable';
              const typeColor = typeColors[task.type] || typeColors.task;

              return (
                <motion.div
                  key={task.id}
                  className={`deadline-card ${task.type || 'task'} ${urgency === 'critical' || urgency === 'urgent' || urgency === 'overdue' ? 'urgent-border' : ''}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  id={`task-${task.id}`}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => completeTask(task.id)}
                      style={{ 
                        padding: '0.25rem', 
                        color: typeColor,
                        marginTop: '0.125rem',
                      }}
                      id={`btn-complete-${task.id}`}
                      title="Mark as done"
                    >
                      <StatusIcon size={20} />
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600,
                        marginBottom: '0.25rem',
                      }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--color-text-secondary)',
                          marginBottom: '0.5rem',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {task.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className={`badge ${
                          task.type === 'academic' ? 'badge-violet' : 
                          task.type === 'personal' ? 'badge-teal' : 
                          task.type === 'work' ? 'badge-blue' : 'badge-amber'
                        }`}>
                          {task.type}
                        </span>
                        {task.priority === 'high' && (
                          <span className="badge badge-coral">High Priority</span>
                        )}
                        {task.deadline && (
                          <span style={{ 
                            fontSize: '0.6875rem', 
                            color: urgency === 'critical' || urgency === 'overdue' 
                              ? 'var(--color-accent-coral)' 
                              : 'var(--color-text-tertiary)',
                          }}>
                            {urgency === 'overdue' ? '⚠️ Overdue' : `Due ${formatRelative(task.deadline)}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => snoozeTask(task.id)}
                      style={{ padding: '0.25rem' }}
                      id={`btn-snooze-${task.id}`}
                      title="Snooze 2 hours"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {/* Completed section */}
            {completedTasks.length > 0 && (
              <>
                <div style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 600, 
                  color: 'var(--color-text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} />
                  Completed ({completedTasks.length})
                </div>
                {completedTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    className="deadline-card done"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    style={{ opacity: 0.6 }}
                    id={`task-done-${task.id}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
                      <span style={{ 
                        fontSize: '0.875rem', 
                        textDecoration: 'line-through',
                        color: 'var(--color-text-secondary)',
                      }}>
                        {task.title}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <motion.button
        className="btn btn-primary btn-icon"
        onClick={() => setIsAddModalOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: 'calc(380px + 2rem)',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 90,
        }}
        id="btn-add-task-fab"
        title="Add new task"
      >
        <Plus size={24} />
      </motion.button>

      <AddTaskModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
}
