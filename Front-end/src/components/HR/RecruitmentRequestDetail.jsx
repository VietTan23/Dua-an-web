import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input, message } from 'antd';
import { IoCloseCircleOutline } from 'react-icons/io5';
import { MdKeyboardArrowRight } from 'react-icons/md';
import axios from 'axios';

const RecruitmentRequestDetail = () => {
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

  // Mapping cho các địa điểm
  const locationMapping = {
    'hochiminh': 'Hồ Chí Minh',
    'hanoi': 'Hà Nội',
    'danang': 'Đà Nẵng'
  };

  useEffect(() => {
    const fetchRequestDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          message.error('Vui lòng đăng nhập để thực hiện chức năng này');
          navigate('/login');
          return;
        }

        const response = await axios.get(`https://backendhr-9ti5.onrender.com/api/applications/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Fetch user data if we have userId
        if (response.data.userId) {
          try {
            const userResponse = await axios.get(`https://backendhr-9ti5.onrender.com/api/users/${response.data.userId}`, {
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

        setFormData(response.data);
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

    fetchRequestDetail();
  }, [id, navigate]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 ml-[282px]">
      <div className="max-w-[1200px] mx-auto bg-white rounded-lg p-4 md:p-6 mt-[80px]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[20px] font-medium text-[#1A1A1A] mb-4">Chi tiết yêu cầu tuyển dụng</h1>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Progress Steps */}
            <div className="flex flex-wrap items-center gap-2 w-full">
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
                <Input
                  value={formData.department}
                  disabled
                  className="flex-1 border-0 border-b border-[#E0E0E0] rounded-none px-0 h-[36px] bg-transparent"
                />
              </div>
              <div className="flex flex-col md:flex-row md:items-center">
                <label className="text-sm text-[#1A1A1A] w-full md:w-[120px] mb-2 md:mb-0">
                  Vị trí
                </label>
                <Input
                  value={formData.position}
                  disabled
                  className="flex-1 border-0 border-b border-[#E0E0E0] rounded-none px-0 h-[36px] bg-transparent"
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
                  Số lượng
                </label>
                <Input
                  value={formData.quantity}
                  disabled
                  className="w-full md:w-[300px] border-0 border-b border-[#E0E0E0] rounded-none px-0 h-[36px] bg-transparent"
                />
              </div>
              <div>
                <label className="text-sm text-[#1A1A1A] inline-block w-[120px] align-top">
                  Nơi làm việc
                </label>
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
              </div>
              <div>
                <label className="text-sm text-[#1A1A1A] inline-flex items-center w-[120px] whitespace-nowrap mr-4">
                  Lý do tuyển dụng
                </label>
                <span className="text-sm">{formData.reason || 'N/A'}</span>
              </div>
              <div>
                <label className="text-sm text-[#1A1A1A] inline-block w-[120px] align-top">
                  Quỹ tuyển dụng
                </label>
                <div className="inline-block">
                  <span className="text-sm">{formData.budget || 'N/A'}</span>
                </div>
              </div>
              {formData.budget === 'Vượt quỹ' && (
                <>
                  <div>
                    <label className="text-sm text-[#1A1A1A] inline-block w-[120px] align-top">
                      Lương hiện tại
                    </label>
                    <div className="inline-block">
                      <span className="text-sm">{formData.currentSalary || 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-[#1A1A1A] inline-block w-[120px] align-top">
                      Lương vượt quỹ
                    </label>
                    <div className="inline-block">
                      <span className="text-sm">{formData.overflowSalary || 'N/A'}</span>
                    </div>
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
                <div className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm bg-transparent">
                  {formData.jobDescription}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1 text-[#1A1A1A]">
                  2, Yêu cầu ứng viên
                </label>
                <div className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm bg-transparent">
                  {formData.requirements}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1 text-[#1A1A1A]">
                  3, Quyền lợi
                </label>
                <div className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm bg-transparent">
                  {formData.benefits}
                </div>
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

export default RecruitmentRequestDetail; 