const Position = require('../models/Position');
const Application = require('../models/Application');
const { generateDocx, generatePdf } = require('../utils/jdGenerator');
const fs = require('fs');
const path = require('path');
const Candidate = require('../models/Candidate');

// Tạo vị trí mới
exports.createPosition = async (req, res) => {
  try {
    const position = new Position({
      ...req.body,
      creator: req.user._id // Lấy từ middleware auth
    });

    await position.save();

    res.status(201).json({
      message: 'Tạo vị trí thành công',
      data: position
    });
  } catch (error) {
    console.error('Error in createPosition:', error);
    res.status(500).json({ message: 'Lỗi khi tạo vị trí' });
  }
};

// Lấy danh sách vị trí với phân trang
exports.getPositions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const type = req.query.type;
    const mode = req.query.mode;

    // Xây dựng query
    let query = {};

    // Mapping phòng ban từ tiếng Anh sang tiếng Việt
    const departmentMapping = {
      'accounting': 'kế toán',
      'marketing': 'marketing',
      'it': 'it',
      'hr': 'nhân sự',
      'sales': 'kinh doanh'
    };

    // Nếu là trưởng phòng ban (không phải HR), chỉ lấy vị trí của phòng mình
    if (req.user.role === 'department_head' && req.user.department !== 'hr') {
      // Lấy tên phòng ban tiếng Việt tương ứng
      const departmentVi = departmentMapping[req.user.department.toLowerCase()] || req.user.department;
      
      // Tìm kiếm không phân biệt chữ hoa/thường và chấp nhận cả tên tiếng Anh và tiếng Việt
      query.department = {
        $regex: `^(${req.user.department}|${departmentVi})$`,
        $options: 'i'
      };
    }

    // Thêm điều kiện tìm kiếm
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    // Thêm điều kiện lọc theo type
    if (type && type !== 'all') {
      query.type = type;
    }

    // Thêm điều kiện lọc theo mode
    if (mode && mode !== 'all') {
      query.mode = mode;
    }

    // Thực hiện query với các điều kiện
    const positions = await Position.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', 'name');
    
    const total = await Position.countDocuments(query);

    // Đếm tổng số ứng viên cho mỗi vị trí (không phân biệt trạng thái)
    const positionsWithCandidateCount = await Promise.all(positions.map(async (position) => {
      const candidateCount = await Candidate.countDocuments({ positionId: position._id });
      return {
        ...position.toObject(),
        applicants: candidateCount
      };
    }));

    // Kiểm tra quyền thêm mới
    const canCreate = req.user.role === 'ceo' || (req.user.role === 'department_head' && req.user.department === 'hr');

    res.json({
      message: 'Lấy danh sách vị trí thành công',
      data: positionsWithCandidateCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      },
      permissions: {
        canCreate
      }
    });
  } catch (error) {
    console.error('Error in getPositions:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách vị trí' });
  }
};

// Lấy chi tiết một vị trí
exports.getPositionById = async (req, res) => {
  try {
    const position = await Position.findById(req.params.id)
      .populate('creator', 'name');

    if (!position) {
      return res.status(404).json({ message: 'Không tìm thấy vị trí' });
    }

    res.json({
      message: 'Lấy thông tin vị trí thành công',
      data: position
    });
  } catch (error) {
    console.error('Error in getPositionById:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin vị trí' });
  }
};

// Cập nhật vị trí
exports.updatePosition = async (req, res) => {
  try {
    const position = await Position.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!position) {
      return res.status(404).json({ message: 'Không tìm thấy vị trí' });
    }

    res.json({
      message: 'Cập nhật vị trí thành công',
      data: position
    });
  } catch (error) {
    console.error('Error in updatePosition:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật vị trí' });
  }
};

// Xóa vị trí
exports.deletePosition = async (req, res) => {
  try {
    const position = await Position.findByIdAndDelete(req.params.id);

    if (!position) {
      return res.status(404).json({ message: 'Không tìm thấy vị trí' });
    }

    res.json({
      message: 'Xóa vị trí thành công'
    });
  } catch (error) {
    console.error('Error in deletePosition:', error);
    res.status(500).json({ message: 'Lỗi khi xóa vị trí' });
  }
};

