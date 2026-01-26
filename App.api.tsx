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
import ExternalLoans from './pages/ExternalLoans';
import Register from './pages/Register';
import PublicRegister from './pages/PublicRegister';
import GroupSettings from './pages/GroupSettings';
import Landing from './pages/Landing';
import Billing from './pages/Billing';
import Unauthorized from './components/Unauthorized';
import GroupSelector from './components/GroupSelector';

// Helper function to check if user has required role
const hasRole = (userRole: string | undefined, allowedRoles: string[]): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};

// Inner app component that uses auth context
const AppContent: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    logout,
    // Multi-group support
    availableGroups,
    hasMultipleGroups,
    showGroupSelector,
    selectGroup,
    switchGroup,
    dismissGroupSelector,
  } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [showLanding, setShowLanding] = useState(false);

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

  // Check if user is new (hasn't visited before)
  useEffect(() => {
    const hasVisited = localStorage.getItem('pesa_chama_visited');
    if (!hasVisited && !isAuthenticated) {
      setShowLanding(true);
    }
  }, [isAuthenticated]);

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

  // Handle Get Started from Landing page
  const handleGetStarted = () => {
    localStorage.setItem('pesa_chama_visited', 'true');
    window.location.href = '/register/public';
  };

  // Handle Login from Landing page
  const handleLoginClick = () => {
    localStorage.setItem('pesa_chama_visited', 'true');
    setShowLanding(false);
  };

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

  // Show Landing page for new visitors
  if (!isAuthenticated && showLanding) {
    return (
      <Landing
        onGetStarted={handleGetStarted}
        onLogin={handleLoginClick}
        isDark={darkMode}
        toggleTheme={() => setDarkMode(!darkMode)}
      />
    );
  }

  // Show group selector modal if needed
  if (showGroupSelector && availableGroups.length > 0) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-bgLight dark:bg-gray-900">
          <GroupSelector
            groups={availableGroups}
            onSelect={selectGroup}
            onDismiss={dismissGroupSelector}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <Auth />;
  }

  // Define pages that require admin/treasurer role
  const adminTreasurerPages = ['members', 'disbursements'];
  const adminOnlyPages = ['group-settings'];
  const isAdminOrTreasurer = hasRole(user?.role, ['ADMIN', 'TREASURER']);
  const isAdmin = hasRole(user?.role, ['ADMIN', 'SUPER_ADMIN']);

  // Redirect to dashboard if trying to access restricted page without permission
  const handleNavigate = (page: string) => {
    if (adminTreasurerPages.includes(page) && !isAdminOrTreasurer) {
      // Redirect to dashboard if not authorized
      setActivePage('dashboard');
      return;
    }
    if (adminOnlyPages.includes(page) && !isAdmin) {
      // Redirect to dashboard if not admin
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
      case 'external-loans':
        // All users can access (shows different data based on role)
        return <ExternalLoans />;
      case 'group-settings':
        // Guard: only admin can access
        if (!isAdmin) {
          return <Unauthorized onNavigate={() => setActivePage('dashboard')} />;
        }
        return <GroupSettings />;
      case 'settings':
        return <Settings />;
      case 'notifications':
        return <Notifications />;
      case 'billing':
        return <Billing />;
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
      availableGroups={availableGroups}
      hasMultipleGroups={hasMultipleGroups}
      selectedGroupId={user?.member?.groupId}
      onSwitchGroup={switchGroup}
    >
      {renderPage()}
    </Layout>
  );
};

// Main App with providers
const App: React.FC = () => {
  const [isRegistrationRoute, setIsRegistrationRoute] = useState(false);
  const [registrationRouteType, setRegistrationRouteType] = useState<'member' | 'public' | null>(null);

  // Check for registration route on mount
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);

      // Check if this is a member registration link (with token)
      if (path === '/register' && params.get('memberId') && params.get('token')) {
        setIsRegistrationRoute(true);
        setRegistrationRouteType('member');
      // Check if this is a public registration page (create new group)
      } else if (path === '/register/public' || path === '/signup') {
        setIsRegistrationRoute(true);
        setRegistrationRouteType('public');
      } else {
        setIsRegistrationRoute(false);
        setRegistrationRouteType(null);
      }
    };

    checkRoute();

    // Listen for browser navigation
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, []);

  // Show registration pages (no auth required)
  if (isRegistrationRoute) {
    if (registrationRouteType === 'public') {
      return <PublicRegister />;
    }
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