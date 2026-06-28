import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { api, socket } from '../services/api';
import { useAuth } from './AuthContext';
import { demoTasks, demoTriageItems, demoCalendarEvents } from '../utils/demoData';

const NudgeContext = createContext(null);

export function NudgeProvider({ children }) {
  const { user, isDemoMode, accessToken, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [triageItems, setTriageItems] = useState([]);
  const [agentLog, setAgentLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarTimeZone, setCalendarTimeZone] = useState(null);

  // Real-time Firestore listener for tasks
  useEffect(() => {
    if (!user?.uid || isDemoMode) {
      if (isDemoMode) setTasks(demoTasks);
      else setTasks([]);
      setLoading(false);
      return;
    }

    const tasksRef = collection(db, 'users', user.uid, 'tasks');
    const q = query(tasksRef, orderBy('created_at', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(taskData);
      setLoading(false);
    }, (error) => {
      console.error('Firestore tasks listener error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, isDemoMode]);

  // Real-time listener for triage items (from Firestore)
  useEffect(() => {
    if (!user?.uid || isDemoMode) {
      if (isDemoMode) setTriageItems(demoTriageItems);
      return;
    }

    const triageRef = collection(db, 'users', user.uid, 'triage');
    const q = query(triageRef, orderBy('created_at', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Merge with Gmail triage items if any are already fetched
      setTriageItems(prev => {
        const firestoreIds = new Set(items.map(i => i.id));
        const gmailItems = prev.filter(i => !firestoreIds.has(i.id) && i.source === 'gmail');
        return [...items, ...gmailItems];
      });
    });

    return () => unsubscribe();
  }, [user?.uid, isDemoMode]);

  useEffect(() => {
    if (!accessToken || isDemoMode) {
      if (isDemoMode) setCalendarEvents(demoCalendarEvents);
      setCalendarLoading(false);
      return;
    }

    const fetchGoogleData = async (isSilent = false) => {
      if (!isSilent) setCalendarLoading(true);
      try {
        const timeMin = new Date().toISOString();
        const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
        const [calRes, gmailRes] = await Promise.all([
          api.getCalendarEvents(timeMin, timeMax).catch(() => ({ events: [] })),
          api.getGmailTriage().catch(() => ({ items: [] }))
        ]);

        if (calRes.events) {
          setCalendarEvents(calRes.events);
        }
        if (calRes.timeZone) {
          setCalendarTimeZone(calRes.timeZone);
        }

        if (gmailRes.items?.length > 0) {
          setTriageItems(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const newItems = gmailRes.items.filter(i => !existingIds.has(i.id));
            return [...prev, ...newItems];
          });
        }
      } catch (err) {
        console.error('Failed to fetch Google data:', err);
        if (err.status === 401) {
          console.warn('Google credentials expired or unauthorized. Logging out.');
          logout();
        }
      } finally {
        setCalendarLoading(false);
      }
    };

    fetchGoogleData(false); // Initial load: show skeleton

    // Sync silently when window is refocused
    const handleFocus = () => {
      fetchGoogleData(true);
    };
    window.addEventListener('focus', handleFocus);

    // Real-time socket sync
    const handleSocketSync = (data) => {
      console.log('[Socket] Calendar update received:', data);
      if (data?.updatedEvents) {
        setCalendarEvents(prev => {
          let updatedList = [...prev];
          data.updatedEvents.forEach(evt => {
            if (evt.status === 'cancelled') {
              updatedList = updatedList.filter(item => item.id !== evt.id);
            } else {
              const index = updatedList.findIndex(item => item.id === evt.id);
              if (index > -1) {
                updatedList[index] = evt;
              } else {
                updatedList.push(evt);
              }
            }
          });
          return updatedList;
        });
      } else {
        fetchGoogleData(true);
      }
    };
    socket.on('CALENDAR_UPDATED', handleSocketSync);
    
    return () => {
      socket.off('CALENDAR_UPDATED', handleSocketSync);
      window.removeEventListener('focus', handleFocus);
    };
  }, [accessToken, isDemoMode]);

  // Update calendar event directly
  const updateCalendarEvent = useCallback(async (eventId, updates) => {
    if (isDemoMode) return;
    try {
      await api.updateCalendarEvent(eventId, updates);
      // Optimistically update local calendarEvents
      setCalendarEvents(prev => prev.map(ev => {
        if (ev.id === eventId) {
          return {
            ...ev,
            start: updates.start || ev.start,
            end: updates.end || ev.end,
            title: updates.title || ev.title
          };
        }
        return ev;
      }));
    } catch (err) {
      console.error("Failed to update calendar event:", err);
    }
  }, [isDemoMode]);

  // Add a new task
  const addTask = useCallback(async (taskData) => {
    const newTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      status: taskData.status || 'pending',
      source: taskData.source || 'app',
      last_updated_by: 'app',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isDemoMode) {
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    }

    if (!user?.uid) return;
    
    // Sync to Google Calendar if it has a scheduled time
    if (accessToken && newTask.scheduled_time) {
      try {
        const end = newTask.deadline ? new Date(newTask.deadline).toISOString() : new Date(new Date(newTask.scheduled_time).getTime() + 3600000).toISOString();
        const res = await api.createCalendarEvent({
          title: newTask.title,
          start: new Date(newTask.scheduled_time).toISOString(),
          end: end,
          description: newTask.description || ''
        });
        if (res?.event?.id) {
          newTask.googleEventId = res.event.id;
        }
      } catch (err) {
        console.error("Failed to create GCal event:", err);
      }
    }

    const tasksRef = collection(db, 'users', user.uid, 'tasks');
    return addDoc(tasksRef, {
      ...newTask,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }, [user?.uid, isDemoMode, accessToken]);

  // Update a task
  const updateTask = useCallback(async (taskId, updates) => {
    if (isDemoMode) {
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
      ));
      return;
    }

    if (!user?.uid) return;
    const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
    
    // Check if we need to sync to Google Calendar
    if (accessToken && (updates.scheduled_time || updates.deadline || updates.title || updates.description !== undefined)) {
      try {
        const taskDoc = await getDoc(taskRef);
        const taskData = taskDoc.data();
        
        if (taskData?.googleEventId) {
          const updatedStart = updates.scheduled_time || taskData.scheduled_time;
          const updatedEnd = updates.deadline || taskData.deadline;
          
          await api.updateCalendarEvent(taskData.googleEventId, {
            title: updates.title || taskData.title,
            start: updatedStart ? new Date(updatedStart).toISOString() : undefined,
            end: updatedEnd ? new Date(updatedEnd).toISOString() : undefined,
            description: updates.description !== undefined ? updates.description : taskData.description
          });
        }
      } catch (err) {
        console.error("Failed to update synced GCal event:", err);
      }
    }

    return updateDoc(taskRef, {
      ...updates,
      last_updated_by: 'app',
      updated_at: serverTimestamp(),
    });
  }, [user?.uid, isDemoMode, accessToken]);

  // Delete a task
  const removeTask = useCallback(async (taskId) => {
    if (isDemoMode) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      return;
    }

    if (!user?.uid) return;
    const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
    
    if (accessToken) {
      try {
        const taskDoc = await getDoc(taskRef);
        const taskData = taskDoc.data();
        if (taskData?.googleEventId) {
          await api.deleteCalendarEvent(taskData.googleEventId);
        }
      } catch (err) {
        console.error("Failed to delete synced GCal event:", err);
      }
    }
    
    return deleteDoc(taskRef);
  }, [user?.uid, isDemoMode, accessToken]);

  // Mark task as done
  const completeTask = useCallback(async (taskId) => {
    if (isDemoMode) {
      return updateTask(taskId, { status: 'done', completed_at: new Date().toISOString() });
    }
    return updateTask(taskId, { status: 'done', completed_at: serverTimestamp() });
  }, [updateTask, isDemoMode]);

  // Snooze a task
  const snoozeTask = useCallback(async (taskId, snoozeDuration = 2) => {
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + snoozeDuration);
    return updateTask(taskId, { 
      status: 'snoozed', 
      snoozed_until: snoozeUntil.toISOString() 
    });
  }, [updateTask]);

  // Accept a triage item (convert to task)
  const acceptTriageItem = useCallback(async (itemId, itemData) => {
    await addTask({
      title: itemData.title,
      description: itemData.description,
      scheduled_time: itemData.suggested_time,
      priority: itemData.priority || 'medium',
      source: itemData.source,
      type: itemData.type || 'task',
    });
    // Remove from triage
    if (isDemoMode) {
      setTriageItems(prev => prev.filter(i => i.id !== itemId));
      return;
    }

    if (user?.uid) {
      const triageRef = doc(db, 'users', user.uid, 'triage', itemId);
      await deleteDoc(triageRef).catch(() => {
         // Also filter from local state if it was fetched from Gmail API
         setTriageItems(prev => prev.filter(i => i.id !== itemId));
      });
    } else {
       setTriageItems(prev => prev.filter(i => i.id !== itemId));
    }
  }, [addTask, user?.uid, isDemoMode]);

  // Dismiss a triage item
  const dismissTriageItem = useCallback(async (itemId) => {
    if (isDemoMode) {
      setTriageItems(prev => prev.filter(i => i.id !== itemId));
      return;
    }

    if (!user?.uid) {
      setTriageItems(prev => prev.filter(i => i.id !== itemId));
      return;
    }
    const triageRef = doc(db, 'users', user.uid, 'triage', itemId);
    await deleteDoc(triageRef).catch(() => {
      setTriageItems(prev => prev.filter(i => i.id !== itemId));
    });
  }, [user?.uid, isDemoMode]);

  // Add to agent log
  const addAgentLogEntry = useCallback((entry) => {
    setAgentLog(prev => [...prev, {
      ...entry,
      timestamp: new Date().toISOString(),
    }]);
  }, []);

  const value = {
    tasks,
    calendarEvents,
    triageItems,
    agentLog,
    loading,
    calendarLoading,
    calendarTimeZone,
    addTask,
    updateTask,
    removeTask,
    completeTask,
    snoozeTask,
    updateCalendarEvent,
    acceptTriageItem,
    dismissTriageItem,
    addAgentLogEntry,
  };

  return (
    <NudgeContext.Provider value={value}>
      {children}
    </NudgeContext.Provider>
  );
}

export function useNudge() {
  const context = useContext(NudgeContext);
  if (!context) {
    throw new Error('useNudge must be used within a NudgeProvider');
  }
  return context;
}

export default NudgeContext;
