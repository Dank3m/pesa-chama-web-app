/**
 * App.api.tsx - API-Connected Version
 * 
 * This is an alternative App component that connects to the backend API.
 * To use this instead of the mock-data version:
 * 
 * In index.tsx, change:
 *   import App from './App';
 * To:
 *   import App from './App.api';
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppDataProvider } from './contexts/AppDataContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Loans from './pages/Loans';
import Contributions from './pages/Contributions';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Auth from './pages/Auth';
import Expenses from './pages/Expenses';
import Members from './pages/Members';
import Disbursements from './pages/Disbursements';
import Register from './pages/Register';
import Unauthorized from './components/Unauthorized';

// Helper function to check if user has required role
const hasRole = (userRole: string | undefined, allowedRoles: string[]): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};

// Inner app component that uses auth context
const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply theme class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Show loading spinner during initial auth check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgLight dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-subtext dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <Auth onLogin={() => {}} />;
  }

  // Define pages that require admin/treasurer role
  const adminTreasurerPages = ['members', 'disbursements'];
  const isAdminOrTreasurer = hasRole(user?.role, ['ADMIN', 'TREASURER']);

  // Redirect to dashboard if trying to access restricted page without permission
  const handleNavigate = (page: string) => {
    if (adminTreasurerPages.includes(page) && !isAdminOrTreasurer) {
      // Redirect to dashboard if not authorized
      setActivePage('dashboard');
      return;
    }
    setActivePage(page);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard isDark={darkMode} />;
      case 'transactions':
        return <Transactions />;
      case 'loans':
        return <Loans />;
      case 'contributions':
        return <Contributions />;
      case 'expenses':
        return <Expenses />;
      case 'members':
        // Guard: only admin/treasurer can access
        if (!isAdminOrTreasurer) {
          return <Unauthorized onNavigate={() => setActivePage('dashboard')} />;
        }
        return <Members />;
      case 'disbursements':
        // Guard: only admin/treasurer can access
        if (!isAdminOrTreasurer) {
          return <Unauthorized onNavigate={() => setActivePage('dashboard')} />;
        }
        return <Disbursements />;
      case 'settings':
        return <Settings />;
      case 'notifications':
        return <Notifications />;
      default:
        return <Dashboard isDark={darkMode} />;
    }
  };

  return (
    <Layout
      activePage={activePage}
      onNavigate={handleNavigate}
      onLogout={logout}
      isDark={darkMode}
      toggleTheme={() => setDarkMode(!darkMode)}
      user={user}
    >
      {renderPage()}
    </Layout>
  );
};

// Main App with providers
const App: React.FC = () => {
  const [isRegistrationRoute, setIsRegistrationRoute] = useState(false);

  // Check for registration route on mount
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      
      // Check if this is a registration link
      if (path === '/register' && params.get('memberId') && params.get('token')) {
        setIsRegistrationRoute(true);
      } else {
        setIsRegistrationRoute(false);
      }
    };

    checkRoute();

    // Listen for browser navigation
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, []);

  // Show Register page for registration links (no auth required)
  if (isRegistrationRoute) {
    return <Register />;
  }

  return (
    <AuthProvider>
      <AppDataProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AppDataProvider>
    </AuthProvider>
  );
};

export default App;