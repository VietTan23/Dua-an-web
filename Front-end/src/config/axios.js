import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://backendhr-9ti5.onrender.com/api', // Sửa port từ 5000 thành 8000
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Xử lý các lỗi response (401, 403, 500, etc.)
      switch (error.response.status) {
        case 401:
          // Xử lý lỗi unauthorized
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          // Xử lý lỗi forbidden
          break;
        default:
          console.error('API Error:', error.response.data);
          break;
      }
    } else if (error.request) {
      // Lỗi không có response từ server
      console.error('Network Error:', error.message);
    } else {
      // Lỗi khi setup request
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default instance; 