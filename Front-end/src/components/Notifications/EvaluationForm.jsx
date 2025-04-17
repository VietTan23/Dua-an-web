import React, { useState, useEffect } from 'react';
import { Layout, Button, Typography, Table, Input, Space, message, Select } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import Topbar from '../Topbar/Topbar';
import Sidebar from '../Sidebar/Sidebar';
import { evaluationService } from '../../services/evaluationService';
import { notificationService } from '../../services/notificationService';
import html2pdf from 'html2pdf.js';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/vi';

const { Title } = Typography;
const { Content } = Layout;
const { TextArea } = Input;
const { Option } = Select;

const completionOptions = [
  'Chưa hoàn thành',
  'Hoàn thiện',
  'Hoàn thành trước thời hạn',
  'Vượt chỉ tiêu'
];

const EvaluationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  // State cho các trường dữ liệu
  const [tasks, setTasks] = useState([
    { key: '1', stt: 1, task: '', details: '', results: '', completion: '', comments: '', notes: '' },
  ]);

  const [selfEvaluation, setSelfEvaluation] = useState({
    advantages: '',
    disadvantages: '',
    improvements: '',
    overall: ''
  });

  const [managerEvaluation, setManagerEvaluation] = useState({
    overall: '',
    futurePlan: ''
  });

  const [result, setResult] = useState('');
  const [note, setNote] = useState('');
  const [evaluationPeriod, setEvaluationPeriod] = useState('HĐTV - 2 tháng');

  const evaluationPeriodOptions = [
    'HĐTV - 2 tuần',
    'HĐTV - 1 tháng',
    'HĐTV - 2 tháng',
    'HĐTV - Review 6 tháng',
    'HĐTV - Review 1 năm'
  ];

  // Load dữ liệu đánh giá và thông báo
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [evaluationData, notificationData] = await Promise.all([
        evaluationService.getEvaluationByNotificationId(id),
        notificationService.getNotificationById(id)
      ]);

      setNotification(notificationData.data);

      if (evaluationData) {
        setTasks(evaluationData.tasks.length > 0 ? evaluationData.tasks.map((task, index) => ({
          ...task,
          key: String(index + 1),
          stt: index + 1
        })) : [{ key: '1', stt: 1, task: '', details: '', results: '', completion: '', comments: '', notes: '' }]);
        setSelfEvaluation(evaluationData.selfEvaluation);
        setManagerEvaluation(evaluationData.managerEvaluation);
        setResult(evaluationData.result);
        setNote(evaluationData.note);
        setEvaluationPeriod(evaluationData.evaluationPeriod || 'HĐTV - 2 tháng');
      }
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRow = () => {
    const newKey = String(tasks.length + 1);
    setTasks([...tasks, { 
      key: newKey, 
      stt: tasks.length + 1,
      task: '', 
      details: '', 
      results: '', 
      completion: '', 
      comments: '', 
      notes: '' 
    }]);
  };

  // Xử lý lưu đánh giá
  const handleSave = async () => {
    try {
      console.log('Saving evaluation with notification ID:', id);
      
      // Check if evaluation exists
      let existingEvaluation = null;
      try {
        existingEvaluation = await evaluationService.getEvaluationByNotificationId(id);
        console.log('Existing evaluation:', existingEvaluation);
      } catch (error) {
        console.log('No existing evaluation found');
      }

      const evaluationData = {
        tasks,
        selfEvaluation,
        managerEvaluation,
        result,
        note,
        evaluationPeriod
      };

      // Save the evaluation
      await evaluationService.createOrUpdateEvaluation(id, evaluationData);
      message.success('Lưu đánh giá thành công');

      // If this is the first save and we have the employee's email, send notification
      if (!existingEvaluation && notification?.candidateId?.email) {
        try {
          const formData = new FormData();
          formData.append('to', notification.candidateId.email);
          formData.append('subject', `[RIKKEI ACADEMY] THÔNG BÁO KẾT THÚC GIAI ĐOẠN THỬ VIỆC - ${notification.candidateId.name}`);
          formData.append('content', `
Dear ${notification.candidateId.name},

Phòng Nhân sự thông báo nhắc lịch kết thúc giai đoạn thử việc của Anh/Chị như sau:

Họ tên : ${notification.candidateId.name}
Vị trí: ${notification.position} trực thuộc Phòng: ${notification.department}
Thời gian thử việc : từ ngày ${moment(notification.startDate).format('DD/MM/YYYY')} đến hết ngày ${moment(notification.endDate).format('DD/MM/YYYY')}

Theo quy trình của Công ty, Anh/Chị vui lòng thực hiện Phiếu đánh giá kết quả thử việc bằng cách truy cập vào tài khoản đã được cấp để hoàn thành đánh giá.

Phiếu đánh giá cần hoàn thiện trước ngày ${moment(notification.endDate).format('DD/MM/YYYY')} để đảm bảo việc thực hiện tiếp các thủ tục nhân sự đúng Quy định Công ty.  
Trường hợp cần hỗ trợ, Anh/Chị vui lòng liên hệ trực tiếp.

Trân trọng cảm ơn!`);

          const response = await axios.post('http://localhost:8000/api/emails/send', formData, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data'
            }
          });

          if (response.status === 200) {
            message.success('Đã gửi email thông báo cho nhân viên');
          }
        } catch (error) {
          console.error('Error sending email:', error);
          message.error('Không thể gửi email thông báo. Vui lòng thử lại sau.');
        }
      }

      navigate(`/notifications/${id}`);
    } catch (error) {
      console.error('Error in handleSave:', error);
      message.error('Lỗi khi lưu đánh giá');
    }
  };

  // Xử lý hủy
  const handleCancel = () => {
    navigate(`/notifications/${id}`);
  };

  const evaluationColumns = [
    {
      title: () => <div style={{ textAlign: 'center', color: 'white' }}>STT</div>,
      width: 60,
      align: 'center',
      className: 'bg-[#8B1C1C] text-white',
      render: (_, __, index) => (
        <div style={{ 
          textAlign: 'center', 
          color: 'black',
          width: '100%',
          padding: '4px 0'
        }}>
          {index + 1}
        </div>
      )
    },
    {
      title: 'Các Hạng mục công việc được giao',
      dataIndex: 'task',
      key: 'task',
      width: '20%',
      className: 'bg-[#8B1C1C] text-white',
      render: (text, record) => (
        <Input
          value={text}
          onChange={e => {
            const newTasks = [...tasks];
            const index = newTasks.findIndex(item => item.key === record.key);
            newTasks[index] = { ...newTasks[index], task: e.target.value };
            setTasks(newTasks);
          }}
        />
      )
    },
    {
      title: 'Chi tiết công việc',
      dataIndex: 'details',
      key: 'details',
      width: '20%',
      className: 'bg-[#8B1C1C] text-white',
      render: (text, record) => (
        <Input
          value={text}
          onChange={e => {
            const newTasks = [...tasks];
            const index = newTasks.findIndex(item => item.key === record.key);
            newTasks[index] = { ...newTasks[index], details: e.target.value };
            setTasks(newTasks);
          }}
        />
      )
    },
    {
      title: 'Kết quả công việc (chỉ tiết)',
      dataIndex: 'results',
      key: 'results',
      width: '20%',
      className: 'bg-[#8B1C1C] text-white',
      render: (text, record) => (
        <Input
          value={text}
          onChange={e => {
            const newTasks = [...tasks];
            const index = newTasks.findIndex(item => item.key === record.key);
            newTasks[index] = { ...newTasks[index], results: e.target.value };
            setTasks(newTasks);
          }}
        />
      )
    },
  ];

  const managementColumns = [
    {
      title: 'Mức độ hoàn thành',
      dataIndex: 'completion',
      key: 'completion',
      width: '15%',
      className: 'bg-[#8B1C1C] text-white',
      render: (text, record) => (
        <Select
          value={text}
          allowClear
          placeholder="Chọn mức độ"
          onChange={value => {
            const newTasks = [...tasks];
            const index = newTasks.findIndex(item => item.key === record.key);
            newTasks[index] = { ...newTasks[index], completion: value };
            setTasks(newTasks);
          }}
          style={{ width: '100%' }}
        >
          {completionOptions.map(option => (
            <Option key={option} value={option}>{option}</Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Nhận xét chi tiết',
      dataIndex: 'comments',
      key: 'comments',
      width: '20%',
      className: 'bg-[#8B1C1C] text-white',
      render: (text, record) => (
        <TextArea
          value={text}
          onChange={e => {
            const newTasks = [...tasks];
            const index = newTasks.findIndex(item => item.key === record.key);
            newTasks[index] = { ...newTasks[index], comments: e.target.value };
            setTasks(newTasks);
          }}
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      )
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      width: '25%',
      className: 'bg-[#8B1C1C] text-white',
      render: (text, record) => (
        <TextArea
          value={text}
          onChange={e => {
            const newTasks = [...tasks];
            const index = newTasks.findIndex(item => item.key === record.key);
            newTasks[index] = { ...newTasks[index], notes: e.target.value };
            setTasks(newTasks);
          }}
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      )
    },
  ];

  const selfEvaluationLabels = {
    advantages: 'Điểm mạnh',
    disadvantages: 'Điểm yếu',
    improvements: 'Điểm cần cải thiện',
    overall: 'Đánh giá chung'
  };

  const managerEvaluationLabels = {
    overall: 'Đánh giá chung',
    futurePlan: 'Kế hoạch phát triển'
  };

  // Xử lý xuất file PDF
  const handleExportPDF = () => {
    try {
      // Tạo một div tạm thời để chứa nội dung PDF
      const tempDiv = document.createElement('div');
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Times New Roman, serif';
      
      // Tạo tiêu đề
      const title = document.createElement('h1');
      title.style.textAlign = 'center';
      title.style.fontSize = '18px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '20px';
      title.textContent = 'ĐÁNH GIÁ KẾT QUẢ THỬ VIỆC';
      tempDiv.appendChild(title);
      
      // Thêm thông tin cơ bản
      const basicInfo = document.createElement('div');
      basicInfo.style.marginBottom = '20px';
      basicInfo.innerHTML = `
        <p><strong>Họ và tên:</strong> ${notification?.candidateId?.name || ''}</p>
        <p><strong>Team:</strong> ${notification?.department || ''}</p>
        <p><strong>Leader:</strong> ${notification?.hrInCharge?.fullName || ''}</p>
        <p><strong>Vị trí:</strong> ${notification?.position || ''}</p>
        <p><strong>Kỳ đánh giá:</strong> ${evaluationPeriod}</p>
      `;
      tempDiv.appendChild(basicInfo);
      
      // Tạo bảng đánh giá
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.marginBottom = '20px';
      
      // Tạo header cho bảng
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr style="background-color: #8B1C1C; color: white;">
          <th style="border: 1px solid #000; padding: 8px; text-align: center;">STT</th>
          <th style="border: 1px solid #000; padding: 8px; text-align: center;">Các Hạng mục công việc được giao</th>
          <th style="border: 1px solid #000; padding: 8px; text-align: center;">Chi tiết công việc</th>
          <th style="border: 1px solid #000; padding: 8px; text-align: center;">Kết quả công việc</th>
          <th style="border: 1px solid #000; padding: 8px; text-align: center;">Mức độ hoàn thành</th>
          <th style="border: 1px solid #000; padding: 8px; text-align: center;">Nhận xét chi tiết</th>
          <th style="border: 1px solid #000; padding: 8px; text-align: center;">Ghi chú</th>
        </tr>
      `;
      table.appendChild(thead);
      
      // Tạo body cho bảng
      const tbody = document.createElement('tbody');
      tasks.forEach((task, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="border: 1px solid #000; padding: 8px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #000; padding: 8px;">${task.task || ''}</td>
          <td style="border: 1px solid #000; padding: 8px;">${task.details || ''}</td>
          <td style="border: 1px solid #000; padding: 8px;">${task.results || ''}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: center;">${task.completion || ''}</td>
          <td style="border: 1px solid #000; padding: 8px;">${task.comments || ''}</td>
          <td style="border: 1px solid #000; padding: 8px;">${task.notes || ''}</td>
        `;
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tempDiv.appendChild(table);
      
      // Thêm phần tự đánh giá
      const selfEvalTitle = document.createElement('h2');
      selfEvalTitle.style.fontSize = '14px';
      selfEvalTitle.style.fontWeight = 'bold';
      selfEvalTitle.style.marginBottom = '10px';
      selfEvalTitle.textContent = 'NHẬN XÉT TỰ ĐÁNH GIÁ TỔNG QUAN';
      tempDiv.appendChild(selfEvalTitle);
      
      const selfEvalContent = document.createElement('div');
      selfEvalContent.style.marginBottom = '20px';
      selfEvalContent.innerHTML = `
        <p><strong>Điểm mạnh:</strong> ${selfEvaluation.advantages || ''}</p>
        <p><strong>Điểm yếu:</strong> ${selfEvaluation.disadvantages || ''}</p>
        <p><strong>Điểm cần cải thiện:</strong> ${selfEvaluation.improvements || ''}</p>
        <p><strong>Đánh giá chung:</strong> ${selfEvaluation.overall || ''}</p>
      `;
      tempDiv.appendChild(selfEvalContent);
      
      // Thêm phần quản lý đánh giá
      const managerEvalTitle = document.createElement('h2');
      managerEvalTitle.style.fontSize = '14px';
      managerEvalTitle.style.fontWeight = 'bold';
      managerEvalTitle.style.marginBottom = '10px';
      managerEvalTitle.textContent = 'QUẢN LÝ TRỰC TIẾP ĐÁNH GIÁ TỔNG QUAN';
      tempDiv.appendChild(managerEvalTitle);
      
      const managerEvalContent = document.createElement('div');
      managerEvalContent.style.marginBottom = '20px';
      managerEvalContent.innerHTML = `
        <p><strong>Đánh giá chung:</strong> ${managerEvaluation.overall || ''}</p>
        <p><strong>Kế hoạch phát triển:</strong> ${managerEvaluation.futurePlan || ''}</p>
      `;
      tempDiv.appendChild(managerEvalContent);
      
      // Thêm kết quả đánh giá
      const resultTitle = document.createElement('h2');
      resultTitle.style.fontSize = '14px';
      resultTitle.style.fontWeight = 'bold';
      resultTitle.style.marginBottom = '10px';
      resultTitle.textContent = 'KẾT QUẢ ĐÁNH GIÁ';
      tempDiv.appendChild(resultTitle);
      
      const resultContent = document.createElement('div');
      resultContent.style.marginBottom = '20px';
      resultContent.innerHTML = `<p>${result || ''}</p>`;
      tempDiv.appendChild(resultContent);
      
      // Thêm lưu ý
      const noteTitle = document.createElement('h2');
      noteTitle.style.fontSize = '14px';
      noteTitle.style.fontWeight = 'bold';
      noteTitle.style.marginBottom = '10px';
      noteTitle.textContent = 'Lưu ý (thay đổi mức lương nếu có):';
      tempDiv.appendChild(noteTitle);
      
      const noteContent = document.createElement('div');
      noteContent.style.marginBottom = '20px';
      noteContent.innerHTML = `<p>${note || ''}</p>`;
      tempDiv.appendChild(noteContent);
      
      // Thêm div tạm thời vào body
      document.body.appendChild(tempDiv);
      
      // Cấu hình cho html2pdf
      const options = {
        margin: 10,
        filename: `Danh-gia-${notification?.candidateId?.name || 'thu-viec'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // Tạo PDF
      html2pdf().from(tempDiv).set(options).save().then(() => {
        // Xóa div tạm thời sau khi tạo PDF
        document.body.removeChild(tempDiv);
        message.success('Xuất file PDF thành công');
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      message.error('Lỗi khi xuất file PDF');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <Sidebar />
      <Layout style={{ marginLeft: 282 }}>
        <Topbar />
        <Content style={{ margin: '80px 16px 24px', minHeight: 280 }}>
          <div className="bg-white rounded-lg shadow p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button 
                  icon={<ArrowLeftOutlined />}
                  onClick={handleCancel}
                >
                  Quay lại
                </Button>
                <Title level={4} className="m-0">Đánh giá kết quả thử việc</Title>
              </div>
              <Space>
                <Button 
                  className="border-none text-black bg-white hover:bg-gray-100"
                  onClick={handleCancel}
                >
                  Hủy
                </Button>
                <Button 
                  className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-none"
                  onClick={handleSave}
                >
                  Lưu
                </Button>
                <Button 
                  className="bg-[#DAF374] hover:bg-[#c5dd60] text-black border-none"
                  onClick={handleExportPDF}
                  icon={<DownloadOutlined />}
                >
                  Xuất file
                </Button>
              </Space>
            </div>

            {/* Thông tin cơ bản */}
            <div className="bg-[#8B1C1C] text-white p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-2">Họ và tên: {notification?.candidateId?.name}</p>
                  <p className="mb-2">Team: {notification?.department}</p>
                  <p className="mb-0">Leader: {notification?.hrInCharge?.fullName}</p>
                </div>
                <div>
                  <p className="mb-2">Vị trí: {notification?.position}</p>
                </div>
              </div>
            </div>

            {/* Kỳ đánh giá */}
            <div className="bg-[#C2D5A8] p-4 mb-4">
              <div className="flex justify-between items-center">
                <div>Kỳ đánh giá</div>
                <Select
                  value={evaluationPeriod}
                  onChange={setEvaluationPeriod}
                  style={{ width: 200 }}
                  className="custom-evaluation-select"
                  dropdownClassName="custom-evaluation-dropdown"
                  bordered={false}
                  suffixIcon={<div style={{ color: '#666' }}>▼</div>}
                >
                  {evaluationPeriodOptions.map(option => (
                    <Option key={option} value={option}>{option}</Option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Bảng đánh giá */}
            <div className="mb-4">
              <Table 
                columns={[...evaluationColumns, ...managementColumns]}
                dataSource={tasks}
                pagination={false}
                bordered
                size="middle"
                className="evaluation-table"
                loading={isLoading}
                footer={() => (
                  <Button 
                    type="dashed" 
                    onClick={handleAddRow} 
                    icon={<PlusOutlined />}
                    className="w-full"
                  >
                    Thêm hàng đánh giá
                  </Button>
                )}
              />
            </div>

            {/* Nhận xét tự đánh giá tổng quan */}
            <div className="bg-[#8B1C1C] text-white p-2 mb-2 text-center">
              Nhận xét tự đánh giá tổng quan
            </div>
            <table className="w-full mb-4 border-collapse border border-gray-300">
              <tbody>
                {Object.entries(selfEvaluation).map(([key, value]) => (
                  <tr key={key} className="border-b border-gray-300">
                    <td className="border-r border-gray-300 p-2 w-1/4">{selfEvaluationLabels[key]}</td>
                    <td className="p-2">
                      <TextArea
                        value={value}
                        onChange={e => setSelfEvaluation({ ...selfEvaluation, [key]: e.target.value })}
                        rows={3}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Quản lý trực tiếp đánh giá tổng quan */}
            <div className="bg-[#8B1C1C] text-white p-2 mb-2 text-center">
              Quản lý trực tiếp đánh giá tổng quan
            </div>
            <table className="w-full mb-4 border-collapse border border-gray-300">
              <tbody>
                {Object.entries(managerEvaluation).map(([key, value]) => (
                  <tr key={key} className="border-b border-gray-300">
                    <td className="border-r border-gray-300 p-2 w-1/4">{managerEvaluationLabels[key]}</td>
                    <td className="p-2">
                      <TextArea
                        value={value}
                        onChange={e => setManagerEvaluation({ ...managerEvaluation, [key]: e.target.value })}
                        rows={3}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Kết quả đánh giá */}
            <table className="w-full mb-4 border-collapse border border-gray-300">
              <tbody>
                <tr className="bg-yellow-200">
                  <td className="border-r border-gray-300 p-2 w-1/4">KẾT QUẢ ĐÁNH GIÁ</td>
                  <td className="p-2">
                    <TextArea
                      value={result}
                      onChange={e => setResult(e.target.value)}
                      rows={3}
                    />
                  </td>
                </tr>
                <tr className="bg-yellow-200">
                  <td className="border-r border-gray-300 p-2 w-1/4">Lưu ý (thay đổi mức lương nếu có)</td>
                  <td className="p-2">
                    <TextArea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      rows={3}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default EvaluationForm; 