// Tự động cập nhật trạng thái vị trí dựa trên số lượng ứng viên
exports.updatePositionStatus = async (positionId) => {
  try {
    const position = await Position.findById(positionId);
    if (!position) {
      console.error(`Không tìm thấy vị trí với ID: ${positionId}`);
      return;
    }

    // Tìm application tương ứng
    const application = await Application.findOne({ 
      position: position.title, 
      department: position.department 
    });

    if (application) {
      // Đếm số lượng ứng viên ở trạng thái 'hired'
      const hiredCandidates = await Candidate.countDocuments({
        positionId: positionId,
        stage: 'hired'
      });

      // Cập nhật số lượng ứng viên đã tuyển
      position.applicants = hiredCandidates;
      
      // Cập nhật trạng thái dựa trên số lượng ứng viên đã tuyển
      if (hiredCandidates >= application.quantity) {
        position.status = 'Đã đủ';
      } else if (position.status === 'Đã đủ' && hiredCandidates < application.quantity) {
        position.status = 'Còn tuyển';
      }
      
      await position.save();
      console.log(`Đã cập nhật trạng thái vị trí ${position.title} thành ${position.status}`);
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái vị trí:', error);
  }
};

// Tải xuống JD theo định dạng
exports.downloadJD = async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.query;
    
    // Validate format
    if (!format || !['docx', 'pdf'].includes(format.toLowerCase())) {
      return res.status(400).json({ message: 'Định dạng không hợp lệ. Vui lòng chọn docx hoặc pdf' });
    }
    
    // Find the position
    const position = await Position.findById(id);
    if (!position) {
      return res.status(404).json({ message: 'Không tìm thấy vị trí' });
    }
    
    try {
      // Generate the file based on format
      let filePath;
      if (format.toLowerCase() === 'docx') {
        filePath = await generateDocx(position);
        // Set headers for DOCX file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(position.title.replace(/\s+/g, '_') + '_JD.docx')}`);
      } else {
        filePath = await generatePdf(position);
        // Set headers for PDF file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(position.title.replace(/\s+/g, '_') + '_JD.pdf')}`);
      }
      
      // Stream the file to the client
      const fileStream = fs.createReadStream(filePath);
      fileStream.on('error', (error) => {
        console.error('Error streaming file:', error);
        res.status(500).json({ message: 'Lỗi khi tải xuống file' });
      });
      
      fileStream.pipe(res);
      
      // Clean up the file after streaming
      fileStream.on('end', () => {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting temporary file:', err);
        });
      });
    } catch (genError) {
      console.error('Error generating file:', genError);
      if (format.toLowerCase() === 'docx') {
        return res.status(500).json({ message: 'Lỗi khi tạo file DOCX. Vui lòng thử lại sau.' });
      } else {
        return res.status(500).json({ message: 'Lỗi khi tạo file PDF. Vui lòng thử lại sau.' });
      }
    }
  } catch (error) {
    console.error('Error in downloadJD:', error);
    res.status(500).json({ message: 'Lỗi khi tải xuống JD' });
  }
};

// Lấy danh sách vị trí tuyển dụng đang active
exports.getActivePositions = async (req, res) => {
  try {
    const positions = await Position.find({ status: 'Còn tuyển' })
      .select('title type workMode salary department')
      .lean();

    const formattedPositions = positions.map(position => ({
      title: position.title,
      type: position.type || 'Full-time',
      workMode: position.workMode || 'On-site',
      salary: position.salary || 'Thỏa thuận',
      department: position.department,
      applicants: '0' // Mặc định là 0, sau này có thể cập nhật từ bảng Applications
    }));

    res.json(formattedPositions);
  } catch (error) {
    console.error('Error in getActivePositions:', error);
    res.status(500).json({ error: 'Không thể lấy danh sách vị trí tuyển dụng' });
  }
}; 