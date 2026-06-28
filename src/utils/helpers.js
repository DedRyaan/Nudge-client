import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, 
  startOfDay, endOfDay, startOfWeek, endOfWeek, addDays, 
  differenceInMinutes, differenceInHours, isBefore, isAfter,
  setHours, setMinutes, eachHourOfInterval, parseISO } from 'date-fns';

// Format time for display (e.g., "3:00 PM")
export function formatTime(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'h:mm a');
}

// Format date for display (e.g., "Mon, Jun 23")
export function formatDate(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEE, MMM d');
}

// Format relative time (e.g., "2 hours ago", "in 30 minutes")
export function formatRelative(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

// Get time range string (e.g., "3:00 PM – 4:30 PM")
export function formatTimeRange(start, end) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

// Check if a deadline is urgent (< 2 hours away)
export function isUrgent(deadline) {
  if (!deadline) return false;
  const d = typeof deadline === 'string' ? parseISO(deadline) : deadline;
  const hoursLeft = differenceInHours(d, new Date());
  return hoursLeft >= 0 && hoursLeft < 2;
}

// Check if a deadline is at risk (< 4 hours away and not done)
export function isAtRisk(deadline, status) {
  if (!deadline || status === 'done') return false;
  const d = typeof deadline === 'string' ? parseISO(deadline) : deadline;
  const hoursLeft = differenceInHours(d, new Date());
  return hoursLeft >= 0 && hoursLeft < 4;
}

// Get urgency level for color coding
export function getUrgencyLevel(deadline) {
  if (!deadline) return 'none';
  const d = typeof deadline === 'string' ? parseISO(deadline) : deadline;
  const hoursLeft = differenceInHours(d, new Date());
  if (hoursLeft < 0) return 'overdue';
  if (hoursLeft < 2) return 'critical';
  if (hoursLeft < 4) return 'urgent';
  if (hoursLeft < 24) return 'soon';
  return 'comfortable';
}

// Get today's date range
export function getTodayRange() {
  const now = new Date();
  return {
    start: startOfDay(now).toISOString(),
    end: endOfDay(now).toISOString(),
  };
}

// Get current week's date range
export function getWeekRange() {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
    end: endOfWeek(now, { weekStartsOn: 1 }).toISOString(),
  };
}

// Get array of days for the current week
export function getWeekDays() {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

// Generate hour slots for timeline (6 AM to 11 PM)
export function getTimelineHours() {
  const today = new Date();
  const start = setMinutes(setHours(today, 6), 0);
  const end = setMinutes(setHours(today, 23), 0);
  return eachHourOfInterval({ start, end });
}

// Calculate event position in timeline (percentage of day)
export function getTimelinePosition(time) {
  const d = typeof time === 'string' ? parseISO(time) : time;
  const hours = d.getHours() + d.getMinutes() / 60;
  // 6 AM = 0%, 11 PM = 100%
  return Math.max(0, Math.min(100, ((hours - 6) / 17) * 100));
}

// Detect conflicts between events
export function detectConflicts(events) {
  const conflicts = [];
  const sorted = [...events].sort((a, b) => 
    new Date(a.start) - new Date(b.start)
  );

  for (let i = 0; i < sorted.length - 1; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const eventA = sorted[i];
      const eventB = sorted[j];
      const aEnd = new Date(eventA.end);
      const bStart = new Date(eventB.start);

      if (isBefore(bStart, aEnd)) {
        conflicts.push({
          events: [eventA, eventB],
          overlapMinutes: differenceInMinutes(aEnd, bStart),
          suggestions: [
            { label: `Move "${eventA.title || 'Event'}" to ${formatTime(aEnd)}` },
            { label: `Shorten "${eventB.title || 'Event'}" by ${differenceInMinutes(aEnd, bStart)} mins` },
            { label: 'Keep both, I\'ll manage' }
          ]
        });
      }
    }
  }

  return conflicts;
}

// Calculate workload score for a day (0-100)
export function calculateDayLoad(events, tasks) {
  const eventHours = events.reduce((sum, e) => {
    return sum + differenceInMinutes(new Date(e.end), new Date(e.start)) / 60;
  }, 0);
  const taskCount = tasks.length;
  // Score: 8+ hours of events or 6+ tasks = overloaded
  const eventScore = Math.min(eventHours / 8, 1) * 60;
  const taskScore = Math.min(taskCount / 6, 1) * 40;
  return Math.round(eventScore + taskScore);
}

// Get greeting based on time of day
export function getGreeting(name) {
  const hour = new Date().getHours();
  const firstName = name?.split(' ')[0] || '';
  if (hour < 12) return `Good morning${firstName ? ', ' + firstName : ''} ☀️`;
  if (hour < 17) return `Good afternoon${firstName ? ', ' + firstName : ''} 👋`;
  return `Good evening${firstName ? ', ' + firstName : ''} 🌙`;
}

// Generate a short task summary
export function getTaskSummary(tasks) {
  const done = tasks.filter(t => t.status === 'done').length;
  const total = tasks.length;
  const pending = total - done;
  
  if (total === 0) return "No tasks for today — enjoy the peace! 🧘";
  if (done === total) return `All ${total} tasks done! Great work 🎉`;
  if (pending === 1) return `Just 1 more to go — you've got this! 💪`;
  return `${done}/${total} done — ${pending} left to tackle`;
}
