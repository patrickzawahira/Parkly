import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
    (response) => {
        // Validate response structure for auth endpoints
        if (response.config.url?.includes('/auth/login')) {
            if (!response.data || !response.data.token || !response.data.user) {
                throw new Error('Invalid login response: missing token or user data');
            }
        }
        return response;
    },
    (error) => {
        // If backend is not available, reject with a clear error
        if (error.code === 'ECONNREFUSED' ||
            error.code === 'ERR_NETWORK' ||
            error.code === 'ETIMEDOUT' ||
            error.message?.includes('Network Error') ||
            error.message?.includes('timeout')) {
            return Promise.reject(new Error('Backend server is not available. Please ensure the backend is running on http://localhost:5000'));
        }
        // If token is invalid, clear it
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user_session');
        }
        return Promise.reject(error);
    }
);

export const auth = {
    login: async (email: string, password: string) => {
        try {
            const response = await api.post('/auth/login', { email, password });

            // Strict validation: must have both token and user
            if (!response.data || !response.data.token || !response.data.user) {
                throw new Error('Invalid response from server: missing token or user data');
            }

            // Validate user data structure
            if (!response.data.user.email || !response.data.user.name) {
                throw new Error('Invalid user data received from server');
            }

            // Only save to localStorage if we have valid data
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user_session', JSON.stringify(response.data.user));

            return response.data;
        } catch (error: any) {
            // Clear any partial data on error
            localStorage.removeItem('token');
            localStorage.removeItem('user_session');

            // Re-throw with proper error message
            if (error.response?.status === 401) {
                throw new Error('Invalid email or password. Please check your credentials.');
            } else if (error.response?.status === 404) {
                throw new Error('User not found. Please register first.');
            } else if (error.message) {
                throw error;
            } else {
                throw new Error('Login failed. Please ensure the backend server is running.');
            }
        }
    },
    register: async (name: string, email: string, password: string, role: 'user' | 'spot_owner' = 'user') => {
        try {
            const response = await api.post('/auth/register', { name, email, password, role });

            // Validate registration response
            if (!response.data) {
                throw new Error('Invalid response from server');
            }

            return response.data;
        } catch (error: any) {
            if (error.response?.status === 400) {
                const errorMsg = error.response.data?.error || 'Registration failed';
                throw new Error(errorMsg);
            } else if (error.response?.status === 409 || error.response?.status === 422) {
                throw new Error('Email already exists. Please use a different email or login.');
            } else {
                throw new Error(error.message || 'Registration failed. Please ensure the backend server is running.');
            }
        }
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_session');
    },
};

export const parking = {
    getAll: async (lat?: number, lng?: number, radius?: number) => {
        const params = { lat, lng, radius };
        const response = await api.get('/parking', { params });
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/parking/${id}`);
        return response.data;
    },
    reserve: async (spotId: string, durationMinutes: number, status: 'pending' | 'active' = 'active') => {
        const response = await api.post('/reservations', { spotId, durationMinutes, status });
        return response.data;
    },
};

export const reservations = {
    list: async () => {
        const response = await api.get('/reservations');
        return response.data;
    },
    update: async (id: string, updates: {
        action?: 'cancel' | 'extend';
        durationMinutes?: number;
        paymentStatus?: string;
        status?: 'active' | 'cancelled' | 'pending' | 'en_route';
    }) => {
        const response = await api.patch(`/reservations/${id}`, updates);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/reservations/${id}`);
        return response.data;
    }
};

export const user = {
    getProfile: async () => {
        const response = await api.get('/user/profile');
        return response.data;
    },
    updateProfile: async (data: {
        name?: string;
        licensePlate?: string;
        personalInfo?: { phone?: string; address?: string };
        paymentMethods?: Array<any>;
        preferences?: any
    }) => {
        const response = await api.put('/user/profile', data);
        return response.data;
    },
};

export const owner = {
    mySpots: async () => {
        const response = await api.get('/owner/spots');
        return response.data;
    },
    spotAnalytics: async (id: string) => {
        const response = await api.get(`/owner/spots/${id}/analytics`);
        return response.data;
    },
    createSpot: async (data: {
        name: string;
        address: string;
        lat: number;
        lng: number;
        pricePerHour: number;
        totalSpots?: number;
        features?: string[];
        imageUrl?: string;
    }) => {
        const response = await api.post('/parking', data);
        return response.data;
    },
    updateSpot: async (id: string, data: {
        name?: string;
        address?: string;
        lat?: number;
        lng?: number;
        pricePerHour?: number;
        totalSpots?: number;
        features?: string[];
        imageUrl?: string;
    }) => {
        const response = await api.put(`/parking/${id}`, data);
        return response.data;
    },
    deleteSpot: async (id: string) => {
        const response = await api.delete(`/parking/${id}`);
        return response.data;
    },
};

export const chat = {
    sendMessage: async (message: string, userLocation?: { lat: number; lng: number }) => {
        const response = await api.post('/chat/text', { message, userLocation });
        return response.data;
    },
};

export default api;
