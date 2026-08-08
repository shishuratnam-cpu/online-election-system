import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('election_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      error.response &&
      (error.response.status === 401 ||
        error.response.status === 403)
    ) {
      const currentPath = window.location.pathname;

      if (
        !currentPath.includes('/login') &&
        currentPath !== '/'
      ) {
        localStorage.removeItem('election_token');
        localStorage.removeItem('election_user');

        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default api;