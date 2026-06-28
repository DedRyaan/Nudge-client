import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NudgeProvider } from './contexts/NudgeContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import AssistantPanel from './components/assistant/AssistantPanel';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import TodayView from './components/views/TodayView';
import CalendarView from './components/views/CalendarView';
import TriagePanel from './components/views/TriagePanel';
import CrisisMode from './components/views/CrisisMode';
import ThinkingLog from './components/views/ThinkingLog';

function AppContent() {
  const { user, loading } = useAuth();
  const [assistantOpen, setAssistantOpen] = useState(true);

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-primary)',
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, var(--color-accent-amber), var(--color-accent-coral))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
          }}
        >
          ⚡
        </motion.div>
      </div>
    );
  }

  // Not authenticated — show onboarding
  if (!user) {
    return <OnboardingFlow />;
  }

  // Main app shell
  return (
    <NudgeProvider>
      <div className={`app-shell ${assistantOpen ? 'with-assistant' : ''}`}>
        <Sidebar />
        
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}>
          <Header 
            onToggleAssistant={() => setAssistantOpen(!assistantOpen)} 
            assistantOpen={assistantOpen}
          />
          <main className="main-content">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<TodayView />} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/triage" element={<TriagePanel />} />
                <Route path="/crisis" element={<CrisisMode />} />
                <Route path="/thinking" element={<ThinkingLog />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>

        {/* Assistant dock */}
        <AnimatePresence>
          {assistantOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <AssistantPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NudgeProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <NudgeProvider>
            <ThemeProvider>
              <AppContent />
            </ThemeProvider>
          </NudgeProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
