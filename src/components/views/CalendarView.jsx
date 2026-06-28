import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { 
  format, addDays, startOfWeek, isToday, isSameDay, parseISO
} from 'date-fns';
import { useNudge } from '../../contexts/NudgeContext';
import { useAuth } from '../../contexts/AuthContext';
import { demoCalendarEvents, demoTasks } from '../../utils/demoData';
import AddTaskPopover from '../tasks/AddTaskPopover';

const HOUR_HEIGHT = 48;
const START_HOUR = 0;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;

const TYPE_COLORS = {
  academic:  { bg: 'rgba(155, 114, 207, 0.85)', border: '#9b72cf' },
  personal:  { bg: 'rgba(78, 205, 196, 0.85)',  border: '#4ecdc4' },
  work:      { bg: 'rgba(91, 141, 239, 0.85)',  border: '#5b8def' },
  meeting:   { bg: 'rgba(91, 141, 239, 0.85)',  border: '#5b8def' },
  focus:     { bg: 'rgba(245, 166, 35, 0.85)',  border: '#f5a623' },
  event:     { bg: 'rgba(91, 141, 239, 0.85)',  border: '#5b8def' },
  task:      { bg: 'rgba(245, 166, 35, 0.85)',  border: '#f5a623' },
  google:    { bg: 'rgba(66, 133, 244, 0.85)',  border: '#4285f4' },
};

function getEventColor(item) {
  if (item.source === 'google') return TYPE_COLORS.google;
  return TYPE_COLORS[item.type] || TYPE_COLORS[item.source] || TYPE_COLORS.event;
}

function parseHourMinute(dateStr) {
  try {
    const d = new Date(dateStr);
    return { hour: d.getHours(), minute: d.getMinutes() };
  } catch {
    return { hour: 0, minute: 0 };
  }
}

function getTopPx(dateStr) {
  const { hour, minute } = parseHourMinute(dateStr);
  return (hour - START_HOUR) * HOUR_HEIGHT + (minute / 60) * HOUR_HEIGHT;
}

function getHeightPx(startStr, endStr) {
  const s = parseHourMinute(startStr);
  const e = parseHourMinute(endStr);
  const startMin = s.hour * 60 + s.minute;
  const endMin = e.hour * 60 + e.minute;
  const diff = Math.max(endMin - startMin, 30);
  return (diff / 60) * HOUR_HEIGHT;
}

