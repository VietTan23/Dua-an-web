import React, { useState, useEffect } from 'react';
import { Layout, Modal } from 'antd';
import { FaPlus, FaFilter, FaTrash } from 'react-icons/fa';
import { IoSettingsSharp } from 'react-icons/io5';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Content } = Layout;

const RecruitmentRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  // Lấy danh sách phòng ban và trạng thái duy nhất từ requests
  const departments = [...new Set(requests.map(request => request.department))];
  const statuses = [...new Set(requests.map(request => request.status))];

  // Lọc requests dựa trên các bộ lọc đã chọn
  const filteredRequests = requests.filter(request => {
    const departmentMatch = selectedDepartments.length === 0 || selectedDepartments.includes(request.department);
    const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(request.status);
    return departmentMatch && statusMatch;
  });

  // Reset bộ lọc về mặc định
  const resetFilters = () => {
    setSelectedDepartments([]);
    setSelectedStatuses([]);
  };

  // Xử lý thay đổi bộ lọc phòng ban
  const handleDepartmentChange = (department) => {
    setSelectedDepartments(prev => {
      if (prev.includes(department)) {
        return prev.filter(d => d !== department);
      } else {
        return [...prev, department];
      }
    });
  };

  // Xử lý thay đổi bộ lọc trạng thái
  const handleStatusChange = (status) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:8000/api/applications', {
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

  const handleCheckboxChange = (requestId) => {
    setSelectedRequests(prev => {
      if (prev.includes(requestId)) {
        return prev.filter(id => id !== requestId);
      } else {
        return [...prev, requestId];
      }
    });
  };

  const handleDelete = async () => {
    if (selectedRequests.length === 0) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await Promise.all(
        selectedRequests.map(requestId =>
          axios.delete(`http://localhost:8000/api/applications/${requestId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        )
      );

      setRequests(prev => prev.filter(request => !selectedRequests.includes(request._id)));
      setSelectedRequests([]);
      Modal.success({
        title: 'Thành công',
        content: 'Đã xóa yêu cầu tuyển dụng thành công',
      });
    } catch (error) {
      console.error('Error deleting requests:', error);
      Modal.error({
        title: 'Lỗi',
        content: 'Có lỗi xảy ra khi xóa yêu cầu',
      });
    }
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

  // Tính toán số trang dựa trên requests đã lọc
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  // Tạo mảng số trang
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} - ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <Layout style={{ marginLeft: 282 }}>
        <Content style={{ margin: '80px 16px 24px', minHeight: 280, display: 'flex', flexDirection: 'column' }}>
          {/* Header Actions - Outside of white container */}
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button className="flex items-center gap-2 bg-[#8D75F5] text-white px-4 py-2 rounded hover:bg-[#7152F3]" onClick={() => navigate('create')}>
                  <FaPlus size={16} />
                  <span>Mới</span>
                </button>
              </div>
              <div className="flex gap-2">
                <button 
                  className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-[10px] ${
                    selectedRequests.length > 0 
                      ? 'hover:bg-red-500 hover:text-white hover:border-red-500' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => selectedRequests.length > 0 && setIsDeleteModalVisible(true)}
                  disabled={selectedRequests.length === 0}
                >
                  <FaTrash size={14} />
                  <span>Xóa</span>
                </button>
                <button 
                  className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-[10px] hover:border-[#8D75F5] hover:text-[#8D75F5] ${
                    showFilter ? 'border-[#8D75F5] text-[#8D75F5]' : ''
                  }`}
                  onClick={() => setShowFilter(!showFilter)}
                >
                  <FaFilter size={14} />
                  <span>Bộ lọc</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilter && (
            <div className="mb-4 bg-white p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Bộ lọc</h3>
                <button 
                  className="text-sm text-gray-500 hover:text-gray-700"
                  onClick={resetFilters}
                >
                  Đặt lại
                </button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Phòng</h4>
                  <div className="space-y-2">
                    {departments.map(department => (
                      <label key={department} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedDepartments.includes(department)}
                          onChange={() => handleDepartmentChange(department)}
                          className="rounded border-gray-300"
                        />
                        <span>{department}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Trạng thái</h4>
                  <div className="space-y-2">
                    {statuses.map(status => (
                      <label key={status} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedStatuses.includes(status)}
                          onChange={() => handleStatusChange(status)}
                          className="rounded border-gray-300"
                        />
                        <span>{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm flex-1 flex flex-col">
            {/* Table Container - Removed fixed height */}
            <div className="flex-1">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="w-12 p-4 sticky top-0 bg-[#F9FAFB]">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        checked={selectedRequests.length === currentRequests.length}
                        onChange={() => {
                          if (selectedRequests.length === currentRequests.length) {
                            setSelectedRequests([]);
                          } else {
                            setSelectedRequests(currentRequests.map(r => r._id));
                          }
                        }}
                      />
                    </th>
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
                  {currentRequests.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="p-4 text-center text-gray-500">
                        Không có yêu cầu tuyển dụng nào
                      </td>
                    </tr>
                  ) : (
                    currentRequests.map((request, index) => (
                      <tr 
                        key={request._id} 
                        className="border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          if (request.status === 'Đã nộp') {
                            navigate(`/hr/recruitment-requests/${request._id}/edit`);
                          } else {
                            navigate(`/hr/recruitment-requests/${request._id}`);
                          }
                        }}
                      >
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300"
                            checked={selectedRequests.includes(request._id)}
                            onChange={() => handleCheckboxChange(request._id)}
                          />
                        </td>
                        <td className="p-4 text-sm" onClick={(e) => e.stopPropagation()}>
                          {startIndex + index + 1}
                        </td>
                        <td className="p-4 text-sm">
                          {request.userId?.fullName || request.requester?.fullName || 'N/A'}
                        </td>
                        <td className="p-4 text-sm">
                          {request.userId?.fullName || request.requester?.fullName || 'N/A'}
                        </td>
                        <td className="p-4 text-sm">{request.position}</td>
                        <td className="p-4 text-sm">{request.quantity}</td>
                        <td className="p-4 text-sm">{request.department}</td>
                        <td className="p-4 text-sm">
                          {request.createdAt ? formatDate(request.createdAt) : 'N/A'}
                        </td>
                        <td className="p-4">
                          <span className={getStatusColor(request.status)}>{request.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
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

      {/* Delete Confirmation Modal */}
      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p>Bạn có chắc chắn muốn xóa {selectedRequests.length} yêu cầu tuyển dụng đã chọn?</p>
      </Modal>
    </Layout>
  );
};

export default RecruitmentRequests;