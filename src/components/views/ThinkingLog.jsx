import { motion } from 'framer-motion';
import { Brain, Clock, Zap, ArrowRight, Activity } from 'lucide-react';
import { demoAgentLog } from '../../utils/demoData';
import { useNudge } from '../../contexts/NudgeContext';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { useState, useEffect } from 'react';
import { api } from '../../services/api';

const agentColors = {
  Planner: 'var(--color-accent-amber)',
  Scheduler: 'var(--color-accent-blue)',
  'Conflict Resolver': 'var(--color-accent-coral)',
  Communication: 'var(--color-accent-teal)',
  Ingestion: 'var(--color-accent-violet)',
  Execution: 'var(--color-accent-rose)',
  Reflection: 'var(--color-text-secondary)',
};

const agentEmojis = {
  Planner: '🎯',
  Scheduler: '📅',
  'Conflict Resolver': '⚡',
  Communication: '💬',
  Ingestion: '📥',
  Execution: '🚀',
  Reflection: '📊',
};

export default function ThinkingLog() {
  const { agentLog } = useNudge();
  const { isDemoMode } = useAuth();
  const [serverLog, setServerLog] = useState([]);

  useEffect(() => {
    if (isDemoMode) return;
    
    let mounted = true;
    const fetchLog = async () => {
      try {
        const res = await api.getThinkingLog();
        if (mounted && res.log) {
          setServerLog(res.log);
        }
      } catch (err) {
        console.error('Failed to fetch thinking log:', err);
      }
    };
    fetchLog();
    
    // Poll every 10 seconds
    const interval = setInterval(fetchLog, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isDemoMode]);

  // Merge server log and client log, sort by timestamp
  const mergedLog = [...serverLog, ...agentLog].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  const log = isDemoMode && mergedLog.length === 0 ? demoAgentLog : mergedLog;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 700, 
          fontFamily: 'var(--font-heading)',
          marginBottom: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <Brain size={24} style={{ color: 'var(--color-accent-amber)' }} />
          Agent Log
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Real-time visibility into Nudge's AI decision making.
        </p>
      </div>

      {log.length === 0 ? (
        <motion.div
          className="card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ 
            textAlign: 'center', 
            padding: '3rem 2rem',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}><Activity /></div>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            No agent activity yet
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Start chatting or managing tasks to see Nudge's thought process.
          </div>
        </motion.div>
      ) : (
        <>
          {/* Agent summary cards */}
          <div style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            marginBottom: '2rem',
            flexWrap: 'wrap',
          }}>
            {Object.entries(agentEmojis).slice(0, 4).map(([name, emoji]) => (
              <div key={name} className="card" style={{ 
                flex: '1 1 140px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
              }}>
                <span style={{ fontSize: '1.25rem' }}>{emoji}</span>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: agentColors[name] }}>
                    {name}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--color-text-tertiary)' }}>
                    {log.filter(e => e.agent === name).length} actions
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="thinking-timeline" style={{ marginLeft: '1rem', position: 'relative' }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute',
              left: '-0.85rem',
              top: '0.5rem',
              bottom: '0',
              width: '2px',
              background: 'var(--color-bg-tertiary)',
            }} />
            
            {log.map((entry, idx) => {
              const agentColor = agentColors[entry.agent] || 'var(--color-text-secondary)';
              const emoji = agentEmojis[entry.agent] || '🤖';

              return (
                <motion.div
                  key={idx}
                  className="thinking-step"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  style={{ paddingBottom: '1.5rem', position: 'relative' }}
                >
                  <div style={{
                    position: 'absolute',
                    left: '-1.25rem',
                    top: '0.15rem',
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: 'var(--color-bg-primary)',
                    border: `2px solid ${agentColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }} />

                  <div className="card" style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{emoji}</span>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          color: agentColor,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          {entry.agent} Agent
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: '0.625rem', 
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}>
                        <Clock size={10} />
                        {format(parseISO(entry.timestamp), 'h:mm a')}
                      </span>
                    </div>

                    <div style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: 600,
                      marginBottom: '0.375rem',
                    }}>
                      {entry.action}
                    </div>

                    <div style={{ 
                      fontSize: '0.8125rem', 
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.6,
                    }}>
                      {entry.detail}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
