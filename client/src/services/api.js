// import axios from 'axios';
// console.log("API URL:", import.meta.env.VITE_API_URL);

// // Create Axios Instance
// const api = axios.create({
//   baseURL: 'http://10.79.171.200:5000/api',
//   headers: {
//     'Content-Type': 'application/json'
//   }
// });

// // Request interceptor to attach JWT token
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('election_token');
//     if (token) {
//       config.headers['Authorization'] = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor to handle errors globally
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // If unauthorized, clear auth tokens and redirect if necessary
//     if (error.response && (error.response.status === 401 || error.response.status === 403)) {
//       const currentPath = window.location.pathname;
//       // Prevent infinite redirect loops on login pages
//       if (!currentPath.includes('/login') && currentPath !== '/') {
//         localStorage.removeItem('election_token');
//         localStorage.removeItem('election_user');
//         window.location.href = '/';
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;







import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('election_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => response,

  (error) => {

    if (
      error.response &&
      (error.response.status === 401 ||
       error.response.status === 403)
    ) {

      const currentPath = window.location.pathname;

      if (!currentPath.includes('/login') &&
          currentPath !== '/') {

        localStorage.removeItem('election_token');
        localStorage.removeItem('election_user');

        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);


export default api;