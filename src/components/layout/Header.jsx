import { useState } from 'react';
import { MessageSquare, X, Bell, Search, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getGreeting } from '../../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header({ onToggleAssistant, assistantOpen, title }) {
  const { user } = useAuth();
  const { isLightMode, toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="main-header" id="main-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h1 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-text-primary)',
          }}>
            {title || getGreeting(user?.displayName)}
          </h1>
          <p style={{ 
            fontSize: '0.8125rem', 
            color: 'var(--color-text-secondary)',
            marginTop: '0.125rem',
          }}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Search (hidden by default) */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <input
                type="text"
                placeholder="Search tasks, events..."
                className="chat-input"
                style={{ 
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8125rem',
                }}
                autoFocus
                id="search-input"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          className="btn btn-ghost btn-icon"
          onClick={() => setSearchOpen(!searchOpen)}
          id="btn-search"
          title="Search"
        >
          {searchOpen ? <X size={18} /> : <Search size={18} />}
        </button>

        <button 
          className="btn btn-ghost btn-icon"
          onClick={toggleTheme}
          id="btn-theme-toggle"
          title="Toggle theme"
        >
          {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button 
          className="btn btn-ghost btn-icon"
          id="btn-notifications"
          title="Notifications"
          style={{ position: 'relative' }}
        >
          <Bell size={18} />
          <span style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--color-accent-coral)',
          }} />
        </button>

        <motion.button 
          className={`btn ${assistantOpen ? 'btn-primary' : 'btn-secondary'}`}
          onClick={onToggleAssistant}
          id="btn-toggle-assistant"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ gap: '0.5rem' }}
        >
          <MessageSquare size={16} />
          <span>{assistantOpen ? 'Close' : 'Ask Nudge'}</span>
        </motion.button>
      </div>
    </header>
  );
}
