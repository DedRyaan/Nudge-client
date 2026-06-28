import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Mail, MessageSquare, ArrowRight, 
  Sparkles, X, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function OnboardingFlow() {
  const { signIn, demoSignIn } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn();
      // Auth state change will redirect to main app
    } catch (err) {
      setError('Could not sign in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg-primary)',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245, 166, 35, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '20%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(155, 114, 207, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <motion.div
          style={{
            width: 72,
            height: 72,
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, var(--color-accent-amber), var(--color-accent-coral))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '2rem',
            boxShadow: '0 0 40px rgba(245, 166, 35, 0.2)',
          }}
          animate={{ 
            boxShadow: [
              '0 0 40px rgba(245, 166, 35, 0.2)',
              '0 0 60px rgba(245, 166, 35, 0.3)',
              '0 0 40px rgba(245, 166, 35, 0.2)',
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          ⚡
        </motion.div>

        {/* Title */}
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 800, 
          fontFamily: 'var(--font-heading)',
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, var(--color-accent-amber), var(--color-accent-coral))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Hey, I'm Nudge 👋
        </h1>

        <p style={{ 
          fontSize: '1.125rem', 
          color: 'var(--color-text-secondary)',
          marginBottom: '2.5rem',
          lineHeight: 1.6,
        }}>
          Your friendly scheduling companion. Connect your Google Calendar 
          and I'll show you today in one glance.
        </p>

        {/* Sign in button */}
        <motion.button
          className="btn btn-primary btn-lg"
          onClick={handleSignIn}
          disabled={loading}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          id="btn-google-signin"
          style={{
            fontSize: '1rem',
            padding: '1rem 2rem',
            width: '100%',
            maxWidth: '340px',
            gap: '0.75rem',
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: 20,
                height: 20,
                border: '2px solid rgba(15, 15, 20, 0.3)',
                borderTopColor: '#0f0f14',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }} />
              Connecting...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ 
              color: 'var(--color-accent-coral)', 
              fontSize: '0.875rem',
              marginTop: '1rem',
            }}
          >
            {error}
          </motion.p>
        )}

        {/* Demo mode button */}
        <motion.button
          className="btn btn-ghost"
          onClick={demoSignIn}
          whileHover={{ scale: 1.02 }}
          id="btn-try-demo"
          style={{
            marginTop: '1rem',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            width: '100%',
            maxWidth: '340px',
          }}
        >
          <Sparkles size={16} style={{ color: 'var(--color-accent-violet)' }} />
          Try demo without signing in
        </motion.button>

        {/* Features preview */}
        <div style={{
          marginTop: '3rem',
          display: 'flex',
          gap: '1.5rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          {[
            { icon: Calendar, label: 'Calendar sync', color: 'var(--color-accent-blue)' },
            { icon: Sparkles, label: 'AI planning', color: 'var(--color-accent-amber)' },
            { icon: MessageSquare, label: 'WhatsApp nudges', color: 'var(--color-accent-teal)' },
          ].map((feature) => (
            <motion.div
              key={feature.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8125rem',
                color: 'var(--color-text-tertiary)',
              }}
              whileHover={{ color: 'var(--color-text-primary)' }}
            >
              <feature.icon size={16} style={{ color: feature.color }} />
              {feature.label}
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <p style={{ 
          marginTop: '3rem', 
          fontSize: '0.6875rem', 
          color: 'var(--color-text-muted)',
          lineHeight: 1.5,
        }}>
          We only access your calendar to help you plan better. <br />
          No data is shared with third parties. Ever.
        </p>
      </motion.div>

      {/* CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
