import React, { useState, useEffect } from 'react';
import { Dropdown, Badge, List, Button, message } from 'antd';
import { BellOutlined, RightOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/recruitment-notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      message.error('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleViewDetails = () => {
    navigate('/hr/ceo-recruitment-requests');
  };

  const items = [
    {
      key: 'notifications',
      label: (
        <div className="w-[400px]">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Thông báo</h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <List
              loading={loading}
              dataSource={notifications}
              renderItem={notification => (
                <List.Item
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    notification.status === 'pending' ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        Vị trí {notification.position} đang có offer mới
                      </div>
                      <div className="text-sm text-gray-500">
                        Phòng {notification.department}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <Button 
                      type="text" 
                      onClick={handleViewDetails}
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      Đi tới
                      <RightOutlined className="ml-1" />
                    </Button>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </div>
      )
    }
  ];

  return (
    <Dropdown 
      menu={{ items }} 
      placement="bottomRight"
      trigger={['click']}
      overlayStyle={{ minWidth: '400px' }}
    >
      <Badge count={notifications.filter(n => n.status === 'pending').length}>
        <BellOutlined className="text-2xl text-gray-600 cursor-pointer hover:text-gray-900 transition-colors" />
      </Badge>
    </Dropdown>
  );
};

export default NotificationDropdown; 