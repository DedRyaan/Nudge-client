import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Sparkles, ChevronDown, ChevronUp, 
  Brain, Loader2, HelpCircle
} from 'lucide-react';
import { useNudge } from '../../contexts/NudgeContext';
import { useAuth } from '../../contexts/AuthContext';
import { demoAgentLog } from '../../utils/demoData';
import { format } from 'date-fns';
import { api } from '../../services/api';

const initialMessages = [
  {
    id: 'welcome',
    role: 'assistant',
    content: "Hey! I'm Nudge 👋 — your scheduling companion. I've looked at your day and organized things a bit. Ask me anything, like:\n\n• \"What's my most urgent task?\"\n• \"Move my 3pm to tomorrow\"\n• \"What's blocking my report?\"\n• \"Clear my afternoon\"",
    timestamp: new Date().toISOString(),
  },
];

export default function AssistantPanel() {
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { 
    agentLog, 
    addAgentLogEntry, 
    tasks, 
    calendarEvents,
    addTask,
    completeTask,
    updateTask
  } = useNudge();
  const { user } = useAuth();

  const thinkingLog = agentLog.length > 0 ? agentLog : demoAgentLog;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Call the real backend AI
      const response = await api.chat(userMessage.content, { 
         tasks: tasks || [], 
         events: calendarEvents || [],
         user: user,
         localTime: new Date().toString(),
         timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (response.agentActions?.length) {
        response.agentActions.forEach(action => addAgentLogEntry(action));
      }

      // Execute client side actions (e.g. create task, complete task)
      if (response.clientActions?.length) {
        for (const action of response.clientActions) {
          if (action.type === 'ADD_TASK') {
            addTask(action.payload);
          } else if (action.type === 'COMPLETE_TASK') {
            const task = tasks.find(t => 
              t.id === action.payload.id || 
              t.title.toLowerCase().includes(action.payload.title.toLowerCase())
            );
            if (task) completeTask(task.id);
          } else if (action.type === 'UPDATE_TASK') {
            const task = tasks.find(t => 
              t.id === action.payload.id || 
              t.title.toLowerCase().includes(action.payload.title.toLowerCase())
            );
            if (task) updateTask(task.id, action.payload.updates);
          }
        }
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error('Chat API failed, falling back to local smart response:', error);
      // Fallback to local smart response
      const fallbackReply = getSmartResponse(userMessage.content);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackReply,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="assistant-dock" id="assistant-panel">
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--color-accent-amber), var(--color-accent-coral))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
          }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Nudge</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-accent-teal)' }}>
              ● Online
            </div>
          </div>
        </div>
        
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={() => setShowThinking(!showThinking)}
          title={showThinking ? "Hide thinking" : "Show thinking"}
          id="btn-toggle-thinking"
          style={{ color: showThinking ? 'var(--color-accent-violet)' : 'var(--color-text-tertiary)' }}
        >
          <Brain size={16} />
        </button>
      </div>

      {/* Thinking Timeline (collapsed by default) */}
      <AnimatePresence>
        {showThinking && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ 
              overflow: 'hidden',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            <div style={{ 
              padding: '1rem 1.25rem',
              maxHeight: '200px',
              overflowY: 'auto',
            }}>
              <div style={{ 
                fontSize: '0.6875rem', 
                fontWeight: 600, 
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--color-accent-violet)',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <Brain size={12} />
                Agent Thinking Log
              </div>
              <div className="thinking-timeline">
                {thinkingLog.map((entry, idx) => (
                  <div className="thinking-step" key={idx}>
                    <div className="thinking-step-label">
                      {entry.agent} Agent
                    </div>
                    <div className="thinking-step-content">
                      {entry.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            className={`chat-bubble ${msg.role}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            <div style={{ 
              fontSize: '0.625rem', 
              color: 'var(--color-text-muted)',
              marginTop: '0.375rem',
            }}>
              {format(new Date(msg.timestamp), 'h:mm a')}
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            className="chat-bubble assistant"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Loader2 size={14} className="animate-spin" style={{ 
                animation: 'spin 1s linear infinite',
                color: 'var(--color-accent-amber)',
              }} />
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Thinking...
              </span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask Nudge anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            id="assistant-input"
            style={{
              minHeight: '40px',
              maxHeight: '100px',
            }}
          />
          <motion.button
            className="btn btn-primary btn-icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            id="btn-send-message"
            style={{
              opacity: inputValue.trim() ? 1 : 0.5,
              minWidth: '40px',
              height: '40px',
            }}
          >
            <Send size={16} />
          </motion.button>
        </div>
        <div style={{ 
          fontSize: '0.625rem', 
          color: 'var(--color-text-muted)',
          marginTop: '0.5rem',
          textAlign: 'center',
        }}>
          Powered by Gemini AI ✨
        </div>
      </div>
    </div>
  );
}

// Smart response generator (demo mode)
function getSmartResponse(input) {
  const lower = input.toLowerCase();
  
  if (lower.includes('urgent') || lower.includes('important')) {
    return "Your most urgent task right now is the **ML Assignment** — it's due tonight at midnight! 🎯\n\nYou have a 2-hour focus block at 3 PM that I carved out for it. Want me to set a WhatsApp reminder 30 minutes before?";
  }
  
  if (lower.includes('move') || lower.includes('reschedule')) {
    return "Sure! I'll move that to a better slot. 📅\n\nLooking at your calendar... Tomorrow morning at 10 AM looks wide open after your standup. Shall I move it there?\n\nThis frees up your afternoon for the ML assignment — which I think is the bigger priority right now.";
  }
  
  if (lower.includes('block') || lower.includes('what') && lower.includes('report')) {
    return "Here's what's between you and that report: ✏️\n\n1. Your 2-4 PM focus block overlaps with the ML assignment deadline\n2. You have 3 meetings before noon\n3. The study group at 4:30 PM means you need to wrap up by then\n\n**My suggestion:** Tackle the report first thing tomorrow morning — you'll have a fresh 2-hour window from 9:30-11:30 AM.";
  }
  
  if (lower.includes('clear') || lower.includes('free')) {
    return "Let me check your afternoon... 🔍\n\nYou have:\n• Deep Work block (2-4 PM) — AI scheduled\n• Study Group (4:30-6 PM) — from Google Calendar\n• Gym (6:30-7:30 PM)\n\nI can move the Deep Work block to tomorrow if you need the afternoon free. The study group and gym are from your calendar though — want to skip those too?";
  }
  
  if (lower.includes('help') || lower.includes('what can') || lower.includes('?')) {
    return "I can help you with lots of things! Here are my favorites: 😊\n\n🗓️ **Scheduling:** \"Move my 3pm\" or \"Find me 2 hours tomorrow\"\n📋 **Tasks:** \"What's my top priority?\" or \"Mark report as done\"\n🔍 **Analysis:** \"Am I overbooked this week?\" or \"What's blocking my report?\"\n💬 **WhatsApp:** \"Send me a reminder at 3pm\" or \"Nudge me about the assignment\"\n\nJust ask naturally — I'll figure it out!";
  }
  
  return "Got it! Let me think about that... 🤔\n\nBased on your current schedule, here's what I'd suggest: focus on your highest-priority items first (the ML assignment is #1), and I'll help you rearrange anything that conflicts.\n\nWant me to create a step-by-step plan for the rest of the day?";
}
