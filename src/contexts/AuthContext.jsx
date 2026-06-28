import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  getAdditionalUserInfo,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('nudge-google-token') || null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check for saved demo session
    const savedDemo = sessionStorage.getItem('nudge-demo-user');
    if (savedDemo) {
      setUser(JSON.parse(savedDemo));
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken();
            api.setToken(token);
            // Restore Google token from state/localStorage if it exists
            const storedGoogleToken = localStorage.getItem('nudge-google-token');
            if (storedGoogleToken) {
              setAccessToken(storedGoogleToken);
              api.setGoogleToken(storedGoogleToken, firebaseUser.uid);
            }
          } catch (e) {
            // Token fetch might fail in demo mode
          }
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
        } else {
          setUser(null);
          api.setToken(null);
        }
        setLoading(false);
      });
    } catch (e) {
      // Firebase not configured — just set loading to false
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const additionalInfo = getAdditionalUserInfo(result);
      
      // Extract the OAuth access token for Google Calendar API in a standard way
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (token) {
        setAccessToken(token);
        api.setGoogleToken(token, result.user.uid);
        localStorage.setItem('nudge-google-token', token);
      }
      
      const isNew = additionalInfo?.isNewUser || false;
      setIsNewUser(isNew);
      
      // If it's a new user and we have their Google token, send welcome email
      if (isNew && credential?.oauthAccessToken) {
        api.request('/api/auth/welcome', {
          method: 'POST',
          body: JSON.stringify({
            email: result.user.email,
            name: result.user.displayName,
          })
        }).catch(err => console.error('Failed to send welcome email:', err));
      }
      
      return result.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  // Demo mode — no Firebase required
  const demoSignIn = () => {
    const demoUser = {
      uid: 'demo-user-001',
      email: 'demo@nudge.app',
      displayName: 'Demo User',
      photoURL: null,
    };
    setUser(demoUser);
    setIsNewUser(true);
    setIsDemoMode(true);
    setLoading(false);
    sessionStorage.setItem('nudge-demo-user', JSON.stringify(demoUser));
  };

  const logOut = async () => {
    try {
      if (isDemoMode) {
        sessionStorage.removeItem('nudge-demo-user');
        setIsDemoMode(false);
      } else {
        await signOut(auth);
      }
      setUser(null);
      setAccessToken(null);
      api.setGoogleToken(null);
      localStorage.removeItem('nudge-google-token');
      setIsNewUser(false);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    accessToken,
    isNewUser,
    isDemoMode,
    signIn,
    demoSignIn,
    logOut,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
