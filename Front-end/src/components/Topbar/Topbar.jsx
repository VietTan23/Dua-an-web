import React, { useState } from 'react';
import { Input, Badge, Dropdown, Space, message, Layout, Avatar, Button, Modal } from 'antd';
import { SearchOutlined, BellOutlined, UserOutlined, DownOutlined, LogoutOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';

const { Header } = Layout;
const API_BASE_URL = 'http://localhost:8000/api';

const Topbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  // Hàm kiểm tra xem có phải là route mới không
  const isNewRoute = (pathname) => {
    const newRoutes = [
      '/positions/:id/candidates',
      '/candidates/:id',
      '/send-email',
      '/hr/ceo-recruitment-requests/:id',
      '/hr/recruitment-requests/:id',
      '/hr/recruitment-requests/:id/edit'
    ];
    
    return newRoutes.some(route => {
      // Xử lý các route có tham số động
      if (route.includes(':')) {
        const routePattern = route.replace(/:[^/]+/g, '[^/]+');
        return new RegExp(`^${routePattern}$`).test(pathname);
      }
      return route === pathname;
    });
  };

  const handleBackClick = () => {
    const state = location.state;
    if (state?.from === 'jobs-candidates' && state?.positionId) {
      navigate(`/positions/${state.positionId}/candidates`);
    } else if (state?.from === 'candidates') {
      navigate('/candidates');
    } else {
      navigate(-1);
    }
  };

  // Map routes to page titles
  const getPageTitle = (pathname) => {
    const routes = {
      '/': 'Trang chủ',
      '/hr/recruitment-requests': 'Danh sách yêu cầu tuyển dụng',
      '/hr/ceo-recruitment-requests': 'Danh sách yêu cầu tuyển dụng cần phê duyệt',
      '/hr/other-recruitment-requests': 'Danh sách yêu cầu tuyển dụng',
      '/positions': 'Danh sách vị trí tuyển dụng',
      '/positions/:id/candidates': 'Danh sách ứng viên',
      '/candidates': 'Ứng viên',
      '/candidates/:id': 'Chi tiết ứng viên',
      '/calendar': 'Lịch',
      '/notifications': 'Thông báo ứng viên mới',
      '/emails': 'Email',
      '/send-email': 'Gửi email',
      '/hr/ceo-recruitment-requests/:id': 'Chi tiết yêu cầu tuyển dụng CEO',
      '/hr/recruitment-requests/:id': 'Chi tiết yêu cầu tuyển dụng',
      '/notifications/edit/:id': 'Chỉnh sửa thông báo',
      '/notifications/:id': 'Thông báo ứng viên mới',
      '/notifications/:id/evaluate': 'Đánh giá ứng viên',
      '/account-management': 'Quản lý tài khoản'
    };

    // Xử lý các route có tham số động
    if (pathname.includes('/positions/') && pathname.includes('/candidates')) {
      return 'Danh sách ứng viên';
    }
    if (pathname.includes('/candidates/')) {
      return 'Chi tiết ứng viên';
    }
    if (pathname.includes('/hr/ceo-recruitment-requests/')) {
      return 'Chi tiết yêu cầu tuyển dụng CEO';
    }
    if (pathname.includes('/hr/recruitment-requests/')) {
      return 'Chi tiết yêu cầu tuyển dụng';
    }

    return routes[pathname] || 'Trang chủ';
  };

  // Lấy thông tin user từ localStorage
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  // Hàm kiểm tra xem có phải là CEO không
  const isCEO = user?.role === 'ceo';

  // Hàm dịch role sang tiếng Việt
  const translateRole = (role) => {
    const roleTranslations = {
      'department_head': 'Trưởng phòng ban',
      'business_director': 'Giám đốc kinh doanh',
      'ceo': 'CEO (Giám đốc điều hành)',
      'recruitment': 'Bộ phận tuyển dụng',
      'applicant': 'Ứng viên',
      'director': 'Giám đốc'
    };
    return roleTranslations[role] || role;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('Đăng xuất thành công!'); 
    navigate('/login'); 
  };

  const showProfileModal = () => {
    setIsProfileModalVisible(true);
  };

  const handleProfileModalClose = () => {
    setIsProfileModalVisible(false);
  };

  const items = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: showProfileModal,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  return (
    <>
      <div className="fixed top-4 right-4 left-[298px] z-10">
        <div className="bg-[#FCFCFC] h-16 rounded-2xl shadow-sm px-6 flex items-center justify-between">
          {/* Page Title with Back Button */}
          <div className="flex items-center gap-4">
            {isNewRoute(location.pathname) && (
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={handleBackClick}
                className="flex items-center"
              >
                Quay lại
              </Button>
            )}
            <h1 className="text-xl font-['Inter'] font-bold">
              {getPageTitle(location.pathname)}
            </h1>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-8">
            {/* Icons */}
            <div className="flex items-center gap-6">
              {/* Notifications - Only show for CEO */}
              {isCEO && <NotificationDropdown />}
            </div>

            {/* User Profile */}
            <Dropdown menu={{ items }} placement="bottomRight">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'background-color 0.3s'
              }}>
                <Avatar 
                  icon={<UserOutlined />} 
                  style={{ 
                    backgroundColor: '#656ED3',
                    marginRight: '12px'
                  }}
                />
                <div>
                  <div className="font-['Inter'] font-normal">
                    {user && user.fullName ? user.fullName : 'User'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {translateRole(user?.role || '')}
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <Modal
        title="Thông tin cá nhân"
        open={isProfileModalVisible}
        onCancel={handleProfileModalClose}
        footer={null}
        width={400}
      >
        <div className="py-4">
          <div className="flex justify-center mb-6">
            <Avatar 
              size={80} 
              icon={<UserOutlined />} 
              style={{ backgroundColor: '#656ED3' }}
            />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-gray-500 mb-1">Họ và tên</p>
              <p className="text-black font-medium">{user?.fullName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Tên đăng nhập</p>
              <p className="text-black font-medium">{user?.username || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Email</p>
              <p className="text-black font-medium">{user?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Vai trò</p>
              <p className="text-black font-medium">{translateRole(user?.role || '')}</p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Topbar;