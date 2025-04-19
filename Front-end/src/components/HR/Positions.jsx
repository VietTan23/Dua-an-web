import React, { useState, useEffect } from 'react';
import { Layout, Input, Select, message, Dropdown, Modal } from 'antd';
import { SearchOutlined, MoreOutlined, UserOutlined, BarChartOutlined, RiseOutlined } from '@ant-design/icons';
import { FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Content } = Layout;
const API_BASE_URL = 'https://backendhr-9ti5.onrender.com/api';

const Positions = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState(null);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchPositions();
  }, [currentPage, searchQuery, typeFilter, modeFilter]);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...(searchQuery && { search: searchQuery }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(modeFilter !== 'all' && { mode: modeFilter })
      });

      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Vui lòng đăng nhập lại');
        return;
      }

      // Lấy danh sách positions
      const positionsResponse = await axios.get(`${API_BASE_URL}/positions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Lấy danh sách applications đã duyệt
      const applicationsResponse = await axios.get(`${API_BASE_URL}/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (positionsResponse.status === 200) {
        const positions = positionsResponse.data.data || [];
        const applications = applicationsResponse.data.applications || [];

        // Map thông tin địa điểm từ applications vào positions
        const positionsWithLocations = positions.map(position => {
          const matchingApplication = Array.isArray(applications) ? applications.find(app => 
            app.position === position.title && app.department === position.department
          ) : null;

          return {
            ...position,
            mainLocation: matchingApplication?.mainLocation || '',
            otherLocations: matchingApplication?.otherLocations || []
          };
        });

        setPositions(positionsWithLocations);
        setTotalPages(positionsResponse.data.pagination.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      
      if (error.response) {
        message.error(error.response.data?.message || 'Có lỗi xảy ra khi tải dữ liệu từ server');
      } else if (error.request) {
        message.error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau');
      } else {
        message.error('Có lỗi xảy ra. Vui lòng thử lại sau');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Còn tuyển':
        return 'bg-[#E7F6EC] text-[#12B76A] border border-[#12B76A]';
      case 'Nhập':
        return 'bg-[#FFF3E8] text-[#F79009] border border-[#F79009]';
      case 'Tạm dừng':
        return 'bg-[#FEE4E2] text-[#F04438] border border-[#F04438]';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handlePositionClick = (position) => {
    if (selectedPosition?._id === position._id) {
      setSelectedPosition(null);
    } else {
      setSelectedPosition(position);
    }
  };

  const handleEdit = (position) => {
    navigate(`/positions/edit/${position._id}`, { state: { position } });
  };

  const handleDelete = async () => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/positions/${positionToDelete._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.status === 200) {
        message.success('Xóa vị trí thành công');
        fetchPositions();
        setDeleteModalVisible(false);
        setPositionToDelete(null);
        if (selectedPosition?._id === positionToDelete._id) {
          setSelectedPosition(null);
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa vị trí');
      console.error('Error deleting position:', error);
    }
  };

  const getDropdownItems = (position) => ({
    items: [
      {
        key: '1',
        label: 'Sửa vị trí',
        onClick: () => handleEdit(position)
      },
      {
        key: '2',
        label: 'Xóa vị trí',
        danger: true,
        onClick: () => {
          setPositionToDelete(position);
          setDeleteModalVisible(true);
        }
      }
    ]
  });

  const handleCardClick = (e, position) => {
    if (e.target.closest('.action-button') || e.target.closest('.applicants-count')) {
      return;
    }
    handlePositionClick(position);
  };

  const shortenId = (id) => {
    if (!id) return '';
    return id.substring(0, 6);
  };

  // Mapping địa chỉ chi tiết
  const getFullAddress = (mainLocation, otherLocations = []) => {
    const addressMapping = {
      'hanoi': 'Hà Nội - Tầng 7 tháp A tòa Sông Đà, đường Phạm Hùng, quận Nam Từ Liêm, Hà Nội',
      'hochiminh': 'HCM - Tầng 12, Tòa nhà Đảm Bảo An Toàn Hàng Hải phía Nam Số 42 đường Tự Cường, phường 4, Tân Bình, TP. Hồ Chí Minh',
      'danang': 'Đà Nẵng - Tầng 4, tòa nhà Ricco, số 363 Nguyễn Hữu Thọ, phường Khuê Trung, Quận Cẩm Lệ, Đà Nẵng'
    };

    const addresses = [];
    if (mainLocation && addressMapping[mainLocation]) {
      addresses.push(addressMapping[mainLocation]);
    }
    if (otherLocations && otherLocations.length > 0) {
      otherLocations.forEach(loc => {
        if (addressMapping[loc]) {
          addresses.push(addressMapping[loc]);
        }
      });
    }
    return addresses;
  };

  const handleDownloadJD = async (format) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Vui lòng đăng nhập lại');
        return;
      }

      // Hiển thị thông báo đang tải
      const loadingMessage = message.loading(`Đang tải xuống JD định dạng ${format.toUpperCase()}...`, 0);

      try {
        // Tạo URL với token trong query parameter thay vì header
        const url = `${API_BASE_URL}/positions/${selectedPosition._id}/download-jd?format=${format}&token=${token}`;
        
        // Tạo thẻ a để tải xuống
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${selectedPosition.title.replace(/\s+/g, '_')}_JD.${format}`);
        
        // Thêm vào DOM, click và xóa
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Hiển thị thông báo thành công
        loadingMessage();
        message.success(`Đã tải xuống JD định dạng ${format.toUpperCase()}`);
      } catch (fetchError) {
        // Xử lý lỗi fetch
        loadingMessage();
        console.error('Error downloading JD:', fetchError);
        
        // Hiển thị thông báo lỗi cụ thể cho DOCX
        if (format === 'docx') {
          message.error('Không thể tải xuống file DOCX. Vui lòng thử lại sau hoặc liên hệ quản trị viên.');
        } else {
          message.error('Có lỗi xảy ra khi tải xuống JD');
        }
      }
    } catch (error) {
      console.error('Error in handleDownloadJD:', error);
      message.error('Có lỗi xảy ra khi tải xuống JD');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <Layout style={{ marginLeft: 282 }}>
        <Content style={{ margin: '80px 16px 24px', minHeight: 280, maxHeight: 'calc(100vh - 104px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Search and Filters */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-[400px]">
                <Input
                  placeholder="Tìm vị trí tuyển dụng"
                  prefix={<SearchOutlined className="text-gray-400" />}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={typeFilter}
                onChange={setTypeFilter}
                style={{ width: 120 }}
                options={[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'Full-time', label: 'Full-time' },
                  { value: 'Part-time', label: 'Part-time' },
                  { value: 'Contract', label: 'Contract' }
                ]}
                className="h-10"
              />
              <Select
                value={modeFilter}
                onChange={setModeFilter}
                style={{ width: 120 }}
                options={[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'On-site', label: 'On-site' },
                  { value: 'Remote', label: 'Remote' },
                  { value: 'Hybrid', label: 'Hybrid' }
                ]}
                className="h-10"
              />
            </div>
            <button
              onClick={() => navigate('/positions/create')}
              className="flex items-center gap-2 px-4 py-2 bg-[#DAF374] text-black rounded-lg hover:bg-[#c5dd60] transition-colors"
            >
              <FaPlus size={16} />
              <span>Thêm mới</span>
            </button>
          </div>

          <div className="flex gap-6 overflow-hidden">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7B61FF]"></div>
              </div>
            ) : (
              <div className={`${selectedPosition ? 'w-[40%]' : 'flex-1'} overflow-y-auto pb-6 ${selectedPosition ? 'pr-4' : ''}`}>
                <div className={`${
                  selectedPosition 
                    ? 'space-y-4' 
                    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                }`}>
                  {positions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-4 text-center text-gray-500">
                        Không có vị trí tuyển dụng nào
                      </td>
                    </tr>
                  ) : (
                    positions.map((position) => (
                      <div
                        key={position._id}
                        className={`bg-white rounded-[10px] p-4 border transition-colors cursor-pointer relative ${
                          selectedPosition ? 'border-[#7B61FF]' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={(e) => handleCardClick(e, position)}
                      >
                        {/* Status Badge */}
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(position.status)}`}>
                            {position.status}
                          </span>
                        </div>

                        {selectedPosition ? (
                          // Layout khi có position được chọn - áp dụng cho tất cả card
                          <>
                            {/* Avatar and Info */}
                            <div className="flex items-start gap-3 mb-4">
                              <div className="w-10 h-10 bg-[#F4F1FE] rounded-lg flex items-center justify-center">
                                <span className="text-[#7B61FF] text-lg font-medium">
                                  {position.title.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-1">
                                  ID YCTD: {shortenId(position._id)}
                                </div>
                                <h3 className="text-base font-medium text-gray-900 mb-1">
                                  {position.title}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {position.department}
                                </p>
                              </div>
                              <Dropdown
                                menu={getDropdownItems(position)}
                                trigger={['click']}
                                placement="bottomRight"
                              >
                                <button 
                                  className="text-gray-400 hover:text-gray-600 p-1 bg-white"
                                  onClick={(e) => e.stopPropagation()} 
                                >
                                  <MoreOutlined />
                                </button>
                              </Dropdown>
                            </div>

                            {/* Tags Row */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-full">
                                <BarChartOutlined className="text-gray-400" />
                                <span className="text-xs text-gray-600">{position.level}</span>
                              </div>
                              <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-full">
                                <RiseOutlined className="text-gray-400" />
                                <span className="text-xs text-gray-600">{position.experience}</span>
                              </div>
                              <span className="px-2 py-1 bg-gray-50 rounded-full text-xs text-gray-600">
                                {position.type}
                              </span>
                              <span className="px-2 py-1 bg-gray-50 rounded-full text-xs text-gray-600">
                                {position.mode}
                              </span>
                            </div>
                          </>
                        ) : (
                          // Layout mặc định khi không có position nào được chọn
                          <>
                            {/* ID */}
                            <div className="text-xs text-gray-500 mb-2">
                              ID YCTD: {shortenId(position._id)}
                            </div>

                            {/* Title and Department */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-base font-medium text-gray-900 mb-1">
                                  {position.title}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {position.department}
                                </p>
                              </div>
                              <Dropdown
                                menu={getDropdownItems(position)}
                                trigger={['click']}
                                placement="bottomRight"
                              >
                                <button 
                                  className="text-gray-400 hover:text-gray-600 p-1 bg-white"
                                  onClick={(e) => e.stopPropagation()} 
                                >
                                  <MoreOutlined />
                                </button>
                              </Dropdown>
                            </div>

                            {/* Level and Experience */}
                            <div className="flex flex-col gap-2 mb-4">
                              <div className="flex items-center gap-2">
                                <BarChartOutlined className="text-gray-400" />
                                <span className="text-sm text-gray-600">{position.level}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <RiseOutlined className="text-gray-400" />
                                <span className="text-sm text-gray-600">{position.experience}</span>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Type and Mode */}
                        <div className="flex gap-2 mb-4">
                          <span className="px-2 py-1 bg-gray-50 rounded-full text-xs text-gray-600">
                            {position.type}
                          </span>
                          <span className="px-2 py-1 bg-gray-50 rounded-full text-xs text-gray-600">
                            {position.mode}
                          </span>
                        </div>

                        {/* Salary and Applicants */}
                        <div className="flex flex-col gap-2">
                          <div className="text-[#7B61FF] font-medium">đ {position.salary}</div>
                          <div 
                            className="text-sm text-gray-500 cursor-pointer hover:text-[#7B61FF] applicants-count flex items-center gap-1"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate(`/positions/${position._id}/candidates`);
                            }}
                          >
                            <UserOutlined className="text-gray-400" />
                            {position.applicants} ứng viên
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Position Detail Panel */}
            {selectedPosition && (
              <div className="w-[60%] bg-white rounded-lg p-6 overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-xs bg-[#F4F1FE] text-[#7B61FF] px-2 py-1 rounded-md inline-block mb-2">
                      ID VTTD: {selectedPosition._id}
                    </div>
                    <h2 className="text-xl font-semibold mb-1">{selectedPosition.title}</h2>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="px-3 py-1 bg-[#F4F1FE] text-[#7B61FF] rounded-lg text-sm flex items-center gap-1"
                      onClick={() => handleDownloadJD('docx')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      DOCX
                    </button>
                    <button 
                      className="px-3 py-1 bg-[#F4F1FE] text-[#7B61FF] rounded-lg text-sm flex items-center gap-1"
                      onClick={() => handleDownloadJD('pdf')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      PDF
                    </button>
                    <button className="px-3 py-1 bg-[#DAF374] text-black rounded-lg text-sm">
                      Còn tuyển
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Level</div>
                    <div className="font-medium">{selectedPosition.level}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Kinh nghiệm</div>
                    <div className="font-medium">{selectedPosition.experience}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Hình thức làm việc</div>
                    <div className="font-medium">{selectedPosition.type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Mô hình làm việc</div>
                    <div className="font-medium">{selectedPosition.mode}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Mức lương</div>
                    <div className="font-medium text-[#7B61FF]">đ {selectedPosition.salary}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Địa điểm làm việc</div>
                    <div className="font-medium">
                      {getFullAddress(selectedPosition.mainLocation, selectedPosition.otherLocations).map((address, index) => (
                        <div key={index} className="mb-2">{address}</div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Mô tả công việc</h3>
                    <div className="text-sm whitespace-pre-line">{selectedPosition.description}</div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Yêu cầu ứng viên</h3>
                    <div className="text-sm whitespace-pre-line">{selectedPosition.requirements}</div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Quyền lợi</h3>
                    <div className="text-sm whitespace-pre-line">{selectedPosition.benefits}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4 px-2 bg-white p-4 rounded-lg">
            <div className="text-sm text-gray-600">
              Hiển thị {positions.length} vị trí
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-black bg-white text-black hover:bg-gray-50 disabled:opacity-50"
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded border border-black ${
                    page === currentPage
                      ? 'bg-[#DAF374] text-black border-[#DAF374]'
                      : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-black bg-white text-black hover:bg-gray-50 disabled:opacity-50"
              >
                →
              </button>
            </div>
          </div>
        </Content>
      </Layout>

      <Modal
        title={<div className="text-lg">Xoá vị trí tuyển dụng</div>}
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setPositionToDelete(null);
        }}
        okText="Xoá"
        cancelText="Huỷ"
        okButtonProps={{ 
          danger: true,
          className: 'bg-[#EF4444] hover:bg-[#DC2626] text-white' 
        }}
        cancelButtonProps={{
          className: 'border-gray-200 text-gray-700'
        }}
        className="custom-delete-modal"
      >
        <p className="text-base mb-2">Bạn có chắc muốn xoá vị trí này không?</p>
        {positionToDelete && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F4F1FE] text-[#7B61FF] rounded-lg flex items-center justify-center text-lg font-medium">
                {positionToDelete.title.charAt(0)}
              </div>
              <div>
                <h4 className="font-medium text-[#1A1A1A]">{positionToDelete.title}</h4>
                <p className="text-sm text-gray-500">{positionToDelete.department}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Positions; 