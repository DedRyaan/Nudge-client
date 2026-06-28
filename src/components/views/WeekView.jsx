import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, TrendingUp, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { 
  format, isToday, isSameDay, parseISO 
} from 'date-fns';
import { useNudge } from '../../contexts/NudgeContext';
import { demoCalendarEvents, demoTasks } from '../../utils/demoData';
import { useAuth } from '../../contexts/AuthContext';
import { calculateDayLoad, getWeekDays } from '../../utils/helpers';

export default function WeekView() {
  const { tasks: firestoreTasks, calendarEvents: rawCalendarEvents } = useNudge();
  const { isDemoMode } = useAuth();
  
  // Use demo data if no real data and in demo mode
  const tasks = isDemoMode && firestoreTasks.length === 0 ? demoTasks : firestoreTasks;
  const events = isDemoMode && rawCalendarEvents.length === 0 ? demoCalendarEvents : rawCalendarEvents;
  const weekDays = getWeekDays();

  // Generate demo data for each day of the week
  const dayData = useMemo(() => {
    return weekDays.map((day, idx) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const isCurrentDay = isToday(day);
      // Filter real data based on the date
      let dayEvents = [];
      let dayTasks = [];
      let completedCount = 0;
      
      if (isDemoMode && events === demoCalendarEvents) {
        dayEvents = isCurrentDay ? events : events.slice(0, Math.floor(Math.random() * events.length) + 1);
        dayTasks = isCurrentDay ? tasks.filter(t => t.status !== 'done') : tasks.slice(0, Math.floor(Math.random() * tasks.length));
        completedCount = isCurrentDay ? tasks.filter(t => t.status === 'done').length : Math.floor(Math.random() * 3);
      } else {
        dayEvents = events.filter(e => {
          const dateStr = e.start?.dateTime || e.start?.date || e.start;
          if (!dateStr) return false;
          try { return isSameDay(parseISO(dateStr), day); } catch (err) { return false; }
        });
        
        const allDayTasks = tasks.filter(t => {
          const dateStr = t.scheduled_time || t.deadline || t.created_at;
          if (!dateStr) return false;
          try { return isSameDay(parseISO(dateStr), day); } catch (err) { return false; }
        });
        
        dayTasks = allDayTasks.filter(t => t.status !== 'done');
        completedCount = allDayTasks.filter(t => t.status === 'done').length;
      }
      
      const load = (isCurrentDay || !isDemoMode)
        ? calculateDayLoad(dayEvents, dayTasks)
        : Math.floor(Math.random() * 100);

      return {
        date: day,
        dayName: format(day, 'EEE'),
        dayNum: format(day, 'd'),
        isToday: isCurrentDay,
        eventCount: dayEvents.length,
        taskCount: dayTasks.length,
        completedCount,
        load,
        isOverloaded: load > 75,
        topEvents: dayEvents.slice(0, 3),
        topTasks: dayTasks.slice(0, 3),
      };
    });
  }, [weekDays, tasks, events]);

  return (
    <div className="animate-fade-in">
      {/* Week header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
      }}>
        <div>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 700, 
            fontFamily: 'var(--font-heading)',
            marginBottom: '0.25rem',
          }}>
            This Week
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            {format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d, yyyy')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} style={{ color: 'var(--color-accent-amber)' }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              {dayData.filter(d => d.isOverloaded).length} heavy days
            </span>
          </div>
        </div>
      </div>

      {/* Week grid */}
      <div className="week-grid">
        {dayData.map((day, idx) => (
          <motion.div
            key={day.dayNum}
            className={`week-day ${day.isToday ? 'today' : ''} ${day.isOverloaded ? 'overloaded' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.02 }}
            id={`weekday-${day.dayName.toLowerCase()}`}
          >
            <div className="week-day-header">
              {day.dayName}
              {day.isToday && (
                <span style={{ 
                  marginLeft: '0.5rem',
                  fontSize: '0.5625rem',
                  background: 'var(--color-accent-amber)',
                  color: '#0f0f14',
                  padding: '0.1rem 0.4rem',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                }}>
                  TODAY
                </span>
              )}
            </div>

            <div className="week-day-date" style={{
              color: day.isToday ? 'var(--color-accent-amber)' : 'var(--color-text-primary)',
            }}>
              {day.dayNum}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={12} style={{ color: 'var(--color-accent-blue)' }} />
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
                  {day.eventCount}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={12} style={{ color: 'var(--color-success)' }} />
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
                  {day.completedCount}/{day.taskCount + day.completedCount}
                </span>
              </div>
            </div>

            {/* Mini events */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {day.topEvents.map((event, i) => (
                <div key={i} style={{
                  fontSize: '0.6875rem',
                  padding: '0.25rem 0.5rem',
                  background: `${event.color}15`,
                  borderLeft: `2px solid ${event.color}`,
                  borderRadius: '0 4px 4px 0',
                  color: 'var(--color-text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {event.title}
                </div>
              ))}
            </div>

            {/* Load bar */}
            <div className="overload-bar">
              <div 
                className={`overload-bar-fill ${day.load > 75 ? 'high' : day.load > 50 ? 'medium' : 'low'}`}
                style={{ width: `${day.load}%` }}
              />
            </div>

            {day.isOverloaded && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                marginTop: '0.5rem',
                fontSize: '0.625rem',
                color: 'var(--color-accent-coral)',
                fontWeight: 600,
              }}>
                <AlertTriangle size={10} />
                Heavy day
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
