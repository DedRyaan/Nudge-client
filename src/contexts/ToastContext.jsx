import { createContext, useState, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        alignItems: 'center',
        pointerEvents: 'none',
      }}>
        <AnimatePresence>
          {toasts.map(toast => {
            const Icon = toast.type === 'success' ? CheckCircle : 
                         toast.type === 'error' ? AlertTriangle : Info;
            const color = toast.type === 'success' ? 'var(--color-success)' :
                          toast.type === 'error' ? 'var(--color-accent-coral)' : 
                          'var(--color-accent-blue)';
            
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.75rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: 'var(--shadow-lg)',
                  pointerEvents: 'auto',
                }}
              >
                <Icon size={18} style={{ color }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{toast.message}</span>
                <button 
                  onClick={() => removeToast(toast.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-tertiary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                    marginLeft: '0.5rem',
                  }}
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
