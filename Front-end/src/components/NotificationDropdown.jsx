import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://backendhr-9ti5.onrender.com/api/recruitment-notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Thêm interval để tự động cập nhật thông báo mỗi 5 giây
    const interval = setInterval(fetchNotifications, 5000);
    
    // Cleanup interval khi component unmount
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `https://backendhr-9ti5.onrender.com/api/recruitment-notifications/${notification.recruitmentId}/read`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Cập nhật trạng thái đã đọc trong state
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.recruitmentId === notification.recruitmentId
            ? { ...n, isRead: true }
            : n
        )
      );

      // Chuyển đến trang chi tiết yêu cầu tuyển dụng
      navigate(`/hr/ceo-recruitment-requests/${notification.recruitmentId}`);
      setIsOpen(false);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          // Khi mở dropdown, cập nhật lại danh sách thông báo
          if (!isOpen) {
            fetchNotifications();
          }
        }}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        <FaBell size={20} />
        {notifications.some(n => !n.isRead) && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Thông báo</h3>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Không có thông báo mới
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.recruitmentId}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <p className="text-sm text-gray-700">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
 