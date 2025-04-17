import React, { useState, useEffect } from 'react';
import { Layout, Input, Select, Button, message, Modal } from 'antd';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FaArrowLeft, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';

const { Content } = Layout;
const { TextArea } = Input;

const EditPosition = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [approvedPositions, setApprovedPositions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPositionModalVisible, setIsPositionModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    level: '',
    experience: '',
    type: 'Full-time',
    mode: 'On-site',
    salary: '',
    description: '',
    requirements: '',
    benefits: '',
    status: 'Còn tuyển'
  });

  useEffect(() => {
    if (location.state?.position) {
      setFormData(location.state.position);
    } else {
      fetchPosition();
    }
    fetchApprovedPositions();
  }, []);

  const fetchPosition = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Vui lòng đăng nhập lại');
        navigate('/login');
        return;
      }

      const response = await fetch(`https://backendhr-9ti5.onrender.com/api/positions/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setFormData(data.data);
      } else {
        message.error('Không thể tải thông tin vị trí');
        navigate('/positions');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi tải thông tin vị trí');
      navigate('/positions');
    }
  };

  const fetchApprovedPositions = async () => {
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

      // Lọc các yêu cầu đã được duyệt
      const approved = response.data.filter(app => app.status === 'Đã duyệt');
      setApprovedPositions(approved);
    } catch (error) {
      console.error('Error fetching approved positions:', error);
      message.error('Có lỗi xảy ra khi tải danh sách vị trí');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePositionSelect = (position) => {
    setFormData(prev => ({
      ...prev,
      title: position.position,
      department: position.department,
      description: position.jobDescription,
      requirements: position.requirements,
      benefits: position.benefits
    }));
    setIsPositionModalVisible(false);
  };

  const filteredPositions = approvedPositions.filter(position =>
    `${position.position} - ${position.department}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Vui lòng đăng nhập lại');
        navigate('/login');
        return;
      }

      const response = await fetch(`https://backendhr-9ti5.onrender.com/api/positions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        message.success('Cập nhật vị trí thành công!');
        navigate('/positions');
      } else {
        message.error(data.error || 'Có lỗi xảy ra khi cập nhật vị trí');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi cập nhật vị trí');
      console.error('Error updating position:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <Sidebar />
      <Layout style={{ marginLeft: 282 }}>
        <Topbar />
        <Content style={{ margin: '80px 16px 24px', minHeight: 280, overflow: 'auto' }}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/positions')}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-gray-50"
            >
              <FaArrowLeft size={16} />
            </button>
            <h1 className="text-xl font-bold">Chỉnh sửa vị trí tuyển dụng</h1>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-4">Thông tin chung</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vị trí tuyển dụng
                  </label>
                  <Input
                    value={formData.title}
                    onClick={() => setIsPositionModalVisible(true)}
                    readOnly
                    placeholder="Chọn vị trí tuyển dụng"
                    className="w-full cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phòng ban
                  </label>
                  <Input
                    value={formData.department}
                    readOnly
                    className="w-full bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level
                  </label>
                  <Select
                    value={formData.level}
                    onChange={(value) => handleInputChange('level', value)}
                    placeholder="Chọn level"
                    className="w-full"
                    options={[
                      { value: 'Thực tập sinh', label: 'Thực tập sinh' },
                      { value: 'Junior', label: 'Junior' },
                      { value: 'Middle', label: 'Middle' },
                      { value: 'Senior', label: 'Senior' },
                      { value: 'Leader', label: 'Leader' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kinh nghiệm
                  </label>
                  <Select
                    value={formData.experience}
                    onChange={(value) => handleInputChange('experience', value)}
                    placeholder="Chọn kinh nghiệm"
                    className="w-full"
                    options={[
                      { value: 'Dưới 1 năm', label: 'Dưới 1 năm' },
                      { value: '1-2 năm', label: '1-2 năm' },
                      { value: '2-3 năm', label: '2-3 năm' },
                      { value: '3-5 năm', label: '3-5 năm' },
                      { value: 'Trên 5 năm', label: 'Trên 5 năm' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hình thức làm việc
                  </label>
                  <div className="flex gap-4">
                    <Select
                      value={formData.type}
                      onChange={(value) => handleInputChange('type', value)}
                      className="w-1/2"
                      options={[
                        { value: 'Full-time', label: 'Full-time' },
                        { value: 'Part-time', label: 'Part-time' },
                        { value: 'Contract', label: 'Contract' }
                      ]}
                    />
                    <Select
                      value={formData.mode}
                      onChange={(value) => handleInputChange('mode', value)}
                      className="w-1/2"
                      options={[
                        { value: 'On-site', label: 'On-site' },
                        { value: 'Remote', label: 'Remote' },
                        { value: 'Hybrid', label: 'Hybrid' }
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mức lương (VNĐ)
                  </label>
                  <Input
                    value={formData.salary}
                    onChange={(e) => handleInputChange('salary', e.target.value)}
                    placeholder="Nhập mức lương"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <Select
                    value={formData.status}
                    onChange={(value) => handleInputChange('status', value)}
                    placeholder="Chọn trạng thái"
                    className="w-full"
                    options={[
                      { value: 'Còn tuyển', label: 'Còn tuyển' },
                      { value: 'Nhập', label: 'Nhập' },
                      { value: 'Tạm dừng', label: 'Tạm dừng' }
                    ]}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-4">Mô tả công việc</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả công việc
                  </label>
                  <TextArea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Nhập mô tả công việc"
                    rows={4}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yêu cầu ứng viên
                  </label>
                  <TextArea
                    value={formData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                    placeholder="Nhập yêu cầu ứng viên"
                    rows={4}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quyền lợi
                  </label>
                  <TextArea
                    value={formData.benefits}
                    onChange={(e) => handleInputChange('benefits', e.target.value)}
                    placeholder="Nhập quyền lợi"
                    rows={4}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              <Button
                onClick={() => navigate('/positions')}
                className="px-6 hover:bg-gray-100"
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                className="px-6 bg-[#DAF374] text-black border-none hover:bg-[#c5dd60]"
                loading={loading}
              >
                Lưu thay đổi
              </Button>
            </div>
          </div>

          {/* Position Selection Modal */}
          <Modal
            title="Chọn vị trí tuyển dụng"
            open={isPositionModalVisible}
            onCancel={() => setIsPositionModalVisible(false)}
            footer={null}
            width={800}
          >
            <div className="mb-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm vị trí..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Vị trí tuyển dụng</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPositions.map((position, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => handlePositionSelect(position)}
                    >
                      <td className="px-4 py-2 text-sm">
                        {position.position} - {position.department}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default EditPosition; 