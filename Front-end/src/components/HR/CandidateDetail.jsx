import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Button, Tag, message, Modal, Form, Input, Select, Avatar, Card } from 'antd';
import { ArrowLeftOutlined, EditOutlined, UserOutlined, MessageOutlined, DownloadOutlined, MailOutlined, PhoneOutlined, FileTextOutlined, BarChartOutlined, RiseOutlined, CommentOutlined, CalendarOutlined, LinkOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/vi';
import dayjs from 'dayjs';
import AddEventModal from '../Calendar/AddEventModal';

const { Content } = Layout;
const { TextArea } = Input;
const API_BASE_URL = 'https://backendhr-9ti5.onrender.com/api';

moment.locale('vi');

const RecruitmentStages = ({ currentStage, position }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    console.log('Clicking recruitment stages');
    console.log('Position:', position);
    if (position) {
      // Tìm vị trí tuyển dụng dựa trên tên vị trí
      const token = localStorage.getItem('token');
      axios.get(`${API_BASE_URL}/positions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.data.data && response.data.data.length > 0) {
          // Tìm vị trí có tên gần giống nhất
          const positions = response.data.data;
          const normalizedSearchPosition = position.toLowerCase().trim();
          
          const matchedPosition = positions.find(p => {
            const normalizedTitle = p.title.toLowerCase().trim();
            return normalizedTitle.includes(normalizedSearchPosition) || 
                   normalizedSearchPosition.includes(normalizedTitle);
          });

          if (matchedPosition) {
            console.log('Found matching position:', matchedPosition);
            navigate(`/positions/${matchedPosition._id}/candidates`);
          } else {
            console.log('No matching position found');
            message.error('Không tìm thấy vị trí tuyển dụng');
          }
        } else {
          console.log('No positions found');
          message.error('Không tìm thấy vị trí tuyển dụng');
        }
      })
      .catch(error => {
        console.error('Error finding position:', error);
        message.error('Có lỗi xảy ra khi tìm vị trí tuyển dụng');
      });
    } else {
      console.log('No position found');
      message.error('Không tìm thấy thông tin vị trí tuyển dụng');
    }
  };

  const getStageColor = (stageName, currentStage) => {
    const stageOrder = {
      'new': 0,
      'reviewing': 0,
      'interview1': 1,
      'interview2': 1,
      'offer': 2,
      'hired': 3,
      'rejected': 3
    };

    const currentStageIndex = stageOrder[currentStage];
    const stageIndex = {
      'proposal': 0,
      'interview': 1,
      'offer': 2,
      'final': 3
    }[stageName];

    // Nếu là giai đoạn cuối và trạng thái là rejected
    if (stageName === 'final' && currentStage === 'rejected') {
      return '#E15651';
    }

    // Nếu là giai đoạn hiện tại
    if (stageIndex === currentStageIndex) {
      return '#DAF375';
    }

    // Nếu là giai đoạn đã qua
    if (stageIndex < currentStageIndex) {
      return '#CBD3FC';
    }

    // Nếu là giai đoạn chưa đến
    return '#F3F3FE';
  };

  const getFinalStageText = (currentStage) => {
    if (currentStage === 'hired') {
      return 'Tuyển';
    } else if (currentStage === 'rejected') {
      return 'Từ chối';
    }
    return 'Tuyển/Từ chối';
  };

  return (
    <div 
      style={{ 
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '16px',
        cursor: 'pointer'
      }}
      onClick={handleClick}
    >
      <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 500 }}>Giai đoạn tuyển dụng</h3>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
        <div style={{ 
          flex: 1,
          padding: '12px',
          background: getStageColor('proposal', currentStage),
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#1A1A1A'
        }}>
          Đề xuất
        </div>
        <div style={{ 
          flex: 1,
          padding: '12px',
          background: getStageColor('interview', currentStage),
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#1A1A1A'
        }}>
          Phỏng vấn
        </div>
        <div style={{ 
          flex: 1,
          padding: '12px',
          background: getStageColor('offer', currentStage),
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#1A1A1A'
        }}>
          Offer
        </div>
        <div style={{ 
          flex: 1,
          padding: '12px',
          background: getStageColor('final', currentStage),
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#1A1A1A'
        }}>
          {getFinalStageText(currentStage)}
        </div>
      </div>
    </div>
  );
};

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [upcomingInterview, setUpcomingInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [comments, setComments] = useState([]);
  const [form] = Form.useForm();
  const [commentForm] = Form.useForm();
  const [isAddEventModalVisible, setIsAddEventModalVisible] = useState(false);
  const [currentCvUrl, setCurrentCvUrl] = useState('');

  const fetchCandidateDetail = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Vui lòng đăng nhập lại');
        navigate('/login');
        return;
      }

      const [candidateResponse, interviewResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/candidates/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        axios.get(`${API_BASE_URL}/interviews/candidate/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (candidateResponse.status === 200) {
        console.log('Candidate data:', candidateResponse.data.candidate);
        setCandidate(candidateResponse.data.candidate);
        
        // Thiết lập URL CV đầu tiên để hiển thị
        if (candidateResponse.data.candidate.cv && candidateResponse.data.candidate.cv.length > 0) {
          setCurrentCvUrl(candidateResponse.data.candidate.cv[0].url);
        }
      }

      if (interviewResponse.status === 200 && interviewResponse.data.length > 0) {
        setUpcomingInterview(interviewResponse.data[0]);
      }
    } catch (error) {
      console.error('Error fetching candidate details:', error);
      message.error('Có lỗi xảy ra khi tải thông tin ứng viên');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/candidates/${id}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 200) {
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      message.error('Có lỗi xảy ra khi tải nhận xét');
    }
  };

  useEffect(() => {
    fetchCandidateDetail();
  }, [fetchCandidateDetail]);

  useEffect(() => {
    if (isCommentModalVisible) {
      fetchComments();
    }
  }, [isCommentModalVisible]);

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
      'reviewing': 'Đang xem xét',
      'interview1': 'Phỏng vấn vòng 1',
      'interview2': 'Phỏng vấn vòng 2',
      'offer': 'Đề xuất',
      'hired': 'Đã tuyển',
      'rejected': 'Từ chối'
    };
    return texts[stage] || stage;
  };

  const handleUpdate = async (values) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/candidates/${id}`,
        values,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        message.success('Cập nhật thông tin thành công');
        setIsEditModalVisible(false);
        fetchCandidateDetail();
      }
    } catch (error) {
      console.error('Error updating candidate:', error);
      message.error('Có lỗi xảy ra khi cập nhật thông tin');
    }
  };

  const handleDownloadCV = async () => {
    try {
      // Kiểm tra xem có CV nào không
      if (!candidate.cv || candidate.cv.length === 0) {
        message.error('Không có CV để tải');
        return;
      }
      
      // Tạo link tải trực tiếp từ Cloudinary
      const link = document.createElement('a');
      link.href = currentCvUrl || candidate.cv[0].url; // Sử dụng CV đang xem hoặc CV đầu tiên
      link.setAttribute('download', `CV-${candidate.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading CV:', error);
      message.error('Có lỗi xảy ra khi tải CV');
    }
  };

  // Hàm chuyển đổi role sang tiếng Việt
  const translateRole = (role) => {
    const roleTranslations = {
      'department_head': 'Trưởng phòng ban',
      'business_director': 'Giám đốc kinh doanh',
      'ceo': 'CEO',
      'recruitment': 'Bộ phận tuyển dụng',
      'director': 'Giám đốc',
      'hr': 'HR'
    };
    return roleTranslations[role] || role;
  };

  const handleAddComment = async (values) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/candidates/${id}/comments`,
        values,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 201) {
        message.success('Thêm nhận xét thành công');
        commentForm.resetFields();
        setIsCommentModalVisible(false);
        fetchComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      message.error('Có lỗi xảy ra khi thêm nhận xét');
    }
  };

  const handleAddEvent = async (values) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Vui lòng đăng nhập lại');
        return;
      }

      const eventDate = dayjs(values.date);
      const startTime = dayjs(values.startTime);
      const endTime = dayjs(values.endTime);

      // Tạo ngày giờ đầy đủ từ ngày và giờ đã chọn
      const startDateTime = dayjs(eventDate.format('YYYY-MM-DD') + ' ' + startTime.format('HH:mm:ss'));
      const endDateTime = dayjs(eventDate.format('YYYY-MM-DD') + ' ' + endTime.format('HH:mm:ss'));

      if (endDateTime.isBefore(startDateTime)) {
        message.error('Thời gian kết thúc phải sau thời gian bắt đầu');
        return;
      }

      const formattedData = {
        title: values.title?.trim(),
        date: startDateTime.toISOString(), // Sử dụng startDateTime làm date
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        eventType: values.eventType,
        location: values.location?.trim() || '',
        room: values.room,
        description: values.description?.trim() || '',
        type: 'interview',
        attendees: values.attendees || [],
        candidate: id,
        beforeEvent: values.beforeEvent || 5,
        allDay: values.allDay || false
      };

      if (!formattedData.title) {
        message.error('Vui lòng nhập tiêu đề');
        return;
      }

      let response;
      
      // Kiểm tra xem đang chỉnh sửa hay tạo mới
      if (upcomingInterview && upcomingInterview._id) {
        // Cập nhật sự kiện hiện có
        response = await axios.put(
          `https://backendhr-9ti5.onrender.com/api/interviews/${upcomingInterview._id}`,
          formattedData,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // Tạo sự kiện mới
        response = await axios.post(
          'https://backendhr-9ti5.onrender.com/api/interviews',
          formattedData,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      if (response.status === 201 || response.status === 200) {
        message.success(upcomingInterview ? 'Cập nhật lịch phỏng vấn thành công' : 'Thêm lịch phỏng vấn thành công');
        setIsAddEventModalVisible(false);
        fetchCandidateDetail();

        // Hiển thị modal xác nhận gửi email chỉ khi tạo mới
        if (!upcomingInterview) {
          Modal.confirm({
            title: 'Gửi email mời phỏng vấn',
            content: 'Bạn có muốn gửi email mời phỏng vấn cho ứng viên ngay bây giờ?',
            okText: 'Gửi email',
            cancelText: 'Để sau',
            onOk: () => {
              navigate(`/candidates/${id}/send-email`);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error handling event:', error);
      if (error.response?.status === 401) {
        message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại');
      } else {
        const errorMessage = error.response?.data?.message || 'Không thể xử lý lịch phỏng vấn';
        message.error(errorMessage);
      }
    }
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (!candidate) {
    return <div>Không tìm thấy thông tin ứng viên</div>;
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <Layout style={{ marginLeft: 282 }}>
        <Content style={{ margin: '80px 16px 24px', minHeight: 280 }}>
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            height: 'calc(100vh - 112px)',
            overflow: 'hidden'
          }}>
            {/* Left sidebar */}
            <div style={{ 
              width: '300px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflow: 'auto'
            }}>
              {/* Card 1: Thông tin cơ bản */}
              <div style={{ 
                background: 'white',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <Avatar 
                    size={64} 
                    icon={<UserOutlined />} 
                    style={{ marginBottom: '16px' }}
                  />
                  <h2 style={{ margin: 0 }}>{candidate.name}</h2>
                  <Tag color={getStatusColor(candidate.stage)} style={{ margin: '8px 0' }}>
                    {getStatusText(candidate.stage)}
                  </Tag>
                  <p style={{ color: '#666', margin: '8px 0' }}>
                    Ứng tuyển vào {new Date(candidate.createdAt).toLocaleDateString('vi-VN')} qua {candidate.source === 'Khác' ? candidate.customSource : candidate.source}
                  </p>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 500 }}>Thông tin cá nhân</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <MailOutlined style={{ color: '#656ED3' }} />
                    <span>{candidate.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PhoneOutlined style={{ color: '#656ED3' }} />
                    <span>{candidate.phone}</span>
                  </div>
                </div>
              </div>

              {/* Card: Lịch sắp tới (hiển thị khi có interview) */}
              {upcomingInterview && (
                <Card className="mb-4">
                  <div className="text-lg font-medium mb-4">Lịch sắp tới</div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-gray-600 mb-2">{upcomingInterview.title}</div>
                    
                    {/* Thời gian */}
                    <div className="text-lg mb-2">
                      {moment.utc(upcomingInterview.startTime).local().format('D MMMM, YYYY')}
                    </div>
                    <div className="text-gray-600 mb-2">
                      {moment.utc(upcomingInterview.startTime).local().format('HH:mm')} - 
                      {moment.utc(upcomingInterview.endTime).local().format('HH:mm')}
                    </div>

                    {/* Loại và địa điểm */}
                    <div className="mb-2">
                      <Tag color={upcomingInterview.eventType === 'online' ? 'blue' : 'green'}>
                        {upcomingInterview.eventType === 'online' ? 'Online' : 'Offline'}
                      </Tag>
                    </div>
                    <div className="text-gray-600 mb-4">
                      Địa điểm: {upcomingInterview.location}
                    </div>

                    {/* Người tham gia */}
                    <div className="mt-4">
                      <div className="text-gray-600 mb-2">Người tham gia:</div>
                      <div className="flex flex-wrap gap-4">
                        {/* Người tạo */}
                        <div className="flex items-center gap-2">
                          <Avatar style={{ backgroundColor: '#1890ff' }}>
                            {upcomingInterview.createdBy.role[0].toUpperCase()}
                          </Avatar>
                          <div>
                            <div className="font-medium">{upcomingInterview.createdBy.fullName}</div>
                            <div className="text-xs text-gray-500">
                              {translateRole(upcomingInterview.createdBy.role)}
                            </div>
                          </div>
                        </div>

                        {/* Những người tham gia khác */}
                        {upcomingInterview.attendees.map((attendee, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Avatar style={{ backgroundColor: '#52c41a' }}>
                              {attendee.role[0].toUpperCase()}
                            </Avatar>
                            <div>
                              <div className="font-medium">{attendee.fullName}</div>
                              <div className="text-xs text-gray-500">
                                {translateRole(attendee.role)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Card 2: Thông tin ứng tuyển */}
              <div style={{ 
                background: 'white',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 500 }}>Vị trí ứng tuyển</h3>
                <div style={{ 
                  background: '#F4F1FE',
                  padding: '16px',
                  borderRadius: '8px'
                }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: '#DAF374',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}>
                      {candidate.position?.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>{candidate.position}</h4>
                      <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>{candidate.department}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <Tag color="blue">{candidate.type}</Tag>
                    <Tag color="green">{candidate.mode}</Tag>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BarChartOutlined style={{ color: '#666' }} />
                      <span style={{ color: '#666' }}>{candidate.level}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <RiseOutlined style={{ color: '#666' }} />
                      <span style={{ color: '#666' }}>{candidate.experience}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ color: '#7B61FF', fontWeight: 500 }}>
                        {candidate.salary !== 'N/A' ? `đ ${candidate.salary}` : 'Chưa cập nhật'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Tệp đính kèm */}
              <div style={{ 
                background: 'white',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 500 }}>Tệp đính kèm</h3>
                {candidate.cv && candidate.cv.length > 0 ? (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {candidate.cv.map((file, index) => (
                      <Button 
                        key={file.public_id || index}
                        type={currentCvUrl === file.url ? "primary" : "text"}
                        icon={<FileTextOutlined />}
                        onClick={() => {
                          setCurrentCvUrl(file.url);
                        }}
                        style={{ 
                          width: '100%', 
                          textAlign: 'left', 
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          background: currentCvUrl === file.url ? '#F4F1FE' : 'transparent',
                          color: currentCvUrl === file.url ? '#7B61FF' : 'inherit',
                          borderColor: currentCvUrl === file.url ? '#7B61FF' : 'transparent'
                        }}
                      >
                        <div style={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          marginLeft: '8px'
                        }}>
                          {file.fileName || `CV_${index + 1}`}
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#8c8c8c', textAlign: 'center', padding: '16px' }}>
                    Không có tệp đính kèm
                  </div>
                )}
                {candidate.cvLink && (
                  <Button 
                    type="text" 
                    icon={<LinkOutlined />}
                    onClick={() => window.open(candidate.cvLink, '_blank')}
                    style={{ width: '100%', textAlign: 'left', marginTop: '8px' }}
                  >
                    Link CV
                  </Button>
                )}
              </div>

              {/* Card: Nhận xét */}
              <div style={{ 
                background: 'white',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginTop: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>Nhận xét</h3>
                  <Button 
                    type="primary"
                    icon={<CommentOutlined />}
                    onClick={() => setIsCommentModalVisible(true)}
                  >
                    Thêm nhận xét
                  </Button>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {comments.map((comment, index) => (
                    <div 
                      key={comment._id} 
                      style={{
                        padding: '12px',
                        borderBottom: index < comments.length - 1 ? '1px solid #f0f0f0' : 'none',
                        display: 'flex',
                        gap: '12px'
                      }}
                    >
                      <Avatar style={{ backgroundColor: '#1890ff' }}>
                        {comment.user.fullName[0]}
                      </Avatar>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          marginBottom: '4px' 
                        }}>
                          <span style={{ fontWeight: 500 }}>{comment.user.fullName}</span>
                          <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
                            {moment(comment.createdAt).fromNow()}
                          </span>
                        </div>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#8c8c8c', padding: '24px' }}>
                      Chưa có nhận xét nào
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right content */}
            <div style={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflow: 'hidden'
            }}>
              {/* Recruitment Stages */}
              <RecruitmentStages 
                currentStage={candidate.stage} 
                position={candidate.position}
              />

              {/* CV Viewer */}
              <div style={{ 
                flex: 1,
                background: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ 
                  padding: '16px 24px',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h2 style={{ margin: 0 }}>CV ứng viên</h2>
                  <div>
                    <Button 
                      icon={<DownloadOutlined />} 
                      onClick={handleDownloadCV}
                      style={{ marginRight: 8 }}
                    >
                      Tải CV
                    </Button>
                    <Button 
                      icon={<MessageOutlined />}
                      onClick={() => navigate(`/candidates/${id}/send-email`)}
                      style={{ marginRight: 8 }}
                    >
                      Gửi mail
                    </Button>
                    {(candidate.stage === 'interview1' || candidate.stage === 'interview2') && (
                      <Button
                        type="primary"
                        icon={<CalendarOutlined />}
                        onClick={() => setIsAddEventModalVisible(true)}
                      >
                        {upcomingInterview ? 'Chỉnh sửa lịch phỏng vấn' : 'Tạo lịch phỏng vấn'}
                      </Button>
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                  {candidate.cv && candidate.cv.length > 0 ? (
                    currentCvUrl ? (
                      <iframe
                        style={{ width: '100%', height: '500px', border: 'none' }}
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(currentCvUrl)}&embedded=true`}
                        title="CV Preview"
                      />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        Vui lòng chọn một tệp CV từ danh sách bên trái để xem
                      </div>
                    )
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      Không có CV để xem
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Content>
      </Layout>

      <Modal
        title="Chỉnh sửa thông tin ứng viên"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            name="name"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="stage"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select>
              <Select.Option value="new">Mới</Select.Option>
              <Select.Option value="reviewing">Đang xem xét</Select.Option>
              <Select.Option value="interview1">Phỏng vấn vòng 1</Select.Option>
              <Select.Option value="interview2">Phỏng vấn vòng 2</Select.Option>
              <Select.Option value="offer">Đề xuất</Select.Option>
              <Select.Option value="hired">Đã tuyển</Select.Option>
              <Select.Option value="rejected">Từ chối</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Ghi chú"
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item className="text-right">
            <Button onClick={() => setIsEditModalVisible(false)} style={{ marginRight: 8 }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Cập nhật
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Comment Modal */}
      <Modal
        title="Thêm nhận xét"
        open={isCommentModalVisible}
        onCancel={() => {
          setIsCommentModalVisible(false);
          commentForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={commentForm}
          layout="vertical"
          onFinish={handleAddComment}
        >
          <Form.Item
            name="content"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung nhận xét' }]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập nhận xét của bạn..."
            />
          </Form.Item>

          <Form.Item className="text-right">
            <Button 
              onClick={() => {
                setIsCommentModalVisible(false);
                commentForm.resetFields();
              }} 
              style={{ marginRight: 8 }}
            >
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Thêm nhận xét
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <AddEventModal
        visible={isAddEventModalVisible}
        onClose={() => setIsAddEventModalVisible(false)}
        onSave={handleAddEvent}
        selectedDate={dayjs()}
        candidateId={id}
        existingEvent={upcomingInterview}
      />
    </Layout>
  );
};

export default CandidateDetail; 