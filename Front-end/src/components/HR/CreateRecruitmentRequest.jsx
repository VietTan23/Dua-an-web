import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, message } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { IoCloseCircleOutline } from 'react-icons/io5';
import { MdKeyboardArrowRight } from 'react-icons/md';
import axios from 'axios';

const CreateRecruitmentRequest = () => {
  const navigate = useNavigate();
  const [selectedMainLocation, setSelectedMainLocation] = useState('');
  const [formData, setFormData] = useState({
    department: '',
    position: '',
    quantity: 1,
    reason: 'Tuyển do thiếu nhân sự',
    budget: 'Đạt chuẩn',
    jobDescription: '',
    requirements: '',
    benefits: ''
  });

  const mainLocations = [
    { id: 'hochiminh', name: 'Hồ Chí Minh' },
    { id: 'hanoi', name: 'Hà Nội' },
    { id: 'danang', name: 'Đà Nẵng' }
  ];

  // Kiểm tra token ngay khi component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('Vui lòng đăng nhập để thực hiện chức năng này');
      navigate('/login');
    }
  }, [navigate]);

  const handleMainLocationChange = (locationId) => {
    setSelectedMainLocation(locationId);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Vui lòng đăng nhập để thực hiện chức năng này');
        navigate('/login');
        return;
      }

      // Validate required fields
      if (!formData.department || !formData.position || !formData.quantity || !selectedMainLocation) {
        message.error('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      // Tạo instance của axios với cấu hình mặc định
      const api = axios.create({
        baseURL: 'http://localhost:5000',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Xác định trạng thái dựa trên quỹ tuyển dụng
      const status = formData.budget === 'Đạt chuẩn' ? 'Đã duyệt' : 'Đã nộp';

      const response = await api.post('/api/applications', {
        department: formData.department,
        position: formData.position,
        quantity: parseInt(formData.quantity),
        mainLocation: selectedMainLocation,
        reason: formData.reason,
        budget: formData.budget,
        jobDescription: formData.jobDescription,
        requirements: formData.requirements,
        benefits: formData.benefits,
        status: status
      });

      if (response.data) {
        message.success('Yêu cầu tuyển dụng đã được gửi thành công!');
        navigate('/hr/recruitment-requests');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
        navigate('/login');
      } else {
        message.error('Có lỗi xảy ra khi gửi yêu cầu tuyển dụng.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 ml-[282px]">
      <div className="max-w-[1200px] mx-auto bg-white rounded-lg p-4 md:p-6 mt-[80px]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[20px] font-medium text-[#1A1A1A] mb-4">Khởi tạo yêu cầu tuyển dụng</h1>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                className="h-[36px] px-4 bg-[#7B61FF] text-white rounded-[6px] text-sm font-medium hover:bg-[#6B4EFF] flex items-center gap-2"
                onClick={handleSubmit}
              >
                <CloudUploadOutlined />
                Gửi duyệt
              </button>
              <button 
                className="h-[36px] px-4 border border-[#D92D20] text-[#D92D20] bg-white rounded-[6px] text-sm font-medium hover:bg-red-50 flex items-center gap-2"
                onClick={() => navigate('/hr/recruitment-requests')}
              >
                <IoCloseCircleOutline size={16} />
                Hủy
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center">
                <span className="text-[#7B61FF] text-sm border-b-2 border-[#7B61FF] pb-1">Chờ nộp</span>
              </div>
              <MdKeyboardArrowRight className="text-[#E0E0E0]" size={20} />
              <div className="flex items-center">
                <span className="text-[#A3A3A3] text-sm">Đã nộp</span>
              </div>
              <MdKeyboardArrowRight className="text-[#E0E0E0]" size={20} />
              <div className="flex items-center">
                <span className="text-[#A3A3A3] text-sm">Đang duyệt</span>
              </div>
              <MdKeyboardArrowRight className="text-[#E0E0E0]" size={20} />
              <div className="flex items-center">
                <span className="text-[#A3A3A3] text-sm">Đã duyệt</span>
              </div>
              <MdKeyboardArrowRight className="text-[#E0E0E0]" size={20} />
              <div className="flex items-center">
                <span className="text-[#A3A3A3] text-sm">Từ chối</span>
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
                <span className="text-sm text-[#1A1A1A]">Trưởng phòng</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center">
                <label className="text-sm text-[#1A1A1A] w-full md:w-[120px] mb-2 md:mb-0">
                  Phòng
                </label>
                <Input
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="Chọn bộ phận/phòng ban yêu cầu tuyển dụng"
                  className="flex-1 border-0 border-b border-[#E0E0E0] rounded-none px-0 h-[36px] hover:border-b-[#7B61FF] focus:border-b-[#7B61FF]"
                />
              </div>
              <div className="flex flex-col md:flex-row md:items-center">
                <label className="text-sm text-[#1A1A1A] w-full md:w-[120px] mb-2 md:mb-0">
                  Vị trí <span className="text-[#D92D20]">*</span>
                </label>
                <Input
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="Chọn vị trí cần tuyển dụng"
                  className="flex-1 border-0 border-b border-[#E0E0E0] rounded-none px-0 h-[36px] hover:border-b-[#7B61FF] focus:border-b-[#7B61FF]"
                />
              </div>
            </div>
          </div>

          {/* THÔNG TIN YÊU CẦU TUYỂN DỤNG */}
          <div className="border border-[#E0E0E0] rounded-lg p-4">
            <h2 className="text-sm font-medium mb-4 text-[#1A1A1A]">THÔNG TIN YÊU CẦU TUYỂN DỤNG</h2>
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center">
                <label className="text-sm text-[#1A1A1A] w-full md:w-[120px] mb-2 md:mb-0">
                  Số lượng <span className="text-[#D92D20]">*</span>
                </label>
                <Input
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="Nhập thông tin số lượng cần tuyển"
                  className="w-full md:w-[300px] border-0 border-b border-[#E0E0E0] rounded-none px-0 h-[36px] hover:border-b-[#7B61FF] focus:border-b-[#7B61FF]"
                />
              </div>
              <div>
                <label className="text-sm text-[#1A1A1A] inline-block w-[120px] align-top">
                  Nơi làm việc <span className="text-[#D92D20]">*</span>
                </label>
                <div className="inline-block">
                  <div className="flex gap-4">
                    {mainLocations.map((location) => (
                      <label
                        key={location.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="mainLocation"
                          checked={selectedMainLocation === location.id}
                          onChange={() => handleMainLocationChange(location.id)}
                          className="text-[#8D75F5] focus:ring-[#8D75F5]"
                        />
                        <span className="text-sm">{location.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm text-[#1A1A1A] inline-flex items-center w-[120px] whitespace-nowrap mr-4">
                  Lý do tuyển dụng
                  <span className="text-[#D92D20]">*</span>
                </label>
                <div className="inline-flex gap-6">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="reason"
                      value="Tuyển do thiếu nhân sự"
                      checked={formData.reason === "Tuyển do thiếu nhân sự"}
                      onChange={handleInputChange}
                      className="text-[#7B61FF]" 
                    />
                    <span className="text-sm">Tuyển do thiếu nhân sự</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="reason"
                      value="Tuyển do mở rộng quy mô"
                      checked={formData.reason === "Tuyển do mở rộng quy mô"}
                      onChange={handleInputChange}
                      className="text-[#7B61FF]" 
                    />
                    <span className="text-sm">Tuyển do mở rộng quy mô</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm text-[#1A1A1A] inline-block w-[120px] align-top">
                  Quỹ tuyển dụng <span className="text-[#D92D20]">*</span>
                </label>
                <div className="inline-flex gap-6">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="budget"
                      value="Đạt chuẩn"
                      checked={formData.budget === "Đạt chuẩn"}
                      onChange={handleInputChange}
                      className="text-[#7B61FF]" 
                    />
                    <span className="text-sm">Đạt chuẩn</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="budget"
                      value="Vượt quỹ"
                      checked={formData.budget === "Vượt quỹ"}
                      onChange={handleInputChange}
                      className="text-[#7B61FF]" 
                    />
                    <span className="text-sm">Vượt quỹ</span>
                  </label>
                </div>
              </div>
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
                <textarea
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleInputChange}
                  placeholder="Nhập nội dung mô tả"
                  rows={4}
                  className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#7B61FF] text-sm"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm mb-1 text-[#1A1A1A]">
                  2, Yêu cầu ứng viên
                </label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  placeholder="Nhập nội dung yêu cầu"
                  rows={4}
                  className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#7B61FF] text-sm"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm mb-1 text-[#1A1A1A]">
                  3, Quyền lợi
                </label>
                <textarea
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleInputChange}
                  placeholder="Nhập nội dung quyền lợi"
                  rows={4}
                  className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#7B61FF] text-sm"
                ></textarea>
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
                    Trưởng phòng
                  </div>
                  <div className="h-[36px] px-3 flex items-center border border-[#E0E0E0] rounded-lg text-sm">
                    Giám đốc kinh doanh
                  </div>
                  <div className="h-[36px] px-3 flex items-center border border-[#E0E0E0] rounded-lg text-sm">
                    Tổng Giám Đốc
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1 text-[#1A1A1A]">Trạng thái phê duyệt</label>
                <div className="h-[116px] flex items-center justify-center border border-[#E0E0E0] rounded-lg">
                  <span className="text-[#A3A3A3] text-sm">Chưa phê duyệt</span>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1 text-[#1A1A1A]">Thời gian phê duyệt</label>
                <div className="h-[116px] flex items-center justify-center border border-[#E0E0E0] rounded-lg">
                  <span className="text-[#A3A3A3] text-sm">Chưa phê duyệt</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRecruitmentRequest; 