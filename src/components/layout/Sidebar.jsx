import { NavLink } from 'react-router-dom';
import { 
  CalendarDays, 
  LayoutGrid, 
  Inbox, 
  AlertTriangle, 
  MessageSquare, 
  Settings, 
  LogOut,
  Brain,
  Zap,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNudge } from '../../contexts/NudgeContext';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const { user, logOut } = useAuth();
  const { triageItems, tasks } = useNudge();
  
  const pendingTriage = triageItems?.length || 0;
  const pendingTasks = tasks?.filter(t => t.status === 'pending')?.length || 0;

  const navItems = [
    { 
      section: 'Overview',
      items: [
        { to: '/', icon: LayoutGrid, label: 'Today', badge: null },
        { to: '/calendar', icon: CalendarDays, label: 'Calendar', badge: null },
      ]
    },
    {
      section: 'Workflow',
      items: [
        { to: '/triage', icon: Inbox, label: 'Smart Triage', badge: pendingTriage > 0 ? pendingTriage : null },
        { to: '/crisis', icon: AlertTriangle, label: 'Crisis Mode', badge: null },
      ]
    },
    {
      section: 'Intelligence',
      items: [
        { to: '/thinking', icon: Brain, label: 'Agent Log', badge: null },
      ]
    },
  ];

  return (
    <aside className="sidebar" id="main-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <motion.div 
          className="sidebar-brand-icon"
          whileHover={{ rotate: 15, scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          ⚡
        </motion.div>
        <span className="sidebar-brand-name">Nudge</span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1 }}>
        {navItems.map(section => (
          <div className="nav-section" key={section.section}>
            <div className="nav-section-title">{section.section}</div>
            {section.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                id={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                <item.icon size={18} className="nav-icon" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User profile */}
      <div style={{ 
        padding: '0.75rem 1.25rem', 
        borderTop: '1px solid var(--color-border-subtle)',
        marginTop: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          marginBottom: '0.75rem'
        }}>
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'User'} 
              style={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%',
                border: '2px solid var(--color-border-default)'
              }} 
            />
          ) : (
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-accent-amber), var(--color-accent-coral))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#0f0f14',
            }}>
              {user?.displayName?.[0] || '?'}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontSize: '0.8125rem', 
              fontWeight: 600, 
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.displayName || 'User'}
            </div>
            <div style={{ 
              fontSize: '0.6875rem', 
              color: 'var(--color-text-tertiary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.email || ''}
            </div>
          </div>
        </div>
        <button 
          className="nav-item" 
          onClick={logOut}
          id="btn-logout"
          style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)' }}
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
