import React, { useState, useEffect } from 'react';
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

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    // Check local storage or system preference on initial load
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

  if (!isAuthenticated) {
    return <Auth onLogin={() => setIsAuthenticated(true)} />;
  }

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
        return <Members />;
      case 'disbursements':
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
      onNavigate={setActivePage}
      onLogout={() => setIsAuthenticated(false)}
      isDark={darkMode}
      toggleTheme={() => setDarkMode(!darkMode)}
    >
      {renderPage()}
    </Layout>
  );
};

export default App;