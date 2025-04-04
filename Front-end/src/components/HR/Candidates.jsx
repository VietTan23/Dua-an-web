import React, { useState, useEffect } from 'react';
import { Layout, Input, Table, Tag, Button, message, Space, Tooltip } from 'antd';
import { SearchOutlined, FileTextOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Content } = Layout;
const API_BASE_URL = 'http://localhost:8000/api';

const Candidates = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Vui lòng đăng nhập lại');
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/candidates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        const candidatesWithPosition = response.data.candidates.map(candidate => ({
          ...candidate,
          positionId: candidate.positionId || null
        }));
        setCandidates(candidatesWithPosition || []);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      if (error.response?.status === 401) {
        message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại');
        navigate('/login');
      } else {
        message.error('Có lỗi xảy ra khi tải danh sách ứng viên');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (stage) => {
    const colors = {
      'new': 'default',
      'reviewing': 'processing',
      'interview1': 'warning',
      'interview2': 'warning',
      'offer': 'success',
      'hired': 'success',
      'rejected': 'error'
    };
    return colors[stage] || 'default';
  };

  const getStatusText = (stage) => {
    const texts = {
      'new': 'Mới',
      'reviewing': 'Đang xét',
      'interview1': 'PV 1',
      'interview2': 'PV 2',
      'offer': 'Đề xuất',
      'hired': 'Đã tuyển',
      'rejected': 'Từ chối'
    };
    return texts[stage] || stage;
  };

  const columns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      width: '18%',
      ellipsis: true,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          String(record.name).toLowerCase().includes(value.toLowerCase()) ||
          String(record.positionId?.title || '').toLowerCase().includes(value.toLowerCase()) ||
          String(record.email).toLowerCase().includes(value.toLowerCase())
        );
      },
      render: (text, record) => (
        <a onClick={() => navigate(`/candidates/${record._id}`)}>{text}</a>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '20%',
      ellipsis: true,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: '12%',
      ellipsis: true,
    },
    {
      title: 'Vị trí ứng tuyển',
      dataIndex: 'positionId',
      key: 'positionId',
      width: '15%',
      ellipsis: true,
      render: (positionId) => positionId?.title || 'N/A',
    },
    {
      title: 'Phòng ban',
      dataIndex: 'positionId',
      key: 'positionId',
      width: '12%',
      ellipsis: true,
      render: (positionId) => positionId?.department || 'N/A',
    },
    {
      title: 'Ngày ứng tuyển',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '10%',
      ellipsis: true,
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Tài liệu',
      key: 'documents',
      width: '8%',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          {record.cv && (
            <Tooltip title="Xem CV">
              <Button 
                type="text" 
                icon={<FileTextOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(record.cv.url, '_blank');
                }}
              />
            </Tooltip>
          )}
          {record.video && (
            <Tooltip title="Xem video">
              <Button 
                type="text" 
                icon={<VideoCameraOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(record.video, '_blank');
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'stage',
      dataIndex: 'stage',
      width: '10%',
      align: 'center',
      render: (stage) => (
        <Tag color={getStatusColor(stage)} style={{ minWidth: '70px', textAlign: 'center' }}>
          {getStatusText(stage)}
        </Tag>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <Layout style={{ marginLeft: 282 }}>
        <Content style={{ margin: '80px 16px 24px', minHeight: 280 }}>
          <div style={{ 
            background: '#fff',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h1 style={{ 
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 600
                }}>
                  Danh sách ứng viên
                </h1>
              </div>
              <Input
                placeholder="Tìm kiếm theo tên, vị trí, email..."
                prefix={<SearchOutlined />}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
              />
            </div>
            <Table
              columns={columns}
              dataSource={candidates}
              rowKey="_id"
              loading={loading}
              pagination={{
                total: candidates.length,
                pageSize: 10,
                showTotal: (total) => `Tổng số ${total} ứng viên`,
                showSizeChanger: false
              }}
              onRow={(record) => ({
                onClick: () => navigate(`/candidates/${record._id}`),
                style: { cursor: 'pointer' }
              })}
            />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Candidates; 