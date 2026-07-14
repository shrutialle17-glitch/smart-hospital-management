import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true // Important for sending/receiving cookies (refresh token)
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Handle 401 Unauthorized (Silent Refresh)
api.interceptors.response.use((response) => {
  return response;
}, async (error) => {
  const originalRequest = error.config;
  
  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    
    try {
      // Attempt to refresh the token
      const res = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, {}, { withCredentials: true });
      
      const newToken = res.data.data.token;
      
      // Update the auth store with the new token
      useAuthStore.getState().setAuth(useAuthStore.getState().user, newToken);
      
      // Retry the original request
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh token failed (e.g. expired or absent), log out the user
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
  
  return Promise.reject(error);
});

export default api;
