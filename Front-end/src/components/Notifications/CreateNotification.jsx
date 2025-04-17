import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Space, Typography, DatePicker, Upload, Radio, Table, Checkbox, message, Spin, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { notificationService } from '../../services/notificationService';

const { Title } = Typography;
const { Option } = Select;

const CreateNotification = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [trainingCourses, setTrainingCourses] = useState([]);
  const [preparationTasks, setPreparationTasks] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [hrList, setHrList] = useState([]); 
  const [fileList, setFileList] = useState({
    personalPhoto: [],
    idCardPhotos: []
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [candidatesRes, hrRes] = await Promise.all([
        notificationService.getEligibleCandidates(),
        notificationService.getHRList()
      ]);
      console.log('Candidates response:', candidatesRes);
      console.log('HR response:', hrRes);
      setCandidates(Array.isArray(candidatesRes?.data) ? candidatesRes.data : []);
      setHrList(Array.isArray(hrRes) ? hrRes : []);
      
      // Hiển thị thông báo nếu không có ứng viên nào khả dụng
      if (!Array.isArray(candidatesRes?.data) || candidatesRes.data.length === 0) {
        message.info('Không có ứng viên nào khả dụng. Tất cả ứng viên đã được tạo thông báo.');
      }
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu');
      console.error('Error loading data:', error);
    }
  };

  const onCandidateChange = (value) => {
    console.log('Selected value:', value);
    const selectedCandidate = candidates.find(c => c._id === value);
    console.log('Selected candidate:', selectedCandidate);
    if (selectedCandidate) {
      const formValues = {
        candidateId: value,
        fullName: selectedCandidate.name,
        position: selectedCandidate.positionId?.title || 'Chưa có chức vụ',
        department: selectedCandidate.positionId?.department || 'Chưa có phòng ban',
        branch: selectedCandidate.positionId?.branch || 'Chưa có chi nhánh',
        email: selectedCandidate.email,
        phone: selectedCandidate.phone,
        address: selectedCandidate.address || '',
        education: selectedCandidate.education || '',
        experience: selectedCandidate.experience || '',
        skills: selectedCandidate.skills || '',
        hrInCharge: selectedCandidate.hrInCharge || undefined
      };
      console.log('Setting form values:', formValues);
      form.setFieldsValue(formValues);
    }
  };

  const trainingColumns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1
    },
    {
      title: 'Tên khóa huấn luyện, đào tạo/ Chứng chỉ',
      dataIndex: 'name',
      key: 'name',
      render: (_, record, index) => (
        <Input
          value={record.name}
          onChange={(e) => {
            const newData = [...trainingCourses];
            newData[index].name = e.target.value;
            setTrainingCourses(newData);
          }}
        />
      )
    },
    {
      title: 'Nơi cấp',
      dataIndex: 'issuedBy',
      key: 'issuedBy',
      render: (_, record, index) => (
        <Input
          value={record.issuedBy}
          onChange={(e) => {
            const newData = [...trainingCourses];
            newData[index].issuedBy = e.target.value;
            setTrainingCourses(newData);
          }}
        />
      )
    },
    {
      title: 'Năm',
      dataIndex: 'year',
      key: 'year',
      render: (_, record, index) => (
        <Input
          value={record.year}
          onChange={(e) => {
            const newData = [...trainingCourses];
            newData[index].year = e.target.value;
            setTrainingCourses(newData);
          }}
        />
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (_, __, index) => (
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />}
          onClick={() => {
            const newData = [...trainingCourses];
            newData.splice(index, 1);
            setTrainingCourses(newData);
          }}
        />
      )
    }
  ];

  const preparationColumns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1
    },
    {
      title: 'Nội dung',
      dataIndex: 'content',
      key: 'content',
      render: (_, record, index) => (
        <Input.TextArea
          value={record.content}
          onChange={(e) => {
            const newData = [...preparationTasks];
            newData[index].content = e.target.value;
            setPreparationTasks(newData);
          }}
        />
      )
    },
    {
      title: 'Bộ phận thực hiện',
      dataIndex: 'department',
      key: 'department',
      render: (_, record, index) => (
        <Input
          value={record.department}
          onChange={(e) => {
            const newData = [...preparationTasks];
            newData[index].department = e.target.value;
            setPreparationTasks(newData);
          }}
        />
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (_, __, index) => (
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />}
          onClick={() => {
            const newData = [...preparationTasks];
            newData.splice(index, 1);
            setPreparationTasks(newData);
          }}
        />
      )
    }
  ];

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setProgress(0);
      
      // Bắt đầu progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Log chi tiết các giá trị form
      console.log('Form values:', JSON.stringify(values, null, 2));

      // Kiểm tra các trường bắt buộc
      const requiredFields = [
        'candidateId', 
        'hrInCharge', 
        'position', 
        'department', 
        'branch',
        'gender',
        'birthDate',
        'idCard.number',
        'idCard.issueDate',
        'idCard.issuePlace',
        'startDate'
      ];
      
      const missingFields = requiredFields.filter(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], values);
        console.log(`Checking field ${field}:`, value); // Log từng trường
        return !value;
      });
      
      if (missingFields.length > 0) {
        console.log('Missing fields:', missingFields); // Log các trường thiếu
        message.error(`Vui lòng điền đầy đủ thông tin: ${missingFields.join(', ')}`);
        return;
      }

      // Kiểm tra ảnh
      if (!values.personalPhoto?.fileList?.[0]?.originFileObj) {
        message.error('Vui lòng tải lên ảnh cá nhân');
        return;
      }

      if (!values.idCard?.photos?.fileList?.[0]?.originFileObj) {
        message.error('Vui lòng tải lên ảnh CMND/CCCD');
        return;
      }

      // Kiểm tra dữ liệu từ state
      if (trainingCourses.length > 0) {
        const invalidTrainingCourses = trainingCourses.filter(course => 
          !course.name || !course.issuedBy || !course.year
        );
        if (invalidTrainingCourses.length > 0) {
          message.error('Vui lòng điền đầy đủ thông tin cho các khóa huấn luyện');
          return;
        }
      }

      if (preparationTasks.length > 0) {
        const invalidTasks = preparationTasks.filter(task => 
          !task.content || !task.department
        );
        if (invalidTasks.length > 0) {
          message.error('Vui lòng điền đầy đủ thông tin cho các công việc cần chuẩn bị');
          return;
        }
      }

      // Tạo object chứa tất cả dữ liệu
      const notificationData = {
        candidateId: values.candidateId,
        position: values.position,
        department: values.department,
        branch: values.branch,
        hrInCharge: values.hrInCharge,
        gender: values.gender,
        birthDate: values.birthDate?.format('YYYY-MM-DD'),
        idCard: {
          number: values.idCard?.number,
          issueDate: values.idCard?.issueDate?.format('YYYY-MM-DD'),
          issuePlace: values.idCard?.issuePlace
        },
        startDate: values.startDate?.format('YYYY-MM-DD'),
        insuranceNumber: values.insuranceNumber,
        taxCode: values.taxCode,
        bankAccount: {
          number: values.bankAccount?.number,
          bank: values.bankAccount?.bank
        },
        phone: values.phone,
        email: values.email,
        permanentAddress: values.permanentAddress,
        emergencyContact: {
          name: values.emergencyContact?.name || '',
          relationship: values.emergencyContact?.relationship || '',
          phone: values.emergencyContact?.phone || '',
          email: values.emergencyContact?.email || '',
          address: values.emergencyContact?.address || ''
        },
        education: {
          level: values.education?.level || 'other',
          schoolName: values.education?.schoolName || '',
          major: values.education?.major || '',
          graduationYear: values.education?.graduationYear || ''
        },
        expectedSalary: values.expectedSalary,
        contractType: values.contractType,
        documents: values.documents || [],
        trainingCourses: trainingCourses.map(course => ({
          name: course.name,
          issuedBy: course.issuedBy,
          year: course.year
        })),
        preparationTasks: preparationTasks.map(task => ({
          content: task.content,
          department: task.department
        }))
      };

      // Log để kiểm tra dữ liệu
      console.log('Notification data:', JSON.stringify(notificationData, null, 2));

      // Tạo FormData và thêm dữ liệu
      const formData = new FormData();
      formData.append('data', JSON.stringify(notificationData));

      // Thêm file nếu có
      if (values.personalPhoto?.fileList?.[0]?.originFileObj) {
        formData.append('personalPhoto', values.personalPhoto.fileList[0].originFileObj);
        console.log('Adding personal photo:', values.personalPhoto.fileList[0].originFileObj);
      }

      // Thêm ảnh CCCD nếu có
      if (values.idCard?.photos?.fileList) {
        values.idCard.photos.fileList.forEach((file, index) => {
          if (file.originFileObj) {
            formData.append('idCardPhotos', file.originFileObj);
            console.log(`Adding ID card photo ${index + 1}:`, file.originFileObj);
          }
        });
      }

      // Log FormData contents for debugging
      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      }

      try {
        console.log('Sending request to API...');
        const response = await notificationService.createNotification(formData);
        console.log('Response:', response);
        
        // Set progress to 100% when successful
        setProgress(100);
        clearInterval(progressInterval);
        
        message.success('Tạo thông báo thành công');
        navigate('/notifications');
      } catch (error) {
        clearInterval(progressInterval);
        setProgress(0);
        console.error('API Error details:', error.response?.data);
        console.error('Error status:', error.response?.status);
        console.error('Error message:', error.message);
        
        // Hiển thị thông báo lỗi chi tiết
        if (error.response?.data?.errors && error.response.data.errors.length > 0) {
          error.response.data.errors.forEach(err => {
            message.error(err);
          });
        } else {
          message.error(error.response?.data?.message || 'Lỗi khi tạo thông báo');
        }
      }
    } catch (error) {
      setProgress(0);
      console.error('Error creating notification:', error);
      message.error('Lỗi khi tạo thông báo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 pt-[104px] pl-[298px]">
      <Spin spinning={loading}>
        <div className="bg-white rounded-lg shadow p-6">
          {loading && (
            <div style={{ marginBottom: '20px' }}>
              <Progress 
                percent={progress} 
                status={progress === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
            </div>
          )}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/notifications')}
            >
              Quay lại
            </Button>
            <Title level={4} className="m-0">Khởi tạo thông báo ứng viên mới</Title>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="max-w-[800px]"
            initialValues={{
              personalPhoto: { fileList: [] },
              'idCard.photos': { fileList: [] }
            }}
          >
            {/* THÔNG TIN TIẾP NHẬN */}
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-4">THÔNG TIN TIẾP NHẬN</h2>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label={<span>Họ và tên <span className="text-red-500">*</span></span>}
                  name="candidateId"
                  rules={[{ required: true, message: 'Vui lòng chọn ứng viên' }]}
                >
                  <Select 
                    onChange={onCandidateChange}
                    placeholder="Chọn ứng viên"
                    notFoundContent={candidates.length === 0 ? "Không có ứng viên nào khả dụng. Tất cả ứng viên đã được tạo thông báo." : null}
                  >
                    {candidates.map(candidate => (
                      <Option key={candidate._id} value={candidate._id}>{candidate.name}</Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Chức vụ"
                  name="position"
                >
                  <Input disabled />
                </Form.Item>

                <Form.Item
                  label="Phòng"
                  name="department"
                >
                  <Input disabled />
                </Form.Item>

                <Form.Item
                  label="Chi nhánh"
                  name="branch"
                >
                  <Input disabled />
                </Form.Item>

                <Form.Item
                  label={<span>Nhân sự phụ trách <span className="text-red-500">*</span></span>}
                  name="hrInCharge"
                  rules={[{ required: true, message: 'Vui lòng chọn nhân sự phụ trách' }]}
                >
                  <Select>
                    {hrList.map(hr => (
                      <Option key={hr._id} value={hr._id}>{hr.fullName}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </div>

            {/* THÔNG TIN CÁ NHÂN */}
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-4">THÔNG TIN CÁ NHÂN</h2>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label={<span>Ảnh cá nhân <span className="text-red-500">*</span></span>}
                  name="personalPhoto"
                  rules={[{ required: true, message: 'Vui lòng tải lên ảnh cá nhân' }]}
                  className="col-span-2"
                >
                  <Upload
                    listType="picture-card"
                    maxCount={1}
                    fileList={fileList.personalPhoto}
                    onChange={({ fileList }) => setFileList(prev => ({ ...prev, personalPhoto: fileList }))}
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  </Upload>
                </Form.Item>

                <Form.Item
                  label={<span>Giới tính <span className="text-red-500">*</span></span>}
                  name="gender"
                  rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
                >
                  <Radio.Group>
                    <Radio value="male">Nam</Radio>
                    <Radio value="female">Nữ</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  label={<span>Ngày sinh <span className="text-red-500">*</span></span>}
                  name="birthDate"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}
                >
                  <DatePicker className="w-full" />
                </Form.Item>

                <Form.Item
                  label={<span>CMND/CCCD <span className="text-red-500">*</span></span>}
                  name={['idCard', 'number']}
                  rules={[{ required: true, message: 'Vui lòng nhập số CMND/CCCD' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label={<span>Ngày cấp <span className="text-red-500">*</span></span>}
                  name={['idCard', 'issueDate']}
                  rules={[{ required: true, message: 'Vui lòng chọn ngày cấp' }]}
                >
                  <DatePicker className="w-full" />
                </Form.Item>

                <Form.Item
                  label={<span>Nơi cấp <span className="text-red-500">*</span></span>}
                  name={['idCard', 'issuePlace']}
                  rules={[{ required: true, message: 'Vui lòng nhập nơi cấp' }]}
                  className="col-span-2"
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label={<span>Ảnh CMND/CCCD <span className="text-red-500">*</span></span>}
                  name={['idCard', 'photos']}
                  rules={[{ required: true, message: 'Vui lòng tải lên ảnh CMND/CCCD' }]}
                  className="col-span-2"
                >
                  <Upload
                    listType="picture-card"
                    maxCount={2}
                    fileList={fileList.idCardPhotos}
                    onChange={({ fileList }) => setFileList(prev => ({ ...prev, idCardPhotos: fileList }))}
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  </Upload>
                </Form.Item>
              </div>

              <h3 className="text-base font-medium mt-6 mb-4">Thông tin khác:</h3>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label={<span>Ngày vào làm việc <span className="text-red-500">*</span></span>}
                  name="startDate"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày vào làm việc' }]}
                >
                  <DatePicker className="w-full" />
                </Form.Item>

                <Form.Item
                  label="Mã số thuế cá nhân"
                  name="taxCode"
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Số tài khoản"
                  name={['bankAccount', 'number']}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Tại ngân hàng"
                  name={['bankAccount', 'bank']}
                >
                  <Input />
                </Form.Item>
              </div>
            </div>

            {/* THÔNG TIN LIÊN HỆ */}
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-4">THÔNG TIN LIÊN HỆ</h2>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label="Số điện thoại"
                  name="phone"
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Địa chỉ thường trú"
                  name="permanentAddress"
                  className="col-span-2"
                >
                  <Input />
                </Form.Item>
              </div>

              <h3 className="text-base font-medium mt-6 mb-4">Liên hệ khẩn:</h3>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label="Họ tên"
                  name={['emergencyContact', 'name']}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Mối quan hệ"
                  name={['emergencyContact', 'relationship']}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Số điện thoại"
                  name={['emergencyContact', 'phone']}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name={['emergencyContact', 'email']}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Địa chỉ"
                  name={['emergencyContact', 'address']}
                  className="col-span-2"
                >
                  <Input />
                </Form.Item>
              </div>
            </div>

            {/* HỌC VẤN */}
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-4">HỌC VẤN</h2>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label="Trình độ"
                  name={['education', 'level']}
                >
                  <Select>
                    <Option value="postgraduate">Sau đại học</Option>
                    <Option value="university">Đại học</Option>
                    <Option value="college">Cao đẳng</Option>
                    <Option value="other">Khác</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Tên trường"
                  name={['education', 'schoolName']}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Chuyên ngành"
                  name={['education', 'major']}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Năm tốt nghiệp"
                  name={['education', 'graduationYear']}
                >
                  <Input />
                </Form.Item>
              </div>
            </div>

            {/* Các khóa huấn luyện, đào tạo */}
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-4">Các khóa huấn luyện, đào tạo/ Chứng chỉ (Tin học, ngoại ngữ, chứng chỉ chuyên môn, ...)</h2>
              <Table
                columns={trainingColumns}
                dataSource={trainingCourses}
                pagination={false}
                rowKey="id"
              />
              <Button 
                type="dashed" 
                block 
                icon={<PlusOutlined />}
                onClick={() => setTrainingCourses([...trainingCourses, { id: Date.now(), name: '', issuedBy: '', year: '' }])}
                className="mt-4"
              >
                Thêm 1 dòng
              </Button>
            </div>

            {/* NGUYỆN VỌNG */}
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-4">NGUYỆN VỌNG</h2>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label="Mức lương"
                  name="expectedSalary"
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Loại hợp đồng"
                  name="contractType"
                >
                  <Input />
                </Form.Item>
              </div>
            </div>

            {/* HỒ SƠ CÁ NHÂN NỘP CÔNG TY */}
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-4">HỒ SƠ CÁ NHÂN NỘP CÔNG TY</h2>
              <Form.Item name="documents">
                <Checkbox.Group>
                  <Space direction="vertical">
                    <Checkbox value="personalInfo">Sơ yếu lý lịch</Checkbox>
                    <Checkbox value="criminalRecord">Lý lịch tư pháp</Checkbox>
                    <Checkbox value="photos">Ảnh</Checkbox>
                    <Checkbox value="healthCert">Giấy khám sức khỏe</Checkbox>
                    <Checkbox value="degree">Bằng cấp</Checkbox>
                    <Checkbox value="idCard">CCCD</Checkbox>
                    <Checkbox value="householdReg">Sổ hộ khẩu</Checkbox>
                    <Checkbox value="insurance">Sổ BHXH</Checkbox>
                  </Space>
                </Checkbox.Group>
              </Form.Item>
            </div>

            {/* CÔNG VIỆC CẦN CHUẨN BỊ */}
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-4">CÔNG VIỆC CẦN CHUẨN BỊ</h2>
              <Table
                columns={preparationColumns}
                dataSource={preparationTasks}
                pagination={false}
                rowKey="id"
              />
              <Button 
                type="dashed" 
                block 
                icon={<PlusOutlined />}
                onClick={() => setPreparationTasks([...preparationTasks, { id: Date.now(), content: '', department: '' }])}
                className="mt-4"
              >
                Thêm 1 dòng
              </Button>
            </div>

            <div className="flex justify-end gap-4">
              <Button onClick={() => navigate('/notifications')}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                Lưu
              </Button>
            </div>
          </Form>
        </div>
      </Spin>
    </div>
  );
};

export default CreateNotification; 