import React, { useState, useEffect } from 'react';
import { Table, Button, Space, message, Modal, Select, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { notificationService } from '../../services/notificationService';
import dayjs from 'dayjs';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filteredNotifications, setFilteredNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchText, selectedFilter, filterValue]);

  const filterNotifications = () => {
    let filtered = [...notifications];

    // Tìm kiếm theo text
    if (searchText) {
      filtered = filtered.filter(notification => 
        notification.candidateId?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        notification.position?.toLowerCase().includes(searchText.toLowerCase()) ||
        notification.department?.toLowerCase().includes(searchText.toLowerCase()) ||
        notification.branch?.toLowerCase().includes(searchText.toLowerCase()) ||
        notification.creator?.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
        notification.hrInCharge?.fullName?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Lọc theo tiêu chí đã chọn
    if (selectedFilter && filterValue) {
      switch (selectedFilter) {
        case 'department':
          filtered = filtered.filter(notification => 
            notification.department?.toLowerCase().includes(filterValue.toLowerCase())
          );
          break;
        case 'branch':
          filtered = filtered.filter(notification => 
            notification.branch?.toLowerCase().includes(filterValue.toLowerCase())
          );
          break;
        case 'creator':
          filtered = filtered.filter(notification => 
            notification.creator?.fullName?.toLowerCase().includes(filterValue.toLowerCase())
          );
          break;
        case 'hrInCharge':
          filtered = filtered.filter(notification => 
            notification.hrInCharge?.fullName?.toLowerCase().includes(filterValue.toLowerCase())
          );
          break;
        default:
          break;
      }
    }

    setFilteredNotifications(filtered);
  };

  const handleFilterChange = (value) => {
    setSelectedFilter(value);
    setFilterValue(''); // Reset filter value when changing filter type
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      setNotifications(response.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa thông báo này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await notificationService.deleteNotification(id);
          message.success('Xóa thông báo thành công');
          fetchNotifications();
        } catch (error) {
          message.error('Lỗi khi xóa thông báo');
        }
      },
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'recruitmentId',
      key: 'recruitmentId',
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Họ và Tên',
      dataIndex: ['candidateId', 'name'],
      key: 'name',
    },
    {
      title: 'Chức vụ',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Phòng',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Chi nhánh',
      dataIndex: 'branch',
      key: 'branch',
    },
    {
      title: 'Người tạo',
      dataIndex: ['creator', 'fullName'],
      key: 'creator',
    },
    {
      title: 'Nhân sự phụ trách',
      dataIndex: ['hrInCharge', 'fullName'],
      key: 'hrInCharge',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => navigate(`/notifications/${record._id}`)}
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/notifications/edit/${record._id}`)}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record._id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 pt-[104px] pl-[298px]">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Danh sách thông báo ứng viên</h1>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined className="text-gray-400" />}
              className="w-[280px]"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button 
              type="primary" 
              className="bg-[#7B61FF] hover:bg-[#6B51EF]"
              onClick={() => navigate('/notifications/create')}
            >
              + Mới
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <FilterOutlined />
                <span>Bộ lọc</span>
              </div>
              <Select
                style={{ width: '150px' }}
                placeholder="Chọn tiêu chí lọc"
                value={selectedFilter}
                onChange={handleFilterChange}
                options={[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'department', label: 'Theo Phòng' },
                  { value: 'branch', label: 'Theo Chi Nhánh' },
                  { value: 'creator', label: 'Theo Người Tạo' },
                  { value: 'hrInCharge', label: 'Theo Nhân sự phụ trách' }
                ]}
              />
              {selectedFilter && selectedFilter !== 'all' && (
                <Input
                  placeholder={`Nhập ${selectedFilter === 'department' ? 'phòng' : selectedFilter === 'branch' ? 'chi nhánh' : selectedFilter === 'creator' ? 'người tạo' : 'nhân sự phụ trách'}...`}
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="w-[200px]"
                />
              )}
            </div>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredNotifications}
          rowKey="_id"
          loading={loading}
          pagination={{
            total: filteredNotifications.length,
            pageSize: 5,
            showSizeChanger: false,
            showQuickJumper: false,
          }}
        />
      </div>
    </div>
  );
};

export default Notifications; 