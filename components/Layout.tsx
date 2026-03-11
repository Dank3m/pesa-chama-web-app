import React, { useState } from 'react';
import {
  LayoutDashboard,
  ArrowRightLeft,
  CreditCard,
  Settings as SettingsIcon,
  Bell,
  Search,
  Menu,
  X,
  HandCoins,
  LogOut,
  User as UserIcon,
  HelpCircle,
  Shield,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info,
  Receipt,
  Users,
  DollarSign,
  Sun,
  Moon,
  UserCheck,
  Building2,
  ChevronDown,
  Check,
  Crown,
  TrendingUp,
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { UserResponse, GroupMembershipResponse } from '../services/authService';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  user: UserResponse | null;
  // Multi-group support
  availableGroups?: GroupMembershipResponse[];
  hasMultipleGroups?: boolean;
  selectedGroupId?: string | null;
  onSwitchGroup?: (groupId: string) => Promise<void>;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activePage,
  onNavigate,
  onLogout,
  isDark,
  toggleTheme,
  user,
  availableGroups = [],
  hasMultipleGroups = false,
  selectedGroupId,
  onSwitchGroup
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'settings' | 'notifications' | 'profile' | 'groups' | null>(null);
  const [isSwitchingGroup, setIsSwitchingGroup] = useState(false);

  // Get current group info
  const currentGroup = availableGroups.find(g => g.groupId === selectedGroupId) || availableGroups[0];
  const currentGroupName = currentGroup?.groupName || user?.member?.groupId ? 'My Group' : 'No Group';

  // Get notification data from context
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  // Helper to check if user has admin or treasurer role
  const isAdminOrTreasurer = user?.role === 'ADMIN' || user?.role === 'TREASURER';

  // Get user display info
  const userDisplayName = user?.member?.fullName || user?.username || 'User';
  const userInitials = user?.member
    ? `${user.member.firstName?.charAt(0) || ''}${user.member.lastName?.charAt(0) || ''}`
    : user?.username?.charAt(0)?.toUpperCase() || 'U';

  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={24} /> },
    { id: 'transactions', label: 'Transactions', icon: <ArrowRightLeft size={24} /> },
    { id: 'loans', label: 'Loans', icon: <CreditCard size={24} /> },
    { id: 'contributions', label: 'Contributions', icon: <HandCoins size={24} /> },
    { id: 'expenses', label: 'Expenses', icon: <Receipt size={24} /> },
    { id: 'external-loans', label: 'External Loans', icon: <UserCheck size={24} /> },
    { id: 'investments', label: 'Investments', icon: <TrendingUp size={24} /> },
  ];

  // Admin/Treasurer only items
  const managementItems: { id: string; label: string; icon: React.ReactNode }[] = [];
  if (isAdminOrTreasurer) {
    managementItems.push({ id: 'members', label: 'Members', icon: <Users size={24} /> });
    managementItems.push({ id: 'disbursements', label: 'Disbursements', icon: <DollarSign size={24} /> });
  }

  const systemNavItems = [
    { id: 'billing', label: 'Billing', icon: <Crown size={24} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={24} /> },
  ];

  const toggleDropdown = (name: 'settings' | 'notifications' | 'profile' | 'groups') => {
    if (activeDropdown === name) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(name);
    }
  };

  const handleSwitchGroup = async (groupId: string) => {
    if (!onSwitchGroup || groupId === selectedGroupId) {
      setActiveDropdown(null);
      return;
    }
    setIsSwitchingGroup(true);
    try {
      await onSwitchGroup(groupId);
    } catch (err) {
      console.error('Failed to switch group:', err);
    } finally {
      setIsSwitchingGroup(false);
      setActiveDropdown(null);
    }
  };

  const handleNavigateFromDropdown = (page: string) => {
    onNavigate(page);
    setActiveDropdown(null);
  };

  const NavItem = ({ item }: { item: { id: string, label: string, icon: React.ReactNode } }) => (
    <button
      onClick={() => {
        onNavigate(item.id);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-xl transition-colors duration-200 ${
        activePage === item.id
          ? 'text-primary bg-blue-50 dark:bg-gray-700 relative'
          : 'text-gray-400 dark:text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-primary'
      }`}
    >
      {activePage === item.id && (
         <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r-lg"></div>
      )}
      <div className="w-6 h-6 flex items-center justify-center">
        {item.icon}
      </div>
      <span className="font-medium text-lg">{item.label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-bgLight dark:bg-gray-900 text-dark dark:text-gray-100 font-sans relative transition-colors duration-200">
      
      {/* Backdrop for closing dropdowns */}
      {activeDropdown && (
        <div 
          className="fixed inset-0 z-30 bg-transparent" 
          onClick={() => setActiveDropdown(null)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 fixed h-full z-10 overflow-y-auto no-scrollbar transition-colors">
        <div className="p-8 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
            P
          </div>
          <span className="text-2xl font-bold text-dark dark:text-white">PesaChama.</span>
        </div>

        <div className="flex-1 flex flex-col px-4 pb-6">
          {/* Main Menu */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-4">Main Menu</h3>
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
              {/* Privileged Pages appended to Main Menu */}
              {managementItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Spacer to push System menu to bottom */}
          <div className="flex-1"></div>

          {/* System Menu */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-4">System</h3>
            <div className="space-y-1">
              {systemNavItems.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
               <button
                onClick={onLogout}
                className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl transition-colors duration-200 text-gray-400 hover:text-secondary hover:bg-red-50 dark:hover:bg-gray-700"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <LogOut size={24} />
                </div>
                <span className="font-medium text-lg">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar - Mobile */}
      <aside className={`fixed top-0 left-0 w-64 h-full bg-white dark:bg-gray-800 z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex justify-between items-center shrink-0">
          <span className="text-2xl font-bold text-dark dark:text-white">PesaChama.</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="dark:text-white"><X /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col">
           <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-4">Main Menu</h3>
              <div className="space-y-1">
                {mainNavItems.map((item) => (
                  <NavItem key={item.id} item={item} />
                ))}
                {managementItems.map((item) => (
                  <NavItem key={item.id} item={item} />
                ))}
              </div>
            </div>

            <div className="mt-auto">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-4">System</h3>
              <div className="space-y-1">
                {systemNavItems.map((item) => (
                  <NavItem key={item.id} item={item} />
                ))}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl transition-colors duration-200 text-gray-400 hover:text-secondary hover:bg-red-50 dark:hover:bg-gray-700"
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <LogOut size={24} />
                  </div>
                  <span className="font-medium text-lg">Log Out</span>
                </button>
              </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden">
        {/* Header - Z-40 to stay above backdrop */}
        <header className="bg-white dark:bg-gray-800 md:dark:bg-transparent md:bg-transparent px-4 py-4 md:px-8 md:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b dark:border-gray-700 md:border-b-0 shrink-0 z-40 relative">
          
          {/* Top Row: Title & Mobile Toggles */}
          <div className="flex justify-between items-center w-full md:w-auto">
            <div className="flex items-center gap-4">
              <button className="md:hidden text-dark dark:text-white" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu />
              </button>
              <h1 className="text-2xl font-bold text-dark dark:text-white capitalize">{activePage}</h1>
            </div>
            
            {/* Mobile Right Actions */}
            <div className="flex items-center gap-3 md:hidden">
              <button 
                onClick={toggleTheme}
                className="w-10 h-10 bg-bgLight dark:bg-gray-700 rounded-full flex items-center justify-center text-subtext dark:text-gray-300 hover:text-primary transition-colors"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              <button 
                onClick={() => onNavigate('settings')}
                className="w-10 h-10 bg-bgLight dark:bg-gray-700 rounded-full flex items-center justify-center text-subtext dark:text-gray-300 hover:text-primary transition-colors"
              >
                <SettingsIcon size={20} />
              </button>
              
              <button
                onClick={() => onNavigate('notifications')}
                className="w-10 h-10 bg-bgLight dark:bg-gray-700 rounded-full flex items-center justify-center text-secondary hover:bg-red-50 dark:hover:bg-gray-600 transition-colors relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              <button onClick={() => handleNavigateFromDropdown('settings')}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {userInitials}
                </div>
              </button>
            </div>
          </div>

          {/* Search Bar - Center */}
          <div className="flex-1 flex md:justify-center md:px-8 w-full md:w-auto order-last md:order-none">
            <div className="flex items-center bg-bgLight dark:bg-gray-800 md:dark:bg-gray-800 md:bg-white rounded-full px-5 py-3 shadow-none md:shadow-sm border-none md:border border-transparent md:border-white dark:md:border-gray-700 w-full md:max-w-md transition-colors">
              <Search className="text-subtext dark:text-gray-400 w-5 h-5 shrink-0" />
              <input 
                type="text" 
                placeholder="Search for something" 
                className="bg-transparent border-none outline-none ml-3 text-sm text-subtext dark:text-gray-300 w-full placeholder-subtext dark:placeholder-gray-500"
              />
            </div>
          </div>

          {/* Desktop Right Actions (with Popups) */}
          <div className="hidden md:flex items-center gap-4 md:gap-8 justify-end relative">

            {/* Group Switcher - Only show if user has multiple groups */}
            {hasMultipleGroups && availableGroups.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('groups')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors shadow-sm ${
                    activeDropdown === 'groups'
                      ? 'bg-blue-50 dark:bg-gray-700 text-primary'
                      : 'bg-white dark:bg-gray-800 text-subtext dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-primary'
                  }`}
                  title="Switch Group"
                  disabled={isSwitchingGroup}
                >
                  <Building2 size={18} />
                  <span className="font-medium text-sm max-w-[120px] truncate">{currentGroupName}</span>
                  <ChevronDown size={16} className={`transition-transform ${activeDropdown === 'groups' ? 'rotate-180' : ''}`} />
                </button>

                {/* Groups Dropdown */}
                {activeDropdown === 'groups' && (
                  <div className="absolute top-full right-0 mt-3 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-40 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-gray-50 dark:border-gray-700">
                      <h4 className="font-bold text-dark dark:text-white">Switch Group</h4>
                      <p className="text-xs text-subtext dark:text-gray-400 mt-1">Select which group to view</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2">
                      {availableGroups.map((group) => (
                        <button
                          key={group.groupId}
                          onClick={() => handleSwitchGroup(group.groupId)}
                          disabled={isSwitchingGroup}
                          className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between gap-2 ${
                            group.groupId === selectedGroupId
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-bgLight dark:hover:bg-gray-700 text-subtext dark:text-gray-300'
                          } ${isSwitchingGroup ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm truncate ${group.groupId === selectedGroupId ? 'text-primary' : 'text-dark dark:text-white'}`}>
                              {group.groupName}
                            </p>
                            <p className="text-xs text-subtext dark:text-gray-400 truncate">
                              {group.memberNumber} · {group.role}
                            </p>
                          </div>
                          {group.groupId === selectedGroupId && (
                            <Check size={16} className="text-primary shrink-0" />
                          )}
                          {group.isDefault && group.groupId !== selectedGroupId && (
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded shrink-0">
                              Default
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 text-center">
                      <button
                        onClick={() => {
                          setActiveDropdown(null);
                          onNavigate('settings');
                        }}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Manage Default Group
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dark Mode Toggle */}
             <button
                onClick={toggleTheme}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm bg-white dark:bg-gray-800 text-subtext dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-primary"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun size={24} strokeWidth={1.5} /> : <Moon size={24} strokeWidth={1.5} />}
              </button>

            {/* Settings Button */}
            <div className="relative">
              <button 
                onClick={() => toggleDropdown('settings')}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm ${activeDropdown === 'settings' ? 'bg-blue-50 dark:bg-gray-700 text-primary' : 'bg-white dark:bg-gray-800 text-subtext dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-primary'}`}
                title="Settings"
              >
                <SettingsIcon size={24} strokeWidth={1.5} />
              </button>
              
              {/* Settings Dropdown */}
              {activeDropdown === 'settings' && (
                <div className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-40 animate-in fade-in slide-in-from-top-2">
                   <div className="p-4 border-b border-gray-50 dark:border-gray-700">
                     <h4 className="font-bold text-dark dark:text-white">Quick Settings</h4>
                   </div>
                   <div className="p-2 space-y-1">
                     <button 
                       onClick={() => handleNavigateFromDropdown('settings')}
                       className="w-full text-left px-3 py-2 rounded-xl hover:bg-bgLight dark:hover:bg-gray-700 flex items-center gap-3 text-subtext dark:text-gray-300 hover:text-dark dark:hover:text-white transition"
                     >
                       <Shield size={18} /> Security
                     </button>
                     <button 
                       onClick={() => handleNavigateFromDropdown('settings')}
                       className="w-full text-left px-3 py-2 rounded-xl hover:bg-bgLight dark:hover:bg-gray-700 flex items-center gap-3 text-subtext dark:text-gray-300 hover:text-dark dark:hover:text-white transition"
                     >
                       <HelpCircle size={18} /> Help & Center
                     </button>
                   </div>
                   <div className="p-3 border-t border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 text-center">
                     <button onClick={() => handleNavigateFromDropdown('settings')} className="text-sm font-bold text-primary hover:underline">
                       View All Settings
                     </button>
                   </div>
                </div>
              )}
            </div>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('notifications')}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm relative ${activeDropdown === 'notifications' ? 'bg-red-50 dark:bg-gray-700 text-secondary' : 'bg-white dark:bg-gray-800 text-secondary hover:bg-red-50 dark:hover:bg-gray-700'}`}
                title="Notifications"
              >
                <Bell size={24} strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-secondary text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {activeDropdown === 'notifications' && (
                <div className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-40 animate-in fade-in slide-in-from-top-2">
                   <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
                     <h4 className="font-bold text-dark dark:text-white">Notifications</h4>
                     {unreadCount > 0 && (
                       <button
                         onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                         className="text-xs text-primary hover:underline font-medium"
                       >
                         Mark all read
                       </button>
                     )}
                   </div>
                   <div className="max-h-64 overflow-y-auto">
                     {notifications.length > 0 ? (
                       notifications.slice(0, 5).map(notif => (
                         <div
                          key={notif.id}
                          onClick={() => handleNavigateFromDropdown('notifications')}
                          className={`p-4 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer ${!notif.isRead ? 'bg-blue-50/50 dark:bg-gray-700/50' : ''}`}
                         >
                            <div className="flex gap-3">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                                 notif.type.includes('APPROVED') || notif.type.includes('RECEIVED') || notif.type === 'LOAN_DISBURSED' ? 'bg-green-100 text-green-600' :
                                 notif.type.includes('REJECTED') || notif.type.includes('OVERDUE') || notif.type.includes('DEFAULTED') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-primary'
                               }`}>
                                 {notif.type.includes('APPROVED') || notif.type.includes('RECEIVED') || notif.type === 'LOAN_DISBURSED' ? <CheckCircle size={14} /> :
                                  notif.type.includes('REJECTED') || notif.type.includes('OVERDUE') || notif.type.includes('DEFAULTED') ? <AlertCircle size={14} /> : <Info size={14} />}
                               </div>
                               <div className="flex-1 min-w-0">
                                 <p className={`text-sm font-medium line-clamp-1 ${!notif.isRead ? 'text-dark dark:text-white' : 'text-subtext dark:text-gray-300'}`}>{notif.title}</p>
                                 <p className="text-xs text-subtext dark:text-gray-400 line-clamp-1 mb-1">{notif.message}</p>
                                 <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                   {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                               </div>
                               {!notif.isRead && <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0"></div>}
                            </div>
                         </div>
                       ))
                     ) : (
                       <div className="p-8 text-center text-subtext dark:text-gray-400">
                         <Bell size={24} className="mx-auto mb-2 opacity-50" />
                         <p className="text-sm">No notifications yet</p>
                       </div>
                     )}
                   </div>
                   <div className="p-3 bg-gray-50 dark:bg-gray-750 text-center">
                     <button onClick={() => handleNavigateFromDropdown('notifications')} className="text-sm font-bold text-primary hover:underline">
                       View All Notifications
                     </button>
                   </div>
                </div>
              )}
            </div>
            
            {/* Profile Button */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('profile')}
                className={`transition-transform hover:scale-105 rounded-full ${activeDropdown === 'profile' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shadow-sm">
                  {userInitials}
                </div>
              </button>

              {/* Profile Dropdown */}
              {activeDropdown === 'profile' && (
                <div className="absolute top-full right-0 mt-3 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-40 animate-in fade-in slide-in-from-top-2">
                   <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex flex-col items-center">
                     <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl mb-3">
                       {userInitials}
                     </div>
                     <h4 className="font-bold text-dark dark:text-white text-lg">{userDisplayName}</h4>
                     <p className="text-sm text-subtext dark:text-gray-400">{user?.role || 'Member'}</p>
                   </div>
                   <div className="p-2 space-y-1">
                     <button 
                      onClick={() => handleNavigateFromDropdown('settings')}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-bgLight dark:hover:bg-gray-700 flex items-center justify-between text-subtext dark:text-gray-300 hover:text-dark dark:hover:text-white transition group"
                    >
                       <div className="flex items-center gap-3">
                         <UserIcon size={18} /> <span>My Profile</span>
                       </div>
                       <ChevronRight size={16} className="text-gray-300 group-hover:text-dark dark:group-hover:text-white" />
                     </button>
                     <button 
                      onClick={() => {
                        setActiveDropdown(null);
                        if (onLogout) onLogout();
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-gray-700 flex items-center gap-3 text-secondary transition"
                     >
                       <LogOut size={18} /> <span>Sign Out</span>
                     </button>
                   </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-4 md:p-8 flex-1">
            {children}
          </div>
          <footer className="py-6 text-center text-sm text-subtext dark:text-gray-500">
            &copy; {new Date().getFullYear()} PesaChama. All rights reserved.
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Layout;