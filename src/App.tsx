import { useState, lazy, Suspense, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { logout, getAuthUser, isAuthenticated } from './lib/auth';
import { dataStore } from './lib/dataStore';
import { motion, AnimatePresence } from 'motion/react';

// Lazy load dashboard pages for better performance
const TenantPage = lazy(() => import('./components/TenantPage').then(m => ({ default: m.TenantPage })));
const AdminPage = lazy(() => import('./components/AdminPage').then(m => ({ default: m.AdminPage })));
const HelpDeskPage = lazy(() => import('./components/HelpDeskPage').then(m => ({ default: m.HelpDeskPage })));

export type UserRole = 'tenant' | 'admin' | 'helpdesk' | null;

export interface UserData {
  id: number;
  username: string;
  role: UserRole;
  fullName: string;
  email?: string;
  phone?: string;
  room?: string;
  building?: string;
}

type AppState = 'home' | 'login' | 'dashboard';

// Loading component for lazy-loaded pages
function DashboardLoader() {
  return (
    <motion.div 
      className="min-h-screen bg-slate-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center">
        <motion.div 
          className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p 
          className="text-slate-600"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Loading dashboard...
        </motion.p>
      </div>
    </motion.div>
  );
}

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 20 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
};

export default function App() {
  const [appState, setAppState] = useState<AppState>('home');
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isAuthenticated()) {
          const authUser = getAuthUser();
          if (authUser) {
            console.log('Found existing session:', authUser);
            
            // Convert AuthUser to UserData
            const userData: UserData = {
              id: authUser.id,
              username: authUser.username,
              role: authUser.role as UserRole,
              fullName: authUser.full_name,
              email: authUser.email,
              phone: authUser.phone,
            };
            
            // Initialize dataStore with existing session
            await dataStore.initialize();
            
            setCurrentUser(userData);
            setAppState('dashboard');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // If auth check fails, just stay on home page
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleNavigateToLogin = () => {
    setAppState('login');
  };

  const handleLogin = (userData: UserData) => {
    console.log('Login successful! User data:', userData); // Debug log
    
    // Validate userData has required fields
    if (!userData.username || !userData.role) {
      console.error('Invalid user data:', userData);
      alert('Login error: Invalid user data received');
      return;
    }
    
    // Validate role is one of the expected values
    const validRoles: UserRole[] = ['admin', 'tenant', 'helpdesk'];
    if (!validRoles.includes(userData.role as UserRole)) {
      console.error('Invalid role received:', userData.role);
      alert(`Error: Unknown user role "${userData.role}". Please contact administrator.`);
      handleLogout(); // Clear any invalid session
      return;
    }
    
    setCurrentUser(userData);
    setAppState('dashboard');
  };

  const handleLogout = async () => {
    // Logout from backend and clear auth data
    await logout();
    setCurrentUser(null);
    setAppState('home');
  };

  const handleBackToHome = () => {
    setAppState('home');
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return <DashboardLoader />;
  }

  if (appState === 'home') {
    return <HomePage onNavigateToLogin={handleNavigateToLogin} />;
  }

  if (appState === 'login') {
    return <LoginPage onLogin={handleLogin} onBackToHome={handleBackToHome} />;
  }

  if (appState === 'dashboard' && currentUser) {
    console.log('Dashboard state - Current user role:', currentUser.role); // Debug log
    
    if (currentUser.role === 'tenant') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<DashboardLoader />}>
            <TenantPage user={currentUser} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }
    if (currentUser.role === 'admin') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<DashboardLoader />}>
            <AdminPage user={currentUser} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }
    if (currentUser.role === 'helpdesk') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<DashboardLoader />}>
            <HelpDeskPage user={currentUser} onLogout={handleLogout} />
          </Suspense>
        </ErrorBoundary>
      );
    }
    
    // If role doesn't match, show error
    console.error('Unknown role:', currentUser.role);
    alert(`Error: Unknown user role "${currentUser.role}". Please contact administrator.`);
    return <HomePage onNavigateToLogin={handleNavigateToLogin} />;
  }

  return <HomePage onNavigateToLogin={handleNavigateToLogin} />;
}