import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input, Select, message } from 'antd';
import { IoCloseCircleOutline } from 'react-icons/io5';
import { MdKeyboardArrowRight } from 'react-icons/md';
import axios from 'axios';

const { TextArea } = Input;

const EditRecruitmentRequestDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    department: '',
    position: '',
    quantity: 1,
    reason: 'Tuyển do thiếu nhân sự',
    budget: 'Đạt chuẩn',
    jobDescription: '',
    requirements: '',
    benefits: '',
    mainLocation: '',
    otherLocations: [],
    status: '',
    date: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState([]);

  // Mapping cho các địa điểm
  const locationMapping = {
    'hochiminh': 'Hồ Chí Minh',
    'hanoi': 'Hà Nội',
    'danang': 'Đà Nẵng'
  };

  const departments = [
    { value: 'Kế toán', label: 'Kế toán' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'IT', label: 'IT' },
    { value: 'Nhân sự', label: 'Nhân sự' },
    { value: 'Kinh doanh', label: 'Kinh doanh' }
  ];

  const fetchRequestDetail = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Vui lòng đăng nhập để thực hiện chức năng này');
        navigate('/login');
        return;
      }

      const response = await axios.get(`http://localhost:8000/api/applications/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch user data if we have userId
      if (response.data.userId) {
        try {
          const userResponse = await axios.get(`http://localhost:8000/api/users/${response.data.userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          response.data.requester = userResponse.data;
        } catch (userError) {
          console.error('Error fetching user data:', userError);
        }
      }

      // Format date if it exists
      if (response.data.date) {
        response.data.date = new Date(response.data.date).toLocaleDateString('vi-VN');
      }

      // Set selected locations
      const locations = [];
      if (response.data.mainLocation) {
        locations.push(response.data.mainLocation);
      }
      if (response.data.otherLocations && response.data.otherLocations.length > 0) {
        locations.push(...response.data.otherLocations);
      }
      setSelectedLocations(locations);

      setFormData(response.data);
      setCanEdit(response.data.status === 'Đã nộp');
    } catch (error) {
      console.error('Error fetching request detail:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
        navigate('/login');
      } else {
        message.error('Có lỗi xảy ra khi tải thông tin phiếu tuyển dụng');
      }
    }
  };

  useEffect(() => {
    fetchRequestDetail();
  }, [id, navigate]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchRequestDetail(); // Reset form data
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Vui lòng đăng nhập để thực hiện chức năng này');
        navigate('/login');
        return;
      }

      await axios.put(`http://localhost:8000/api/applications/${id}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      message.success('Cập nhật thông tin thành công');
      setIsEditing(false);
      fetchRequestDetail(); // Refresh data
    } catch (error) {
      console.error('Error updating request:', error);
      message.error('Có lỗi xảy ra khi cập nhật thông tin');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (locationId) => {
    setSelectedLocations(prev => {
      const newLocations = prev.includes(locationId) 
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId];
      
      // Update formData
      const mainLocation = newLocations[0] || '';
      const otherLocations = newLocations.slice(1);
      setFormData(prev => ({
        ...prev,
        mainLocation,
        otherLocations
      }));
      
      return newLocations;
    });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 ml-[282px]">
      <div className="max-w-[1200px] mx-auto bg-white rounded-lg p-4 md:p-6 mt-[80px]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[20px] font-medium text-[#1A1A1A] mb-4">Chi tiết phiếu tuyển dụng</h1>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex gap-2 w-full md:w-auto">
              {canEdit && !isEditing && (
                <button 
                  className="h-[36px] px-4 bg-[#7B61FF] text-white rounded-[6px] text-sm font-medium hover:bg-[#6B4EFF] flex items-center gap-2"
                  onClick={handleEdit}
                >
                  Chỉnh sửa
                </button>
              )}
              {isEditing && (
                <>
                  <button 
                    className="h-[36px] px-4 bg-white text-[#7B61FF] border border-[#7B61FF] rounded-[6px] text-sm font-medium hover:bg-[#F5F2FF] flex items-center gap-2"
                    onClick={handleCancel}
                  >
                    Hủy
                  </button>
                  <button 
                    className="h-[36px] px-4 bg-[#7B61FF] text-white rounded-[6px] text-sm font-medium hover:bg-[#6B4EFF] flex items-center gap-2"
                    onClick={handleSave}
                  >
                    Lưu
                  </button>
                </>
              )}
            </div>

            {/* Progress Steps */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center">
                <span className={`text-sm border-b-2 pb-1 ${formData.status === 'Chờ nộp' ? 'text-[#7B61FF] border-[#7B61FF]' : 'text-[#A3A3A3] border-[#A3A3A3]'}`}>Chờ nộp</span>
              </div>
              <MdKeyboardArrowRight className="text-[#E0E0E0]" size={20} />
              <div className="flex items-center">
                <span className={`text-sm border-b-2 pb-1 ${formData.status === 'Đã nộp' ? 'text-[#7B61FF] border-[#7B61FF]' : 'text-[#A3A3A3] border-[#A3A3A3]'}`}>Đã nộp</span>
              </div>
              <MdKeyboardArrowRight className="text-[#E0E0E0]" size={20} />
              <div className="flex items-center">
                <span className={`text-sm border-b-2 pb-1 ${formData.status === 'Đang duyệt' ? 'text-[#7B61FF] border-[#7B61FF]' : 'text-[#A3A3A3] border-[#A3A3A3]'}`}>Đang duyệt</span>
              </div>
              <MdKeyboardArrowRight className="text-[#E0E0E0]" size={20} />
              <div className="flex items-center">
                <span className={`text-sm border-b-2 pb-1 ${formData.status === 'Đã duyệt' ? 'text-[#7B61FF] border-[#7B61FF]' : 'text-[#A3A3A3] border-[#A3A3A3]'}`}>Đã duyệt</span>
              </div>
              <MdKeyboardArrowRight className="text-[#E0E0E0]" size={20} />
              <div className="flex items-center">
                <span className={`text-sm border-b-2 pb-1 ${formData.status === 'Từ chối' ? 'text-[#FF0000] border-[#FF0000]' : 'text-[#A3A3A3] border-[#A3A3A3]'}`}>Từ chối</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* THÔNG TIN CHUNG */}
          <div className="border border-[#E0E0E0] rounded-lg p-4">
            <h2 className="text-sm font-medium mb-4 text-[#1A1A1A]">THÔNG TIN CHUNG</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
              <div className="flex flex-col md:flex-row md:items-center">
                <label className="text-sm text-[#1A1A1A] w-full md:w-[120px] mb-2 md:mb-0 md:mr-4">
                  Nhân sự lập phiếu
                </label>
                <span className="text-sm text-[#1A1A1A]">
                  {formData.requester?.fullName || formData.userId?.fullName || 'N/A'}
                </span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center">
                <label className="text-sm text-[#1A1A1A] w-full md:w-[120px] mb-2 md:mb-0">
                  Phòng
                </label>
                {isEditing ? (
                  <Select
                    value={formData.department}
                    onChange={(value) => handleInputChange('department', value)}
                    className="w-[300px]"
                    options={departments}
                  />
                ) : (
                  <span className="text-sm text-[#1A1A1A]">{formData.department}</span>
                )}
              </div>
              <div className="flex flex-col md:flex-row md:items-center">
                <label className="text-sm text-[#1A1A1A] w-full md:w-[120px] mb-2 md:mb-0">
                  Vị trí
                </label>
                {isEditing ? (
                  <Input
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className="flex-1 border-0 border-b border-[#E0E0E0] rounded-none px-0 h-[36px] bg-transparent"
                  />
                ) : (
                  <span className="text-sm text-[#1A1A1A]">{formData.position}</span>
                )}
              </div>
            </div>
          </div>

          {/* THÔNG TIN YÊU CẦU TUYỂN DỤNG */}
          <div className="border border-[#E0E0E0] rounded-lg p-4">
            <h2 className="text-sm font-medium mb-4 text-[#1A1A1A]">THÔNG TIN YÊU CẦU TUYỂN DỤNG</h2>
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center">
                <label className="text-sm text-[#1A1A1A] w-full md:w-[120px] mb-2 md:mb-0">
                  Số lượng
                </label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                    className="w-full md:w-[300px] border-0 border-b border-[#E0E0E0] rounded-none px-0 h-[36px] bg-transparent"
                  />
                ) : (
                  <span className="text-sm text-[#1A1A1A]">{formData.quantity}</span>
                )}
              </div>
              <div>
                <label className="text-sm text-[#1A1A1A] inline-block w-[120px] align-top">
                  Nơi làm việc
                </label>
                {isEditing ? (
                  <div className="inline-block">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="hochiminh"
                          checked={selectedLocations.includes('hochiminh')}
                          onChange={() => handleLocationChange('hochiminh')}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="hochiminh" className="text-sm">Hồ Chí Minh</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="hanoi"
                          checked={selectedLocations.includes('hanoi')}
                          onChange={() => handleLocationChange('hanoi')}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="hanoi" className="text-sm">Hà Nội</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="danang"
                          checked={selectedLocations.includes('danang')}
                          onChange={() => handleLocationChange('danang')}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="danang" className="text-sm">Đà Nẵng</label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="inline-block">
                    <div className="flex gap-4">
                      {formData.mainLocation && (
                        <span className="text-sm">{locationMapping[formData.mainLocation] || formData.mainLocation}</span>
                      )}
                      {formData.otherLocations && formData.otherLocations.length > 0 && (
                        <span className="text-sm">, {formData.otherLocations.map(loc => locationMapping[loc] || loc).join(', ')}</span>
                      )}
                      {!formData.mainLocation && (!formData.otherLocations || formData.otherLocations.length === 0) && (
                        <span className="text-sm">Chưa cập nhật</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-[#1A1A1A] inline-flex items-center w-[120px] whitespace-nowrap mr-4">
                  Lý do tuyển dụng
                </label>
                {isEditing ? (
                  <div className="inline-block">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="reason1"
                          checked={formData.reason === 'Tuyển do thiếu nhân sự'}
                          onChange={(e) => handleInputChange('reason', e.target.checked ? 'Tuyển do thiếu nhân sự' : '')}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="reason1" className="text-sm">Tuyển do thiếu nhân sự</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="reason2"
                          checked={formData.reason === 'Tuyển thay thế'}
                          onChange={(e) => handleInputChange('reason', e.target.checked ? 'Tuyển thay thế' : '')}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="reason2" className="text-sm">Tuyển thay thế</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="reason3"
                          checked={formData.reason === 'Tuyển mới'}
                          onChange={(e) => handleInputChange('reason', e.target.checked ? 'Tuyển mới' : '')}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="reason3" className="text-sm">Tuyển mới</label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm">{formData.reason}</span>
                )}
              </div>
              <div>
                <label className="text-sm text-[#1A1A1A] inline-block w-[120px] align-top">
                  Quỹ tuyển dụng
                </label>
                {isEditing ? (
                  <div className="inline-block">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="budget1"
                          checked={formData.budget === 'Đạt chuẩn'}
                          onChange={(e) => handleInputChange('budget', e.target.checked ? 'Đạt chuẩn' : '')}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="budget1" className="text-sm">Đạt chuẩn</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="budget2"
                          checked={formData.budget === 'Vượt quỹ'}
                          onChange={(e) => handleInputChange('budget', e.target.checked ? 'Vượt quỹ' : '')}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="budget2" className="text-sm">Vượt quỹ</label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm">{formData.budget}</span>
                )}
              </div>
              {formData.budget === 'Vượt quỹ' && (
                <>
                  <div>
                    <label className="text-sm text-[#1A1A1A] inline-block w-[120px] align-top">
                      Lương hiện tại
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.currentSalary}
                        onChange={(e) => handleInputChange('currentSalary', e.target.value)}
                        className="w-[300px] border-0 border-b border-[#E0E0E0] rounded-none px-0 h-[36px] bg-transparent"
                      />
                    ) : (
                      <span className="text-sm">{formData.currentSalary || 'N/A'}</span>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-[#1A1A1A] inline-block w-[120px] align-top">
                      Lương vượt quỹ
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.overflowSalary}
                        onChange={(e) => handleInputChange('overflowSalary', e.target.value)}
                        className="w-[300px] border-0 border-b border-[#E0E0E0] rounded-none px-0 h-[36px] bg-transparent"
                      />
                    ) : (
                      <span className="text-sm">{formData.overflowSalary || 'N/A'}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* THÔNG TIN MÔ TẢ CÔNG VIỆC */}
          <div className="border border-[#E0E0E0] rounded-lg p-4">
            <h2 className="text-sm font-medium mb-4 text-[#1A1A1A]">THÔNG TIN MÔ TẢ CÔNG VIỆC</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-[#1A1A1A]">
                  1, Mô tả công việc
                </label>
                {isEditing ? (
                  <TextArea
                    value={formData.jobDescription}
                    onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                    rows={4}
                    className="w-full"
                  />
                ) : (
                  <div className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm bg-transparent">
                    {formData.jobDescription}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1 text-[#1A1A1A]">
                  2, Yêu cầu ứng viên
                </label>
                {isEditing ? (
                  <TextArea
                    value={formData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                    rows={4}
                    className="w-full"
                  />
                ) : (
                  <div className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm bg-transparent">
                    {formData.requirements}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1 text-[#1A1A1A]">
                  3, Quyền lợi
                </label>
                {isEditing ? (
                  <TextArea
                    value={formData.benefits}
                    onChange={(e) => handleInputChange('benefits', e.target.value)}
                    rows={4}
                    className="w-full"
                  />
                ) : (
                  <div className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm bg-transparent">
                    {formData.benefits}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* THÔNG TIN PHÊ DUYỆT */}
          <div className="border border-[#E0E0E0] rounded-lg p-4">
            <h2 className="text-sm font-medium mb-4 text-[#1A1A1A]">THÔNG TIN PHÊ DUYỆT</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1 text-[#1A1A1A]">Người phê duyệt</label>
                <div className="space-y-2">
                  <div className="h-[36px] px-3 flex items-center border border-[#E0E0E0] rounded-lg text-sm">
                    Người tạo yêu cầu tuyển dụng
                  </div>
                  <div className="h-[36px] px-3 flex items-center border border-[#E0E0E0] rounded-lg text-sm">
                    Tổng Giám Đốc
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1 text-[#1A1A1A]">Trạng thái phê duyệt</label>
                <div className="h-auto min-h-[116px] flex flex-col items-center justify-center border border-[#E0E0E0] rounded-lg p-3">
                  <span className="text-sm">{formData.status}</span>
                  {formData.status === 'Từ chối' && formData.rejectReason && (
                    <div className="mt-2 text-sm text-[#D42A2A] text-center">
                      Lý do: {formData.rejectReason}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1 text-[#1A1A1A]">Thời gian phê duyệt</label>
                <div className="h-[116px] flex items-center justify-center border border-[#E0E0E0] rounded-lg">
                  <span className="text-sm">{formData.date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRecruitmentRequestDetail; 