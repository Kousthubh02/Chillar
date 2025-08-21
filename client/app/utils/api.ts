import config from '../config';

// Simple storage implementation that works in all environments
class SimpleStorage {
    private storage: Map<string, string> = new Map();
    
    async setItem(key: string, value: string): Promise<void> {
        try {
            // Try localStorage first (web environment)
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(key, value);
                return;
            }
            // Fallback to in-memory storage
            this.storage.set(key, value);
        } catch (error) {
            console.warn('Storage setItem failed, using in-memory storage:', error);
            this.storage.set(key, value);
        }
    }
    
    async getItem(key: string): Promise<string | null> {
        try {
            // Try localStorage first (web environment)
            if (typeof window !== 'undefined' && window.localStorage) {
                return localStorage.getItem(key);
            }
            // Fallback to in-memory storage
            return this.storage.get(key) || null;
        } catch (error) {
            console.warn('Storage getItem failed, using in-memory storage:', error);
            return this.storage.get(key) || null;
        }
    }
    
    async removeItem(key: string): Promise<void> {
        try {
            // Try localStorage first (web environment)
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.removeItem(key);
                return;
            }
            // Fallback to in-memory storage
            this.storage.delete(key);
        } catch (error) {
            console.warn('Storage removeItem failed, using in-memory storage:', error);
            this.storage.delete(key);
        }
    }
}

const storage = new SimpleStorage();

// Token management
export const storeToken = async (token: string) => {
    await storage.setItem('token', token);
};

export const getToken = async (): Promise<string | null> => {
    return await storage.getItem('token');
};

export const removeToken = async () => {
    await storage.removeItem('token');
};

// API request wrapper
interface ApiOptions extends RequestInit {
    requiresAuth?: boolean;
}

export const apiRequest = async (
    endpoint: string,
    { requiresAuth = true, ...options }: ApiOptions = {}
) => {
    try {
        const requestHeaders = new Headers();
        requestHeaders.append('Content-Type', 'application/json');
        
        // Add any custom headers from options
        if (options.headers) {
            const customHeaders = options.headers as Record<string, string>;
            Object.keys(customHeaders).forEach(key => {
                requestHeaders.append(key, customHeaders[key]);
            });
        }

        // Add auth header if needed
        if (requiresAuth) {
            const token = await getToken();
            if (!token) {
                throw new Error('Authentication required');
            }
            requestHeaders.append('Authorization', `Bearer ${token}`);
        }

        const response = await fetch(`${config.BACKEND_URL}${endpoint}`, {
            ...options,
            headers: requestHeaders,
        });

        // Handle 401 (Unauthorized) - usually means token expired
        if (response.status === 401) {
            await removeToken(); // Clear invalid token
            throw new Error('Session expired. Please log in again.');
        }

        // Parse response
        let data;
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
        } catch (parseError) {
            console.error('Error parsing response:', parseError);
            throw new Error('Invalid response from server');
        }

        // Handle error responses
        if (!response.ok) {
            const errorMessage = typeof data === 'object' && data.msg 
                ? data.msg 
                : 'Something went wrong';
            throw new Error(errorMessage);
        }

        return data;
    } catch (error: any) {
        // Handle different types of errors
        if (error.message === 'Authentication required') {
            throw error; // Rethrow authentication errors
        }
        
        if (error.message === 'Session expired. Please log in again.') {
            throw error; // Rethrow session expiry errors
        }
        
        // Handle network errors (when fetch itself fails)
        if (error.name === 'TypeError' && error.message.includes('Network')) {
            throw new Error('Network error. Please check your connection.');
        }
        
        // Rethrow any other errors
        throw error;
    }
};

// Common API functions
export const login = async (email: string, mPin: string) => {
    return apiRequest('/auth/login', {
        method: 'POST',
        requiresAuth: false,
        body: JSON.stringify({ email, mPin }),
    });
};

export const requestOtp = async (email: string) => {
    return apiRequest('/auth/request-otp', {
        method: 'POST',
        requiresAuth: false,
        body: JSON.stringify({ email }),
    });
};

export const verifyOtp = async (email: string, otp: string) => {
    return apiRequest('/auth/verify-otp', {
        method: 'POST',
        requiresAuth: false,
        body: JSON.stringify({ email, otp }),
    });
};

export const resetMpin = async (email: string, newMpin: string) => {
    return apiRequest('/auth/reset-mpin', {
        method: 'POST',
        requiresAuth: false,
        body: JSON.stringify({ email, new_mPin: newMpin }),
    });
};

// Additional utility functions
export const checkServerConnection = async () => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(`${config.BACKEND_URL}/`, {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        console.error('Server connection check failed:', error);
        return false;
    }
};
