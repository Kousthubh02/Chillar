import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

// Token management
export const storeToken = async (token: string) => {
    await AsyncStorage.setItem('token', token);
};

export const getToken = async () => {
    return await AsyncStorage.getItem('token');
};

export const removeToken = async () => {
    await AsyncStorage.removeItem('token');
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
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (requiresAuth) {
            const token = await getToken();
            if (!token) {
                throw new Error('Authentication required');
            }
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${config.BACKEND_URL}${endpoint}`, {
            ...options,
            headers,
        });

        // Handle 401 (Unauthorized) - usually means token expired
        if (response.status === 401) {
            await removeToken(); // Clear invalid token
            throw new Error('Session expired. Please log in again.');
        }

        // Parse response
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        // Handle error responses
        if (!response.ok) {
            throw new Error(data.msg || 'Something went wrong');
        }

        return data;
    } catch (error: any) {
        // Handle network errors
        if (!error.response) {
            throw new Error('Network error. Please check your connection.');
        }
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
