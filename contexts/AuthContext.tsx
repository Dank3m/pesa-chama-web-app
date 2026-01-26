/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService, UserResponse, LoginRequest, RegisterRequest, GroupMembershipResponse, AuthResponse } from '../services';

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // Multi-group support
  availableGroups: GroupMembershipResponse[];
  hasMultipleGroups: boolean;
  selectedGroupId: string | null;
  showGroupSelector: boolean;
  pendingAuthResponse: AuthResponse | null;
  // Methods
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  // Multi-group methods
  selectGroup: (groupId: string, setAsDefault?: boolean) => Promise<void>;
  switchGroup: (groupId: string) => Promise<void>;
  dismissGroupSelector: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Multi-group state
  const [availableGroups, setAvailableGroups] = useState<GroupMembershipResponse[]>([]);
  const [hasMultipleGroups, setHasMultipleGroups] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [pendingAuthResponse, setPendingAuthResponse] = useState<AuthResponse | null>(null);

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          // Try to get user from cache first
          const cachedUser = authService.getCachedUser();
          if (cachedUser) {
            setUser(cachedUser);
          }
          // Then refresh from server
          const freshUser = await authService.getCurrentUser();
          setUser(freshUser);

          // Restore selected group from localStorage
          const savedGroupId = authService.getSelectedGroup();
          if (savedGroupId) {
            setSelectedGroupId(savedGroupId);
          } else if (freshUser.member?.groupId) {
            setSelectedGroupId(freshUser.member.groupId);
          }

          // Fetch available groups for multi-group users
          try {
            const groups = await authService.getAvailableGroups();
            if (groups && groups.length > 1) {
              setAvailableGroups(groups);
              setHasMultipleGroups(true);
            }
          } catch (groupErr) {
            // Not critical - user might just have one group
            console.debug('Could not fetch available groups:', groupErr);
          }
        } catch (err) {
          console.error('Failed to restore auth:', err);
          await authService.logout();
          authService.clearSelectedGroup();
        }
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen for logout events (e.g., from 401 responses)
    const handleLogout = () => {
      setUser(null);
      setAvailableGroups([]);
      setHasMultipleGroups(false);
      setSelectedGroupId(null);
      authService.clearSelectedGroup();
    };
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const authResponse = await authService.login(credentials);

      // Check if user has multiple groups
      if (authResponse.hasMultipleGroups && authResponse.availableGroups && authResponse.availableGroups.length > 1) {
        setAvailableGroups(authResponse.availableGroups);
        setHasMultipleGroups(true);
        setPendingAuthResponse(authResponse);

        // Check if there's a previously selected group or a default
        const savedGroupId = authService.getSelectedGroup();
        const defaultGroup = authResponse.availableGroups.find(g => g.isDefault);

        if (savedGroupId && authResponse.availableGroups.some(g => g.groupId === savedGroupId)) {
          // Use previously selected group
          setSelectedGroupId(savedGroupId);
          setUser(authResponse.user);
          setPendingAuthResponse(null);
        } else if (defaultGroup) {
          // Use default group
          setSelectedGroupId(defaultGroup.groupId);
          authService.setSelectedGroup(defaultGroup.groupId);
          setUser(authResponse.user);
          setPendingAuthResponse(null);
        } else {
          // Show group selector
          setShowGroupSelector(true);
        }
      } else {
        // Single group - proceed normally
        setUser(authResponse.user);
        if (authResponse.user.member?.groupId) {
          setSelectedGroupId(authResponse.user.member.groupId);
          authService.setSelectedGroup(authResponse.user.member.groupId);
        }
      }
    } catch (err: any) {
      const message = err?.message || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const authResponse = await authService.register(data);
      setUser(authResponse.user);
    } catch (err: any) {
      const message = err?.message || 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      // Clear multi-group state
      setAvailableGroups([]);
      setHasMultipleGroups(false);
      setSelectedGroupId(null);
      setShowGroupSelector(false);
      setPendingAuthResponse(null);
      authService.clearSelectedGroup();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Select a group after login (from group selector modal)
  const selectGroup = useCallback(async (groupId: string, setAsDefault?: boolean) => {
    setIsLoading(true);
    try {
      // Switch to the selected group to get updated member info
      const member = await authService.switchGroup(groupId);

      // Update user with the new member info
      if (pendingAuthResponse) {
        setUser({
          ...pendingAuthResponse.user,
          member: member
        });
      }

      // Set as default if requested
      if (setAsDefault) {
        await authService.setDefaultGroup(groupId);
        // Update the group's isDefault status locally
        setAvailableGroups(prev =>
          prev.map(g => ({ ...g, isDefault: g.groupId === groupId }))
        );
      }

      setSelectedGroupId(groupId);
      authService.setSelectedGroup(groupId);
      setShowGroupSelector(false);
      setPendingAuthResponse(null);
    } catch (err: any) {
      const message = err?.message || 'Failed to select group';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [pendingAuthResponse]);

  // Switch to a different group (after already logged in)
  const switchGroup = useCallback(async (groupId: string) => {
    setIsLoading(true);
    try {
      const member = await authService.switchGroup(groupId);

      // Update user with new member info
      if (user) {
        setUser({
          ...user,
          member: member
        });
      }

      setSelectedGroupId(groupId);
      authService.setSelectedGroup(groupId);
    } catch (err: any) {
      const message = err?.message || 'Failed to switch group';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Dismiss group selector without selecting (cancels login)
  const dismissGroupSelector = useCallback(() => {
    setShowGroupSelector(false);
    setPendingAuthResponse(null);
    // If user hasn't selected a group, they can't proceed
    if (!selectedGroupId) {
      authService.logout();
      setUser(null);
    }
  }, [selectedGroupId]);

  const refreshUser = useCallback(async () => {
    if (authService.isAuthenticated()) {
      try {
        const freshUser = await authService.getCurrentUser();
        setUser(freshUser);
      } catch (err) {
        console.error('Failed to refresh user:', err);
      }
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    // Multi-group state
    availableGroups,
    hasMultipleGroups,
    selectedGroupId,
    showGroupSelector,
    pendingAuthResponse,
    // Methods
    login,
    register,
    logout,
    refreshUser,
    clearError,
    // Multi-group methods
    selectGroup,
    switchGroup,
    dismissGroupSelector,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
