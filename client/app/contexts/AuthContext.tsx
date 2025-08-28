import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getToken, removeToken, storeToken } from '../utils/api';

// Try to import SecureStore, fallback if not available
let SecureStore: any = null;
let secureStoreAvailable = false;

try {
  SecureStore = require('expo-secure-store');
  secureStoreAvailable = true;
  console.log('SecureStore loaded successfully');
} catch (error) {
  console.warn('SecureStore not available, using fallback');
  secureStoreAvailable = false;
}

// Simple storage implementation for user data
class SimpleStorage {
    private storage: Map<string, string> = new Map();
    
    async setItem(key: string, value: string): Promise<void> {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(key, value);
                return;
            }
            this.storage.set(key, value);
        } catch (error) {
            console.warn('Storage setItem failed, using in-memory storage:', error);
            this.storage.set(key, value);
        }
    }
    
    async getItem(key: string): Promise<string | null> {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return localStorage.getItem(key);
            }
            return this.storage.get(key) || null;
        } catch (error) {
            console.warn('Storage getItem failed, using in-memory storage:', error);
            return this.storage.get(key) || null;
        }
    }
    
    async removeItem(key: string): Promise<void> {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.removeItem(key);
                return;
            }
            this.storage.delete(key);
        } catch (error) {
            console.warn('Storage removeItem failed, using in-memory storage:', error);
            this.storage.delete(key);
        }
    }
}

const userStorage = new SimpleStorage();

const storeUserEmail = async (email: string) => {
    await userStorage.setItem('userEmail', email);
};

const getStoredUserEmail = async (): Promise<string | null> => {
    return await userStorage.getItem('userEmail');
};

const removeUserEmail = async () => {
    await userStorage.removeItem('userEmail');
};

interface User {
  id: string;
  email: string;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // For now, let's start fresh each time to avoid token issues
      // In production, you might want to verify tokens instead
      console.log('Checking auth status - clearing any existing tokens for fresh start');
      await removeToken();
      await removeUserEmail();
      setUser(null);
      
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
      // Clear potentially corrupted token
      try {
        await removeToken();
        await removeUserEmail();
      } catch (removeError) {
        console.error('Error removing token:', removeError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string, userData: User) => {
    try {
      console.log('AuthContext: Starting login process', { userData });
      await storeToken(token);
      await storeUserEmail(userData.email); // Store user email
      setUser(userData);
      console.log('AuthContext: Login completed successfully');
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await removeToken();
      await removeUserEmail(); // Clear stored user email
      
      // Clear biometric stored credentials
      if (secureStoreAvailable && SecureStore) {
        try {
          await SecureStore.deleteItemAsync('userEmail');
          await SecureStore.deleteItemAsync('authToken');
          console.log('Biometric credentials cleared');
        } catch (secureStoreError) {
          console.log('Error clearing biometric credentials:', secureStoreError);
        }
      }
      
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