export default function CalendarView() {
  const {
    tasks: firestoreTasks,
    calendarEvents: rawCalendarEvents,
    calendarLoading,
    updateTask,
    updateCalendarEvent,
  } = useNudge();
  const { isDemoMode } = useAuth();
  const gridRef = useRef(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [initialModalDate, setInitialModalDate] = useState(null);
  const [currentTimeTop, setCurrentTimeTop] = useState(0);
  const [dragState, setDragState] = useState(null);

  const tasks = isDemoMode && firestoreTasks.length === 0 ? demoTasks : firestoreTasks;
  const events = isDemoMode && rawCalendarEvents.length === 0 ? demoCalendarEvents : rawCalendarEvents;

  // Drag and Drop handlers
  const handleDragStart = (e, block, dayKey) => {
    // We allow dragging both tasks and calendar events now
    // Hide native ghost image using transparent gif
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
    
    e.dataTransfer.setData('text/plain', block.id);
    const duration = new Date(block.end).getTime() - new Date(block.start).getTime();
    e.dataTransfer.setData('duration', duration.toString());
    
    setDragState({
      taskId: block.id,
      title: block.title,
      duration: duration,
      source: block.source,
      type: block.type,
      hoveredDateStr: dayKey,
      snapTop: getTopPx(block.start)
    });
  };

  const handleDragEnd = () => {
    setDragState(null);
  };

  const handleDragOver = (e, dateStr) => {
    e.preventDefault(); // Allow drop
    if (!dragState) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    const totalHours = Math.max(0, y / HOUR_HEIGHT);
    const hour = Math.floor(totalHours);
    let minute = Math.round((totalHours - hour) * 60 / 15) * 15;
    
    let adjustedHour = hour;
    if (minute === 60) {
      minute = 0;
      adjustedHour += 1;
    }
    
    const snapTop = (adjustedHour - START_HOUR) * HOUR_HEIGHT + (minute / 60) * HOUR_HEIGHT;
    
    if (dragState.hoveredDateStr !== dateStr || dragState.snapTop !== snapTop) {
      setDragState(prev => prev ? { ...prev, hoveredDateStr: dateStr, snapTop } : null);
    }
  };

  const handleDrop = async (e, dateStr) => {
    e.preventDefault();
    
    const taskId = dragState?.taskId || e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    
    const duration = dragState?.duration || parseInt(e.dataTransfer.getData('duration') || '3600000', 10);
    
    let adjustedHour, minute, targetDateStr;
    
    if (dragState && dragState.snapTop !== undefined) {
      // Use the exact snapped position we calculated during drag
      const totalHours = dragState.snapTop / HOUR_HEIGHT;
      adjustedHour = Math.floor(totalHours);
      minute = Math.round((totalHours - adjustedHour) * 60);
      targetDateStr = dragState.hoveredDateStr || dateStr;
    } else {
      // Fallback if drop happened before hover could update state
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      
      const totalHours = Math.max(0, y / HOUR_HEIGHT);
      adjustedHour = Math.floor(totalHours);
      minute = Math.round((totalHours - adjustedHour) * 60 / 15) * 15;
      
      if (minute === 60) {
        minute = 0;
        adjustedHour += 1;
      }
      targetDateStr = dateStr;
    }
    
    // Parse the date of the column
    const [year, month, day] = targetDateStr.split('-');
    const newStart = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    newStart.setHours(adjustedHour + START_HOUR, minute, 0, 0);
    
    const newEnd = new Date(newStart.getTime() + duration);
    
    try {
      if (dragState?.source === 'google' || (!dragState && taskId && !taskId.startsWith('task-'))) {
        await updateCalendarEvent(taskId, {
          start: newStart.toISOString(),
          end: newEnd.toISOString()
        });
      } else {
        await updateTask(taskId, {
          scheduled_time: newStart.toISOString(),
          deadline: newEnd.toISOString()
        });
      }
    } catch (err) {
      console.error("Failed to reschedule task:", err);
    } finally {
      setDragState(null);
    }
  };

  const handleGridClick = (e, dateStr) => {
    if (e.target !== e.currentTarget && !e.target.classList.contains('gcal-week-hour-cell')) {
      // Ignore clicks on events
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const totalHours = Math.max(0, y / HOUR_HEIGHT);
    
    // Snap to nearest 30 mins for new events
    const hour = Math.floor(totalHours);
    const minute = (totalHours - hour) >= 0.5 ? 30 : 0;
    
    const [year, month, day] = dateStr.split('-');
    const clickedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    clickedDate.setHours(hour + START_HOUR, minute, 0, 0);
    
    setInitialModalDate({
      date: clickedDate.toISOString(),
      x: e.clientX,
      y: e.clientY
    });
    setIsAddModalOpen(true);
  };

  const formatGhostTime = (topPx, durationMs) => {
    const totalHours = topPx / HOUR_HEIGHT;
    const hour = Math.floor(totalHours) + START_HOUR;
    const minute = Math.round((totalHours - Math.floor(totalHours)) * 60);
    
    const start = new Date();
    start.setHours(hour, minute, 0, 0);
    const end = new Date(start.getTime() + durationMs);
    
    const fmt = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return `${fmt(start)} – ${fmt(end)}`;
  };

  // Week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekOffset]);

  // Current time indicator
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTimeTop((now.getHours() - START_HOUR) * HOUR_HEIGHT + (now.getMinutes() / 60) * HOUR_HEIGHT);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    if (gridRef.current && weekOffset === 0) {
      const now = new Date();
      const scrollTo = Math.max(0, (now.getHours() - 2) * HOUR_HEIGHT);
      gridRef.current.scrollTop = scrollTo;
    }
  }, [calendarLoading, weekOffset]);

  // Build blocks per day
  const blocksByDay = useMemo(() => {
    const result = {};

    weekDays.forEach((day) => {
      const dayKey = format(day, 'yyyy-MM-dd');
      result[dayKey] = [];

      events.forEach((event) => {
        const startStr = event.start?.dateTime || event.start?.date || event.start;
        if (!startStr) return;
        try {
          if (isSameDay(parseISO(startStr), day)) {
            const endStr = event.end?.dateTime || event.end?.date || event.end;
            result[dayKey].push({
              id: event.id,
              title: event.title || event.summary || 'Untitled',
              start: startStr,
              end: endStr || startStr,
              source: event.source || 'google',
              type: event.type || 'event',
              isTask: false,
            });
          }
        } catch {}
      });

      tasks.forEach((task) => {
        if (task.status !== 'done' && task.scheduled_time) {
          try {
            if (isSameDay(parseISO(task.scheduled_time), day)) {
              const endTime = task.deadline || new Date(new Date(task.scheduled_time).getTime() + 60 * 60 * 1000).toISOString();
              result[dayKey].push({
                id: task.id,
                title: task.title,
                start: task.scheduled_time,
                end: endTime,
                source: task.type || 'task',
                type: task.type || 'task',
                isTask: true,
                priority: task.priority,
              });
            }
          } catch {}
        }
      });
    });

    return result;
  }, [weekDays, events, tasks]);

  // Hour labels
  const hourLabels = useMemo(() => {
    const labels = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      const suffix = h >= 12 ? 'PM' : 'AM';
      const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
      labels.push({ hour: h, label: `${display} ${suffix}` });
    }
    return labels;
  }, []);

  const formatBlockTime = (startStr, endStr) => {
    try {
      const s = new Date(startStr);
      const e = new Date(endStr);
      const fmt = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return `${fmt(s)} – ${fmt(e)}`;
    } catch {
      return '';
    }
  };

  const headerMonth = format(weekDays[0], 'MMM yyyy');

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-text-primary)',
          }}>
            {headerMonth}
          </h2>

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setWeekOffset(w => w - 1)}
              style={{ padding: '0.375rem' }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setWeekOffset(0)}
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              Today
            </button>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setWeekOffset(w => w + 1)}
              style={{ padding: '0.375rem' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-tertiary)',
          fontWeight: 500,
        }}>
          {format(weekDays[0], 'MMM d')} — {format(weekDays[6], 'MMM d, yyyy')}
        </div>
      </div>

      {/* Column headers (days) */}
      <div className="gcal-week-header">
        <div className="gcal-week-gutter" />
        {weekDays.map((day) => {
          const today = isToday(day);
          return (
            <div key={day.toISOString()} className={`gcal-week-day-header ${today ? 'today' : ''}`}>
              <span className="gcal-week-day-name">{format(day, 'EEE')}</span>
              <span className={`gcal-week-day-num ${today ? 'today' : ''}`}>
                {format(day, 'd')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Grid body */}
      <div ref={gridRef} className="gcal-week-body">
        {calendarLoading ? (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2, 3, 4].map(i => (
              <motion.div
                key={i}
                className="skeleton"
                initial={{ opacity: 0.1 }}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ height: '48px', borderRadius: 'var(--radius-md)' }}
              />
            ))}
          </div>
        ) : (
          <div className="gcal-week-grid" style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>
            {/* Hour rows */}
            {hourLabels.map(({ hour, label }) => (
              <div
                key={hour}
                className="gcal-week-hour-row"
                style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              >
                <div className="gcal-week-hour-label">{label}</div>
                <div className="gcal-week-hour-cells">
                  {weekDays.map((day) => (
                    <div key={day.toISOString()} className="gcal-week-hour-cell" />
                  ))}
                </div>
              </div>
            ))}

            {/* Current time indicator (only if viewing current week) */}
            {weekOffset === 0 && currentTimeTop > 0 && currentTimeTop < TOTAL_HOURS * HOUR_HEIGHT && (
              <div className="gcal-week-now" style={{ top: `${currentTimeTop}px` }}>
                <div className="gcal-week-now-gutter" />
                {weekDays.map((day) => {
                  const today = isToday(day);
                  return (
                    <div key={day.toISOString()} className="gcal-week-now-cell">
                      {today && (
                        <>
                          <div className="gcal-now-dot" style={{ marginLeft: '-6px' }} />
                          <div className="gcal-now-line" />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Event columns */}
            <div className="gcal-week-events-layer">
              <div className="gcal-week-gutter" />
              {weekDays.map((day) => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayBlocks = blocksByDay[dayKey] || [];

                return (
                  <div 
                    key={dayKey} 
                    className="gcal-week-day-col"
                    onDragOver={(e) => handleDragOver(e, dayKey)}
                    onDrop={(e) => handleDrop(e, dayKey)}
                    onClick={(e) => handleGridClick(e, dayKey)}
                  >
                    {dayBlocks.map((block) => {
                      const top = getTopPx(block.start);
                      const height = getHeightPx(block.start, block.end);
                      const colors = getEventColor(block);

                      return (
                        <motion.div
                          key={block.id}
                          className="gcal-event-block"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02, zIndex: 20 }}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, block, dayKey)}
                          onDragEnd={handleDragEnd}
                          style={{
                            position: 'absolute',
                            top: `${top}px`,
                            left: '2px',
                            right: '2px',
                            height: `${Math.max(height, 22)}px`,
                            background: colors.bg,
                            borderLeft: `3px solid ${colors.border}`,
                            color: '#fff',
                            fontSize: '0.6875rem',
                            padding: '2px 4px',
                            lineHeight: 1.3,
                            opacity: dragState?.taskId === block.id ? 0.4 : 1,
                          }}
                          title={`${block.title}\n${formatBlockTime(block.start, block.end)}`}
                        >
                          <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {block.title}
                          </div>
                          {height > 28 && (
                            <div style={{ opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.625rem' }}>
                              {formatBlockTime(block.start, block.end)}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                    
                    {/* Drag Ghost Block */}
                    {dragState && dragState.hoveredDateStr === dayKey && (
                      <div
                        className="gcal-event-block"
                        style={{
                          position: 'absolute',
                          top: `${dragState.snapTop}px`,
                          left: '2px',
                          right: '2px',
                          height: `${Math.max((dragState.duration / 3600000) * HOUR_HEIGHT, 22)}px`,
                          background: (TYPE_COLORS[dragState.type] || TYPE_COLORS.task).bg,
                          borderLeft: `3px solid ${(TYPE_COLORS[dragState.type] || TYPE_COLORS.task).border}`,
                          color: '#fff',
                          fontSize: '0.6875rem',
                          padding: '2px 4px',
                          lineHeight: 1.3,
                          zIndex: 30,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                          cursor: 'grabbing'
                        }}
                      >
                        <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {dragState.title}
                        </div>
                        {dragState.duration > 30 * 60000 && (
                          <div style={{ opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.625rem' }}>
                            {formatGhostTime(dragState.snapTop, dragState.duration)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isAddModalOpen && initialModalDate && (
        <AddTaskPopover 
          isOpen={isAddModalOpen} 
          onClose={() => {
            setIsAddModalOpen(false);
            setInitialModalDate(null);
          }}
          initialDate={initialModalDate.date}
          position={{ x: initialModalDate.x, y: initialModalDate.y }}
        />
      )}
    </div>
  );
}
