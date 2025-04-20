import axios from 'axios';

const API_URL = 'https://backendhr-9ti5.onrender.com/api';

// Lấy danh sách vị trí tuyển dụng
export const getPositions = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }

    const response = await axios.get(`${API_URL}/positions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách vị trí tuyển dụng:', error);
    throw error;
  }
};

// Lấy danh sách vị trí tuyển dụng đang active
export const getActivePositions = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }

    const response = await axios.get(`${API_URL}/positions/active`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Kiểm tra cấu trúc dữ liệu trả về
    if (response.data && response.data.data) {
      return response.data;
    } else {
      // Nếu không có cấu trúc data, trả về dữ liệu gốc
      return { data: response.data };
    }
  } catch (error) {
    console.error('Lỗi khi lấy danh sách vị trí tuyển dụng đang active:', error);
    throw error;
  }
};

// Lấy thống kê ứng viên theo nguồn
export const getCandidateSourceStats = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }

    const response = await axios.get(`${API_URL}/candidates/source-stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Kiểm tra cấu trúc dữ liệu trả về
    if (response.data && response.data.data) {
      return response.data;
    } else {
      // Nếu không có cấu trúc data, trả về dữ liệu gốc
      return { data: response.data };
    }
  } catch (error) {
    console.error('Lỗi khi lấy thống kê ứng viên theo nguồn:', error);
    throw error;
  }
}; 