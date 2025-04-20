import React, { useState, useEffect } from 'react';
import { Layout, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/vi';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';

const { Content } = Layout;
moment.locale('vi');

const OtherRecruitmentRequests = () => {
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

        // Lấy danh sách yêu cầu từ response.data.applications
        setRequests(response.data.applications);
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
      case "Đã duyệt":
        return "text-[#00B300] bg-[#F0FFF0] border border-[#00B300] rounded-[25px] px-4 py-0.5 text-xs inline-block min-w-[85px] text-center";
      case "Từ chối":
        return "text-[#FF0000] bg-[#FFF0F0] border border-[#FF0000] rounded-[25px] px-4 py-0.5 text-xs inline-block min-w-[85px] text-center";
      case "Chờ nộp":
        return "text-[#7B61FF] bg-[#F4F1FE] border border-[#7B61FF] rounded-[25px] px-4 py-0.5 text-xs inline-block min-w-[85px] text-center";
      default:
        return "text-[#7B61FF] bg-[#F4F1FE] border border-[#7B61FF] rounded-[25px] px-4 py-0.5 text-xs inline-block min-w-[85px] text-center";
    }
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('DD/MM/YYYY');
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

  return (
    <Layout style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <Layout style={{ marginLeft: 282 }}>
        <Content style={{ margin: '80px 16px 24px', minHeight: 280, display: 'flex', flexDirection: 'column' }}>
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
                      onClick={() => navigate(`/hr/recruitment-requests/${request._id}`)}
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

export default OtherRecruitmentRequests; 