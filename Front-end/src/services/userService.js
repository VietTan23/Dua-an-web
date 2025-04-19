import axios from 'axios';

const API_URL = 'https://backendhr-9ti5.onrender.com/api';

// Lấy danh sách tất cả người dùng
export const getAllUsers = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }

    const response = await axios.get(`${API_URL}/users/all`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('API Response:', response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng:', error);
    throw error;
  }
};

// Xóa người dùng
export const deleteUser = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token xác thực');
    }

    const response = await axios.delete(`${API_URL}/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Lỗi khi xóa người dùng:', error);
    throw error;
  }
}; 