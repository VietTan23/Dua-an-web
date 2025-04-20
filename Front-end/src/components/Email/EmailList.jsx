import React, { useState, useEffect } from 'react';
import { Layout, List, Avatar, Button, Input, Space, Checkbox, Tooltip, message, Tabs, Modal, Form } from 'antd';
import { SearchOutlined, ReloadOutlined, DeleteOutlined, StarOutlined, ArrowRightOutlined, ArrowLeftOutlined, PaperClipOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { TabPane } = Tabs;
const API_BASE_URL = 'https://backendhr-9ti5.onrender.com/api';

const EmailList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const emailsPerPage = 5;
  const [showDetail, setShowDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchEmails(currentPage);
  }, [activeTab, currentPage]);

  const fetchEmails = async (pageNum) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const endpoint = activeTab === 'sent' ? '/emails/sent' : '/emails';
      const response = await axios.get(`${API_BASE_URL}${endpoint}?page=${pageNum}&limit=${emailsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        const { emails: newEmails, total } = response.data;
        const sortedEmails = [...newEmails].sort((a, b) => new Date(b.date) - new Date(a.date));
        setEmails(sortedEmails);
        setTotalPages(Math.ceil(total / emailsPerPage));
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      message.error('Có lỗi xảy ra khi tải email');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleReload = () => {
    fetchEmails(currentPage);
  };

  const handleEmailClick = (email) => {
    if (selectedEmail?._id === email._id && showDetail) {
      setSelectedEmail(null);
      setShowDetail(false);
    } else {
      setSelectedEmail(email);
      setShowDetail(true);
    }
  };

  const handleCloseDetail = () => {
    setSelectedEmail(null);
    setShowDetail(false);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/emails/${selectedEmail._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      message.success('Email đã được xóa');
      setShowDeleteModal(false);
      handleCloseDetail();
      fetchEmails(1);
    } catch (error) {
      console.error('Error deleting email:', error);
      message.error('Có lỗi xảy ra khi xóa email');
    }
  };

  const handleReply = async (values) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/emails/send`, {
        to: selectedEmail.from,
        subject: `Re: ${selectedEmail.subject}`,
        content: values.content
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      message.success('Email đã được gửi');
      setShowReplyModal(false);
      form.resetFields();
    } catch (error) {
      console.error('Error sending reply:', error);
      message.error('Có lỗi xảy ra khi gửi email');
    }
  };

  const handleForward = async (values) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/emails/send`, {
        to: values.to,
        subject: `Fwd: ${selectedEmail.subject}`,
        content: values.content
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      message.success('Email đã được chuyển tiếp');
      setShowForwardModal(false);
      form.resetFields();
    } catch (error) {
      console.error('Error forwarding email:', error);
      message.error('Có lỗi xảy ra khi chuyển tiếp email');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderEmailContent = (email) => {
    if (email.html) {
      return (
        <div 
          dangerouslySetInnerHTML={{ 
            __html: DOMPurify.sanitize(email.html, { 
              ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'img'],
              ALLOWED_ATTR: ['href', 'src', 'alt', 'style']
            }) 
          }} 
        />
      );
    }
    return <div style={{ whiteSpace: 'pre-wrap' }}>{email.preview}</div>;
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <Layout style={{ marginLeft: 282 }}>
        <Content style={{ margin: '80px 16px 24px', minHeight: 280 }}>
          <div style={{ 
            display: 'flex',
            gap: '16px',
            height: 'calc(100vh - 120px)'
          }}>
            {/* Left Panel - Email List */}
            <div style={{ 
              width: showDetail ? '400px' : '100%',
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              transition: 'width 0.3s ease'
            }}>
              {/* Search Bar */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
                <Input
                  placeholder="Tìm kiếm"
                  prefix={<SearchOutlined />}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Email Categories */}
              <div style={{ 
                padding: '8px 24px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                gap: '16px',
                overflowX: 'auto',
                whiteSpace: 'nowrap'
              }}>
                <Button 
                  type="text" 
                  style={{ color: activeTab === 'inbox' ? '#7B61FF' : undefined }}
                  onClick={() => setActiveTab('inbox')}
                >
                  Thư đến
                </Button>
                <Button 
                  type="text"
                  style={{ color: activeTab === 'sent' ? '#7B61FF' : undefined }}
                  onClick={() => setActiveTab('sent')}
                >
                  Thư đã gửi
                </Button>
                <Button 
                  type="primary" 
                  style={{ marginLeft: 'auto', background: '#7B61FF' }}
                  onClick={() => navigate('/send-email')}
                >
                  + Thêm mới
                </Button>
              </div>

              {/* Toolbar */}
              <div style={{ 
                padding: '8px 24px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <Button 
                  type="text" 
                  icon={<ReloadOutlined />} 
                  onClick={handleReload}
                  title="Tải lại"
                />
                <Button 
                  type="text" 
                  icon={<DeleteOutlined />} 
                  title="Xóa"
                />
                <Button 
                  type="text" 
                  icon={<ArrowRightOutlined />} 
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  title="Trang tiếp"
                />
                <Button 
                  type="text" 
                  icon={<ArrowLeftOutlined />} 
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  title="Trang trước"
                />
                <span style={{ marginLeft: 'auto', color: '#666' }}>
                  Trang {currentPage} / {totalPages}
                </span>
              </div>

              {/* Email List */}
              <div style={{ flex: 1, overflow: 'auto' }}>
                <List
                  loading={loading}
                  dataSource={emails}
                  renderItem={email => (
                    <div 
                      onClick={() => handleEmailClick(email)}
                      style={{
                        padding: '12px 24px',
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        background: selectedEmail?._id === email._id ? '#f0f7ff' : 'white',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}
                    >
                      <Checkbox checked={false} onClick={e => e.stopPropagation()} />
                      <StarOutlined style={{ color: '#d9d9d9', marginTop: '4px' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                          {email.from}
                        </div>
                        <div style={{ fontWeight: 500, color: '#666' }}>
                          {email.subject}
                        </div>
                        <div style={{ 
                          color: '#666',
                          fontSize: '14px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {email.preview}
                        </div>
                      </div>
                      <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '4px',
                        minWidth: 'fit-content'
                      }}>
                        <span style={{ color: '#666', fontSize: '12px' }}>
                          {formatDate(email.date)}
                        </span>
                        {email.attachments?.length > 0 && (
                          <PaperClipOutlined style={{ color: '#666' }} />
                        )}
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Right Panel - Email Detail */}
            {showDetail && (
              <div style={{ 
                flex: 1,
                background: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                {selectedEmail ? (
                  <>
                    <div style={{ 
                      padding: '16px 24px',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <h2 style={{ margin: 0 }}>{selectedEmail.subject}</h2>
                      <Space>
                        <Button icon={<CloseOutlined />} onClick={handleCloseDetail}>Đóng</Button>
                      </Space>
                    </div>
                    <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '24px'
                      }}>
                        <Avatar size={40}>{selectedEmail.from[0]}</Avatar>
                        <div>
                          <div style={{ fontWeight: 500 }}>{selectedEmail.from}</div>
                          <div style={{ color: '#666', fontSize: '14px' }}>
                            đến: tôi
                          </div>
                        </div>
                        <div style={{ 
                          marginLeft: 'auto',
                          color: '#666',
                          fontSize: '14px'
                        }}>
                          {formatDate(selectedEmail.date)}
                        </div>
                      </div>
                      
                      {/* Email Content */}
                      <div className="email-content">
                        {renderEmailContent(selectedEmail)}
                      </div>

                      {/* Attachments */}
                      {selectedEmail.attachments?.length > 0 && (
                        <div style={{ 
                          marginTop: '24px',
                          padding: '16px',
                          background: '#f5f5f5',
                          borderRadius: '8px'
                        }}>
                          <div style={{ marginBottom: '8px', fontWeight: 500 }}>
                            Tệp đính kèm ({selectedEmail.attachments.length})
                          </div>
                          {selectedEmail.attachments.map((attachment, index) => (
                            <div 
                              key={index}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px',
                                background: 'white',
                                borderRadius: '4px',
                                marginBottom: '8px'
                              }}
                            >
                              <PaperClipOutlined />
                              <div style={{ flex: 1 }}>
                                <div>{attachment.filename}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                  {Math.round(attachment.size / 1024)} KB
                                </div>
                              </div>
                              <Button size="small">Tải xuống</Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div style={{ 
                        marginTop: '24px',
                        padding: '16px',
                        borderTop: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Button danger onClick={() => setShowDeleteModal(true)}>Hủy</Button>
                        <Space>
                          <Button onClick={() => setShowReplyModal(true)}>Phản hồi</Button>
                          <Button type="primary" style={{ background: '#7B61FF' }} onClick={() => setShowForwardModal(true)}>
                            Chuyển tiếp
                          </Button>
                        </Space>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ 
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666'
                  }}>
                    Chọn một email để xem chi tiết
                  </div>
                )}
              </div>
            )}
          </div>
        </Content>
      </Layout>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Xác nhận xóa"
        open={showDeleteModal}
        onOk={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      >
        <p>Bạn có chắc chắn muốn xóa email này?</p>
      </Modal>

      {/* Reply Modal */}
      <Modal
        title="Phản hồi email"
        open={showReplyModal}
        onCancel={() => setShowReplyModal(false)}
        footer={null}
        width={800}
      >
        <Form form={form} onFinish={handleReply} layout="vertical">
          <Form.Item
            label="Đến"
            name="to"
            initialValue={selectedEmail?.from}
            rules={[{ required: true, message: 'Vui lòng nhập email người nhận' }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            label="Tiêu đề"
            name="subject"
            initialValue={`Re: ${selectedEmail?.subject}`}
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Nội dung"
            name="content"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
          >
            <Input.TextArea rows={10} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setShowReplyModal(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Gửi</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Forward Modal */}
      <Modal
        title="Chuyển tiếp email"
        open={showForwardModal}
        onCancel={() => setShowForwardModal(false)}
        footer={null}
        width={800}
      >
        <Form form={form} onFinish={handleForward} layout="vertical">
          <Form.Item
            label="Đến"
            name="to"
            rules={[{ required: true, message: 'Vui lòng nhập email người nhận' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Tiêu đề"
            name="subject"
            initialValue={`Fwd: ${selectedEmail?.subject}`}
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Nội dung"
            name="content"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
          >
            <Input.TextArea rows={10} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setShowForwardModal(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Gửi</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default EmailList;