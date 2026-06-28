import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Check localStorage for saved preference or system preference
  const [isLightMode, setIsLightMode] = useState(() => {
    const saved = localStorage.getItem('nudge-theme');
    if (saved) return saved === 'light';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  });

  useEffect(() => {
    // Apply theme class to html element
    const root = document.documentElement;
    if (isLightMode) {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
    // Save to localStorage
    localStorage.setItem('nudge-theme', isLightMode ? 'light' : 'dark');
  }, [isLightMode]);

  const toggleTheme = () => {
    setIsLightMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isLightMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
