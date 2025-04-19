import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import { FaFilter } from 'react-icons/fa';
import { IoSettingsSharp } from 'react-icons/io5';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Content } = Layout;

const CEORecruitmentRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('https://backendhr-9ti5.onrender.com/api/applications', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Raw API Response:', response.data);

        // Lọc các yêu cầu có trạng thái "Đã nộp" hoặc "Đang duyệt"
        const filteredData = response.data.applications.filter(item => 
          item.status === 'Đã nộp' || item.status === 'Đang duyệt'
        );

        setRequests(filteredData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching requests:', error);
        const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu';
        setError(errorMessage);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
        setLoading(false);
      }
    };

    fetchRequests();
  }, [navigate]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Đã nộp":
        return "text-[#7B61FF] bg-[#F4F1FE] border border-[#7B61FF] rounded-[25px] px-33 py-0.5 text-xs inline-block min-w-[85px] text-center";
      case "Đang duyệt":
        return "text-[#FF9900] bg-[#FFF8F0] border border-[#FF9900] rounded-[25px] px-4 py-0.5 text-xs inline-block min-w-[85px] text-center";
      default:
        return "text-[#7B61FF] bg-[#F4F1FE] border border-[#7B61FF] rounded-[25px] px-4 py-0.5 text-xs inline-block min-w-[85px] text-center";
    }
  };

  // Tính toán số trang
  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = requests.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pageNumbers = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  const handleRequestClick = async (request) => {
    try {
      console.log('Full request object:', request);
      
      const token = localStorage.getItem('token');
      const userString = localStorage.getItem('user');
      const user = JSON.parse(userString);

      if (!token || !user) {
        navigate('/login');
        return;
      }

      // Nếu trạng thái là "Đã nộp", cập nhật thành "Đang duyệt" và lưu người phụ trách
      if (request.status === 'Đã nộp') {
        const response = await axios.patch(
          `https://backendhr-9ti5.onrender.com/api/applications/${request._id}/review`,
          { 
            status: 'Đang duyệt',
            responsible: user.id // ID của người dùng hiện tại
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Xóa thông báo khi chuyển sang trạng thái Đang duyệt
        try {
          await axios.delete(
            `https://backendhr-9ti5.onrender.com/api/recruitment-notifications/by-recruitment/${request._id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
        } catch (notificationError) {
          // Bỏ qua lỗi không tìm thấy thông báo (404) hoặc lỗi quyền truy cập (403)
          console.log('Notification might not exist or access denied:', notificationError.response?.status);
          // Không ảnh hưởng đến luồng xử lý chính
        }

        if (response.status === 200) {
          // Cập nhật state với dữ liệu mới từ response
          setRequests(prevRequests => 
            prevRequests.map(r => 
              r._id === request._id 
                ? {
                    ...r,
                    status: 'Đang duyệt',
                    responsible: {
                      _id: user.id,
                      username: user.username,
                      fullName: user.fullName
                    }
                  }
                : r
            )
          );
        }
      }

      // Chuyển đến trang chi tiết
      navigate(`/hr/ceo-recruitment-requests/${request._id}`);
    } catch (error) {
      console.error('Error details:', error.response?.data);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái yêu cầu');
    }
  };

  // Thêm hàm format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} - ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#F5F5F5' }}>
        <Layout style={{ marginLeft: 282 }}>
          <Content style={{ margin: '80px 16px 24px' }}>
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#656ED3]"></div>
            </div>
          </Content>
        </Layout>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#F5F5F5' }}>
        <Layout style={{ marginLeft: 282 }}>
          <Content style={{ margin: '80px 16px 24px' }}>
            <div className="flex justify-center items-center h-full">
              <div className="text-red-500">{error}</div>
            </div>
          </Content>
        </Layout>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <Layout style={{ marginLeft: 282 }}>
        <Content style={{ margin: '80px 16px 24px', minHeight: 280, display: 'flex', flexDirection: 'column' }}>
          {/* Header Actions */}
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm flex-1 flex flex-col">
            {/* Table Container */}
            <div className="flex-1">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="p-4 text-left text-sm font-medium text-gray-600 sticky top-0 bg-[#F9FAFB]">STT</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600 sticky top-0 bg-[#F9FAFB]">Nhân sự lập phiếu</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600 sticky top-0 bg-[#F9FAFB]">Nhân sự phụ trách</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600 sticky top-0 bg-[#F9FAFB]">Vị trí</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600 sticky top-0 bg-[#F9FAFB]">Số lượng</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600 sticky top-0 bg-[#F9FAFB]">Phòng</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600 sticky top-0 bg-[#F9FAFB]">Ngày tạo</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600 sticky top-0 bg-[#F9FAFB]">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRequests.map((request, index) => (
                    <tr 
                      key={request._id}
                      className="border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRequestClick(request)}
                    >
                      <td className="p-4 text-sm">{startIndex + index + 1}</td>
                      <td className="p-4 text-sm">
                        {request.requester?.fullName || request.userId?.fullName || 'N/A'}
                      </td>
                      <td className="p-4 text-sm">
                      {request.requester?.fullName || request.userId?.fullName || 'N/A'}
                      </td>
                      <td className="p-4 text-sm">{request.position}</td>
                      <td className="p-4 text-sm">{request.quantity}</td>
                      <td className="p-4 text-sm">{request.department}</td>
                      <td className="p-4 text-sm">{formatDate(request.createdAt)}</td>
                      <td className="p-4">
                        <span className={getStatusColor(request.status)}>{request.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center p-4 border-t bg-white">
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-[10px] hover:border-[#8D75F5] hover:text-[#8D75F5]"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <IoIosArrowBack size={16} />
                <span>Trước</span>
              </button>
              <div className="flex gap-3 overflow-x-auto px-2">
                {getPageNumbers().map((number, index) => (
                  number === '...' ? (
                    <span key={index} className="w-8 h-8 flex items-center justify-center text-gray-500">...</span>
                  ) : (
                    <button
                      key={index}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                        currentPage === number
                          ? 'bg-[#F9F5FF] text-[#7F56D9]'
                          : 'bg-white text-black'
                      }`}
                      onClick={() => setCurrentPage(number)}
                    >
                      {number}
                    </button>
                  )
                ))}
              </div>
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-[10px] hover:border-[#8D75F5] hover:text-[#8D75F5]"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <span>Sau</span>
                <IoIosArrowForward size={16} />
              </button>
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default CEORecruitmentRequests;