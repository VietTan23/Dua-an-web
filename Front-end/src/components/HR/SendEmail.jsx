import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Form, Input, Button, message, Select, Upload, Layout, Table, Modal } from 'antd';
import { SendOutlined, InboxOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/vi';

const { Dragger } = Upload;
const { Content } = Layout;
moment.locale('vi');

const SendEmail = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [emailContent, setEmailContent] = useState('');
  const [upcomingInterview, setUpcomingInterview] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [sendCount, setSendCount] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);
  const [hrInfo, setHrInfo] = useState({ name: '[tên HR]', phone: '[SDT]' });

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'table'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align',
    'link',
    'table', 'td', 'tr', 'th'
  ];

  // Hàm chuyển đổi trạng thái ứng viên
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

  useEffect(() => {
    const fetchCandidateData = async () => {
      if (!id) return;

      try {
        const token = localStorage.getItem('token');
        
        // Lấy thông tin ứng viên
        const candidateResponse = await axios.get(`http://localhost:8000/api/candidates/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Lấy thông tin phỏng vấn
        const interviewResponse = await axios.get(`http://localhost:8000/api/interviews/candidate/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('Interview response:', interviewResponse.data);

        if (candidateResponse.data && candidateResponse.data.candidate) {
          const candidate = candidateResponse.data.candidate;
          
          // Lấy thông tin HR từ localStorage
          const userString = localStorage.getItem('user');
          const user = userString ? JSON.parse(userString) : null;
          setHrInfo({
            name: user?.fullName || '[tên HR]'
          });
          
          // Lưu thông tin phỏng vấn nếu có
          if (interviewResponse.status === 200 && interviewResponse.data.length > 0) {
            const interview = interviewResponse.data[0];
            console.log('Upcoming interview:', interview);
            setUpcomingInterview(interview);
          } else {
            console.log('No upcoming interviews found');
          }

          // Tạo nội dung email mẫu
          const emailContent = candidate.stage === 'rejected' 
            ? `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
<h3 style="text-align: center; margin-bottom: 30px; color: #000066; font-size: 18px;">THƯ CẢM ƠN ${candidate.name.toUpperCase() || '[HỌ TÊN ỨNG VIÊN]'} ỨNG TUYỂN ${candidate.position.toUpperCase() || '[VỊ TRÍ TUYỂN DỤNG]'}</h3>

<p>Kính gửi: <strong>${candidate.name || '[anh/chị] [họ tên ứng viên]'}</strong>,</p>

<p>Hội đồng Tuyển dụng và Ban lãnh đạo <strong>Rikkei Academy</strong> gửi lời cảm ơn đến <strong>${candidate.name || '[Anh/Chị]'}</strong> vì đã quan tâm và dành thời gian ứng tuyển vị trí <strong>${candidate.position || '[Tên vị trí ứng tuyển]'}</strong>.</p>

<p>Sau khi xem xét, <strong>Rikkei Academy</strong> đã đối tượng với hồ sơ ứng tuyển của <strong>${candidate.name || '[Anh/Chị]'}</strong>, tuy nhiên do một số điểm chưa phù hợp, chúng tôi rất tiếc vì chưa thể hợp tác với <strong>${candidate.name || '[Anh/Chị]'}</strong> trong thời gian này.</p>

<p><strong>Rikkei Academy</strong> xin phép lưu hồ sơ của <strong>${candidate.name || '[Anh/Chị]'}</strong> cho những cơ hội khác trong tương lai. <strong>${candidate.name || '[Anh/Chị]'}</strong> có thể giữ liên lạc với chúng tôi và cập nhật những thông tin nghề nghiệp mới nhất tại <strong>Tuyển dụng Rikkei Academy</strong>.</p>

<p>Một lần nữa rất cám ơn sự quan tâm, thời gian và nỗ lực của <strong>${candidate.name || '[Anh/Chị]'}</strong>. Chúc <strong>${candidate.name || '[Anh/Chị]'}</strong> gặt hái nhiều thành công trong sự nghiệp tương lai.</p>

<p style="margin-top: 30px;">Trân trọng cảm ơn,</p>
<p style="margin-top: 10px;"><strong>TM. HỘI ĐỒNG TUYỂN DỤNG</strong></p>
</div>`
            : `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
<h3 style="text-align: center; margin-bottom: 30px; color: #000066; font-size: 18px;">THƯ MỜI PHỎNG VẤN ${candidate.name.toUpperCase() || '[HỌ TÊN ỨNG VIÊN]'} ỨNG TUYỂN ${candidate.position.toUpperCase() || '[VỊ TRÍ TUYỂN DỤNG]'}</h3>

<p>Kính gửi: <strong>${candidate.name || '[anh/chị] [họ tên ứng viên]'}</strong>,</p>

<p>Công ty TNHH <strong>Rikkei Education (Rikkei)</strong> rất cảm ơn <strong>${candidate.name || '[Anh/Chị]'}</strong> đã quan tâm ứng tuyển vào vị trí <strong>${candidate.position || '[tên vị trí tuyển dụng]'}</strong>.</p>

<p>Trân trọng mời <strong>${candidate.name || '[Anh/Chị]'}</strong> tham dự buổi phỏng vấn tại Rikkei theo thông tin chi tiết như sau:</p>

<div style="margin: 30px 0; background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
<p style="margin: 10px 0;">✔ <strong>Thời gian:</strong> ${upcomingInterview ? `${moment(upcomingInterview.startTime).format('HH:mm')} - ${moment(upcomingInterview.endTime).format('HH:mm')}, ${moment(upcomingInterview.date).format('DD/MM/YYYY')}` : '[thời gian phỏng vấn]'}</p>
<p style="margin: 10px 0;">✔ <strong>Địa điểm:</strong> ${upcomingInterview?.location || 'Tầng 7 tháp A tòa Sông Đà, đường Phạm Hùng, quận Nam Từ Liêm, Hà Nội'}</p>
<p style="margin: 10px 0;">✔ <strong>Hình thức phỏng vấn:</strong> ${upcomingInterview?.eventType === 'offline' ? 'Trực tiếp' : 'Online'}</p>
<p style="margin: 10px 0;">✔ <strong>Thời lượng:</strong> ${upcomingInterview ? `${Math.abs(moment(upcomingInterview.endTime).diff(moment(upcomingInterview.startTime), 'minutes'))} phút` : '30 - 45 phút'}</p>
<p style="margin: 10px 0;">✔ <strong>Người liên hệ:</strong> ${hrInfo.name}</p>
</div>

<p style="margin-top: 20px;">🔹 <strong>${candidate.name || '[Anh/Chị]'}</strong> vui lòng phản hồi lại email để xác nhận tham gia phỏng vấn.</p>
<p>🔹 Cám ơn <strong>${candidate.name || '[Anh/Chị]'}</strong> đã sắp xếp để có buổi trao đổi này. Chúc <strong>${candidate.name || '[Anh/Chị]'}</strong> có một buổi phỏng vấn thành công!</p>

<p style="margin-top: 30px;">Trân trọng,</p>
<p style="margin-top: 10px;"><strong>TM. HỘI ĐỒNG TUYỂN DỤNG</strong></p>
</div>`;

          form.setFieldsValue({
            to: candidate.email,
            subject: candidate.stage === 'rejected'
              ? `[RIKKEI ACADEMY] THƯ TỪ CHỐI _ ${candidate.name.toUpperCase()} _ ${candidate.position.toUpperCase()}`
              : `[RIKKEI ACADEMY] THƯ MỜI ${candidate.name.toUpperCase()} CHỨC VỤ ỨNG TUYỂN ${candidate.position.toUpperCase()} GIAI ĐOẠN ${getStatusText(candidate.stage).toUpperCase()}`,
            content: emailContent
          });

          setCandidate(candidate);
        }
      } catch (error) {
        console.error('Error fetching candidate data:', error);
        message.error('Không thể tải thông tin ứng viên');
      }
    };

    fetchCandidateData();
  }, [id, form]);

  // Thêm useEffect để cập nhật nội dung email khi upcomingInterview thay đổi
  useEffect(() => {
    if (candidate && upcomingInterview) {
      // Tính thời lượng phỏng vấn
      const startTime = moment(upcomingInterview.startTime);
      const endTime = moment(upcomingInterview.endTime);
      
      // Kiểm tra và sửa lại thời gian nếu cần
      if (endTime.isBefore(startTime)) {
        endTime.add(1, 'day');
      }
      
      const duration = endTime.diff(startTime, 'minutes');
      
      const emailContent = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
<h3 style="text-align: center; margin-bottom: 30px; color: #000066; font-size: 18px;">THƯ MỜI PHỎNG VẤN ${candidate.name.toUpperCase()} ỨNG TUYỂN ${candidate.position.toUpperCase()}</h3>

<p>Kính gửi: <strong>${candidate.name}</strong>,</p>

<p>Công ty TNHH <strong>Rikkei Education (Rikkei)</strong> rất cảm ơn <strong>${candidate.name}</strong> đã quan tâm ứng tuyển vào vị trí <strong>${candidate.position}</strong>.</p>

<p>Trân trọng mời <strong>${candidate.name}</strong> tham dự buổi phỏng vấn tại Rikkei theo thông tin chi tiết như sau:</p>

<div style="margin: 30px 0; background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
<p style="margin: 10px 0;">✔ <strong>Thời gian:</strong> ${moment(upcomingInterview.startTime).format('HH:mm')} - ${moment(upcomingInterview.endTime).format('HH:mm')}, ${moment(upcomingInterview.date).format('DD/MM/YYYY')}</p>
<p style="margin: 10px 0;">✔ <strong>Địa điểm:</strong> ${upcomingInterview.location || 'Tầng 7 tháp A tòa Sông Đà, đường Phạm Hùng, quận Nam Từ Liêm, Hà Nội'}</p>
<p style="margin: 10px 0;">✔ <strong>Hình thức phỏng vấn:</strong> ${upcomingInterview.eventType === 'offline' ? 'Trực tiếp' : 'Online'}</p>
<p style="margin: 10px 0;">✔ <strong>Thời lượng:</strong> ${duration} phút</p>
<p style="margin: 10px 0;">✔ <strong>Người liên hệ:</strong> ${hrInfo.name}</p>
</div>

<p style="margin-top: 20px;">🔹 <strong>${candidate.name}</strong> vui lòng phản hồi lại email để xác nhận tham gia phỏng vấn.</p>
<p>🔹 Cám ơn <strong>${candidate.name}</strong> đã sắp xếp để có buổi trao đổi này. Chúc <strong>${candidate.name}</strong> có một buổi phỏng vấn thành công!</p>

<p style="margin-top: 30px;">Trân trọng,</p>
<p style="margin-top: 10px;"><strong>TM. HỘI ĐỒNG TUYỂN DỤNG</strong></p>
</div>`;

      form.setFieldsValue({
        content: emailContent
      });
    }
  }, [candidate, upcomingInterview, hrInfo, form]);

  useEffect(() => {
    if (candidate?.stage === 'hired') {
      // Tạo mật khẩu random 8 ký tự
      const generatePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < 8; i++) {
          const randomIndex = Math.floor(Math.random() * charset.length);
          password += charset[randomIndex];
        }
        return password;
      };

      const randomPassword = generatePassword();

      const hiredTemplate = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
<h3 style="text-align: center; margin-bottom: 30px; color: #000066; font-size: 18px;">THƯ MỜI NHẬN VIỆC</h3>

<p>Kính gửi: <strong>${candidate.gender === 'female' ? 'Chị' : 'Anh'} ${candidate.name}</strong>,</p>

<p>Hội đồng Tuyển dụng và Ban lãnh đạo <strong>Rikkei Academy</strong> chân thành cảm ơn ${candidate.gender === 'female' ? 'chị' : 'anh'} đã dành thời gian quý báu đến trao đổi công việc tại công ty chúng tôi. Hội đồng tuyển dụng và Ban lãnh đạo công ty ghi nhận năng lực và lòng nhiệt thành của ${candidate.gender === 'female' ? 'chị' : 'anh'}.</p>

<p>Ban lãnh đạo Công ty trân trọng mời ${candidate.gender === 'female' ? 'chị' : 'anh'} cộng tác cùng chúng tôi với các thông tin chi tiết như sau:</p>

<div style="margin: 30px 0; display: grid; grid-template-columns: 200px 1fr; gap: 10px; background-color: #ffffff; border: 1px solid #e0e0e0;">
  <div style="padding: 8px 12px; background-color: #f5f5f5; border-bottom: 1px solid #e0e0e0;"><strong>Chức danh:</strong></div>
  <div style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0;">${candidate.position}</div>
  
  <div style="padding: 8px 12px; background-color: #f5f5f5; border-bottom: 1px solid #e0e0e0;"><strong>Bộ phận - Phòng ban:</strong></div>
  <div style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0;">${candidate.department || 'Công ứng nguồn nhân lực'}</div>
  
  <div style="padding: 8px 12px; background-color: #f5f5f5; border-bottom: 1px solid #e0e0e0;"><strong>Thời gian làm việc:</strong></div>
  <div style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0;">8h00 - 17h30 từ thứ 2 - thứ 6</div>
  
  <div style="padding: 8px 12px; background-color: #f5f5f5; border-bottom: 1px solid #e0e0e0;"><strong>Địa điểm làm việc:</strong></div>
  <div style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0;">Tầng 7, Tòa nhà Sông Đà, Phạm Hùng, Nam Từ Liêm, Hà Nội</div>
  
  <div style="padding: 8px 12px; background-color: #f5f5f5; border-bottom: 1px solid #e0e0e0;"><strong>Mức lương chính thức:</strong></div>
  <div style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0;">${candidate.salary || '2.000.000'} VNĐ/tháng lương</div>
  
  <div style="padding: 8px 12px; background-color: #f5f5f5; border-bottom: 1px solid #e0e0e0;"><strong>Phụ cấp:</strong></div>
  <div style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0;">Vé xe tháng tại công ty</div>
  
  <div style="padding: 8px 12px; background-color: #f5f5f5;"><strong>Ngày nhận việc:</strong></div>
  <div style="padding: 8px 12px;">${moment(candidate.startDate).format('DD-MM-YY') || '05-08-24'}</div>
</div>

<br/>

<div style="background-color: #fff9e6; padding: 15px; margin: 20px 0;">
<p><span style="background-color: rgb(255, 255, 0); color: rgb(230, 0, 0);">${candidate.gender === 'female' ? 'Chị' : 'Anh'} vui lòng trả lời xác nhận & đăng nhập vào hệ thống, hoàn thành form thông tin nhân sự theo tài khoản được cấp dưới đây trước 23h ngày ${moment(candidate.startDate).subtract(2, 'days').format('DD/MM/YYYY')}.</span></p>

<p><span style="background-color: rgb(255, 255, 0); color: rgb(230, 0, 0);"><strong>Tên đăng nhập:</strong> ${candidate.email}</span></p>
<p><span style="background-color: rgb(255, 255, 0); color: rgb(230, 0, 0);"><strong>Mật khẩu:</strong> ${randomPassword}</span></p>
</div>

<br/>

<p>Chúng tôi hoan nghênh những đóng góp của ${candidate.gender === 'female' ? 'chị' : 'anh'} vào sự nghiệp phát triển của Công ty. Khi tới nhận việc, đề nghị ${candidate.gender === 'female' ? 'chị' : 'anh'} dành thời gian tìm hiểu thêm các thông tin về Tổ chức, mô tả công việc của mình, mặc trang phục lịch sự, phù hợp với môi trường công sở, mang laptop cá nhân để phục vụ công việc.</p>

<p style="margin-top: 20px;">Mọi thắc mắc vui lòng liên hệ <strong>Ms.Duyên(HR): 0385324236</strong></p>

<p style="margin-top: 30px;">Trân trọng,</p>
<p style="margin-top: 10px;"><strong>TM. HỘI ĐỒNG TUYỂN DỤNG</strong></p>
</div>`;

      form.setFieldsValue({
        content: hiredTemplate,
        subject: `[RIKKEI ACADEMY] XÁC NHẬN THƯ MỜI NHẬN VIỆC - ${candidate.name.toUpperCase()} - ${candidate.position.toUpperCase()}`
      });
    }
  }, [candidate, form]);

  // File upload configuration
  const uploadProps = {
    name: 'attachments',
    multiple: true,
    fileList: fileList,
    beforeUpload: (file) => {
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File phải nhỏ hơn 10MB!');
        return Upload.LIST_IGNORE;
      }
      return false; // Prevent auto upload
    },
    onChange: (info) => {
      setFileList(info.fileList);
    },
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
  };

  const handleSubmit = async (values) => {
    if (sendCount > 0) {
      setPendingSubmit(values);
      setShowConfirmModal(true);
      return;
    }

    await submitEmail(values);
  };

  const submitEmail = async (values) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('Starting email submission with values:', values);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('to', values.to);
      
      // Handle CC emails
      if (values.cc && values.cc.length > 0) {
        formData.append('cc', values.cc.join(','));
      }
      
      // Handle BCC emails
      if (values.bcc && values.bcc.length > 0) {
        formData.append('bcc', values.bcc.join(','));
      }
      
      formData.append('subject', values.subject);
      formData.append('content', values.content || '');
      
      // Append files if any
      if (fileList && fileList.length > 0) {
        fileList.forEach((file) => {
          formData.append('attachments', file.originFileObj);
        });
      }

      console.log('Sending email request...');
      const response = await axios.post('http://localhost:8000/api/emails/send', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log('Email send response:', response);

      if (response.status === 200) {
        // Cập nhật trạng thái email của ứng viên
        if (id) {
          try {
            console.log('Updating email status for candidate:', id);
            const updateResponse = await axios.patch(
              `http://localhost:8000/api/candidates/${id}/email-status`,
              { emailStatus: 'Đã gửi' },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            console.log('Email status update response:', updateResponse);

            if (updateResponse.status === 200) {
              message.success('Email đã được gửi thành công!');
              setSendCount(prev => prev + 1);
              
              // Chuyển hướng sau khi cập nhật trạng thái thành công
              if (location.pathname.includes('/candidates/')) {
                navigate(`/candidates/${id}`);
              } else {
                navigate('/emails');
              }
            }
          } catch (error) {
            console.error('Error updating email status:', error);
            console.error('Error response:', error.response);
            message.error('Email đã được gửi nhưng không thể cập nhật trạng thái');
          }
        } else {
          message.success('Email đã được gửi thành công!');
          navigate('/emails');
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi gửi email';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSend = () => {
    setShowConfirmModal(false);
    if (pendingSubmit) {
      submitEmail(pendingSubmit);
      setPendingSubmit(null);
    }
  };

  const handleCancelSend = () => {
    setShowConfirmModal(false);
    setPendingSubmit(null);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 ml-[282px]">
      <div className="max-w-[1200px] mx-auto bg-white rounded-lg p-6 mt-[80px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(id ? `/candidates/${id}` : '/emails')}
              className="border-none"
            >
              Quay lại
            </Button>
            <h1 className="text-[20px] font-medium text-[#1A1A1A] m-0">Thư mới</h1>
          </div>
        </div>

        {/* Email Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="bg-white rounded-lg"
        >
          {/* Recipients */}
          <div className="border-b border-[#f0f0f0] p-4">
            <div className="flex items-center">
              <span className="w-20 text-[#666]">Đến:</span>
              <Form.Item 
                name="to" 
                className="mb-0 flex-1"
                rules={[{ required: true, message: 'Vui lòng nhập email người nhận' }]}
              >
                <Input 
                  variant="borderless"
                  readOnly={!!id}
                  placeholder="Nhập địa chỉ email người nhận"
                />
              </Form.Item>
            </div>
          </div>

          {/* CC */}
          <div className="border-b border-[#f0f0f0] p-4">
            <div className="flex items-center">
              <span className="w-20 text-[#666]">CC:</span>
              <Form.Item name="cc" className="mb-0 flex-1">
                <Select
                  mode="tags"
                  style={{ width: '100%' }}
                  placeholder="Nhập email CC"
                  tokenSeparators={[',']}
                  variant="borderless"
                />
              </Form.Item>
            </div>
          </div>

          {/* BCC */}
          <div className="border-b border-[#f0f0f0] p-4">
            <div className="flex items-center">
              <span className="w-20 text-[#666]">BCC:</span>
              <Form.Item name="bcc" className="mb-0 flex-1">
                <Select
                  mode="tags"
                  style={{ width: '100%' }}
                  placeholder="Nhập email BCC"
                  tokenSeparators={[',']}
                  variant="borderless"
                />
              </Form.Item>
            </div>
          </div>

          {/* Subject */}
          <div className="border-b border-[#f0f0f0] p-4">
            <div className="flex items-center">
              <span className="w-20 text-[#666]">Tiêu đề:</span>
              <Form.Item 
                name="subject" 
                className="mb-0 flex-1"
                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
              >
                <Input 
                  variant="borderless"
                  readOnly={!!id}
                  placeholder="Nhập tiêu đề email"
                />
              </Form.Item>
            </div>
          </div>

          {/* File Upload */}
          <div className="border-b border-[#f0f0f0] p-4">
            <div className="flex items-start">
              <span className="w-20 text-[#666] mt-2">Đính kèm:</span>
              <div className="flex-1">
                <Upload {...uploadProps}>
                  <Button icon={<InboxOutlined />}>Chọn file</Button>
                </Upload>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <Form.Item
              name="content"
              rules={[{ required: true, message: 'Vui lòng nhập nội dung email' }]}
            >
              <ReactQuill 
                theme="snow"
                value={emailContent}
                onChange={setEmailContent}
                modules={modules}
                formats={formats}
                style={{ 
                  height: '300px',
                  marginBottom: '50px'
                }}
              />
            </Form.Item>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-8">
            <Button onClick={() => navigate(-1)}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={loading}
              className="bg-[#1890ff]"
            >
              Gửi
            </Button>
          </div>
        </Form>
      </div>

      {/* Confirmation Modal */}
      <Modal
        title="Xác nhận gửi email"
        open={showConfirmModal}
        onOk={handleConfirmSend}
        onCancel={handleCancelSend}
        okText="Tiếp tục gửi"
        cancelText="Hủy bỏ"
      >
        <p>Bạn đã gửi email cho ứng viên này trước đó. Bạn có chắc chắn muốn gửi lại?</p>
      </Modal>
    </div>
  );
};

export default SendEmail; 