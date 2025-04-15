const Application = require('../models/Application');
const Notification = require('../models/Notification');
const User = require('../models/User');
const RecruitmentNotification = require('../models/RecruitmentNotification');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// ✅ Tạo đơn tuyển dụng mới
const createApplication = async (req, res) => {
  try {
    // Chuẩn hóa dữ liệu đầu vào
    const applicationData = { ...req.body };
    
    // Chuẩn hóa department thành tên phòng ban tiếng Việt
    if (applicationData.department) {
      // Map mã phòng ban sang tên phòng ban tiếng Việt
      const departmentMapping = {
        'accounting': 'kế toán',
        'marketing': 'marketing',
        'it': 'it',
        'hr': 'nhân sự',
        'sales': 'kinh doanh'
      };
      
      // Nếu department là mã tiếng Anh, chuyển sang tên tiếng Việt
      if (departmentMapping[applicationData.department.toLowerCase()]) {
        applicationData.department = departmentMapping[applicationData.department.toLowerCase()];
      } else {
        // Nếu không tìm thấy trong mapping, giữ nguyên giá trị
        applicationData.department = applicationData.department;
      }
    }
    
    const application = new Application({
      ...applicationData,
      userId: req.user._id,
      requester: req.user._id,  // Người tạo đơn chính là requester
      status: applicationData.status
    });
    
    const savedApplication = await application.save();
    res.status(201).json(savedApplication);
  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi khi tạo yêu cầu tuyển dụng',
      error: error.message 
    });
  }
};

// ✅ Lấy danh sách đơn tuyển dụng của người dùng hiện tại
const getApplications = async (req, res) => {
  try {
    let query = {};
    
    // Nếu là trưởng phòng ban (không phải HR), chỉ lấy yêu cầu của phòng mình
    if (req.user.role === 'department_head' && req.user.department !== 'hr') {
      // Map mã phòng ban sang tên phòng ban tiếng Việt
      const departmentMapping = {
        'accounting': 'kế toán',
        'marketing': 'marketing',
        'it': 'it',
        'hr': 'nhân sự',
        'sales': 'kinh doanh'
      };
      
      const departmentName = departmentMapping[req.user.department] || req.user.department;
      
      // Sử dụng RegExp để tìm kiếm không phân biệt chữ hoa/thường và dấu
      query.department = new RegExp(`^${departmentName}$`, 'i');
      
      console.log('Department filter:', {
        userDepartment: req.user.department,
        mappedDepartment: departmentName,
        query: query.department
      });
    }

    const applications = await Application.find(query)
      .populate('userId', 'username fullName')
      .sort({ createdAt: -1 });

    // Kiểm tra quyền thêm mới
    const canCreate = req.user.role === 'ceo' || req.user.role === 'hr' || 
      (req.user.role === 'department_head' && req.user.department === 'hr');

    const formattedApplications = applications.map(app => {
      const createdDate = new Date(app.createdAt);
      return {
        _id: app._id,
        id: app._id,
        requester: {
          _id: app.userId?._id,
          username: app.userId?.username,
          fullName: app.userId?.fullName
        },
        responsible: app.responsible ? {
          _id: app.responsible?._id,
          username: app.responsible?.username,
          fullName: app.responsible?.fullName
        } : null,
        position: app.position,
        quantity: app.quantity,
        department: app.department,
        date: createdDate,
        createdAt: app.createdAt,
        status: app.status || 'Chờ nộp',
        mainLocation: app.mainLocation,
        otherLocations: app.otherLocations,
        reason: app.reason,
        budget: app.budget,
        jobDescription: app.jobDescription,
        requirements: app.requirements,
        benefits: app.benefits
      };
    });

    res.status(200).json({
      applications: formattedApplications,
      permissions: {
        canCreate
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ 
      error: 'Có lỗi xảy ra khi tải danh sách yêu cầu tuyển dụng' 
    });
  }
};

// ✅ Cập nhật đơn tuyển dụng
const updateApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select('-__v');
    
    if (!application) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu tuyển dụng' });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi khi cập nhật yêu cầu tuyển dụng',
      error: error.message 
    });
  }
};

// ✅ Xóa đơn tuyển dụng
const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra xem yêu cầu có tồn tại không
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu tuyển dụng' });
    }
    
    // Kiểm tra quyền xóa
    // Nếu là trưởng phòng ban, chỉ cho phép xóa yêu cầu do họ tạo ra
    if (req.isDepartmentHead) {
      // Kiểm tra xem người dùng có phải là người tạo yêu cầu không
      if (application.requester.toString() !== req.userId.toString()) {
        return res.status(403).json({ 
          message: 'Bạn chỉ có quyền xóa yêu cầu tuyển dụng do mình tạo ra' 
        });
      }
    }
    
    // Thực hiện xóa
    await Application.findByIdAndDelete(id);
    res.status(200).json({ message: 'Xóa yêu cầu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Có lỗi xảy ra khi xóa yêu cầu' });
  }
};

// ✅ Lấy chi tiết một phiếu tuyển dụng
const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('requester', 'fullName username')
      .populate('userId', 'fullName username')
      .select('-__v');
    
    if (!application) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu tuyển dụng' });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi khi lấy chi tiết yêu cầu tuyển dụng',
      error: error.message 
    });
  }
};

// Cập nhật status của application
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const application = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('-__v'); // Không trả về trường __v
    
    if (!application) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu tuyển dụng' });
    }

    // Nếu CEO phê duyệt, tạo thông báo cho người lập phiếu
    if (req.user.role === 'ceo' && status === 'Đã duyệt') {
      const notification = new RecruitmentNotification({
        recruitmentId: application._id,
        position: application.position,
        department: application.department,
        requester: application.requester,
        message: 'Phiếu YCTD của bạn đã được CEO phê duyệt'
      });

      await notification.save();
    }
    
    res.json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  updateApplicationStatus
};