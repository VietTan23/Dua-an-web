const Candidate = require('../models/Candidate');
const Position = require('../models/Position');
const cloudinary = require('cloudinary');
const Application = require('../models/Application');
const path = require('path');
const fs = require('fs');

// Lấy danh sách ứng viên theo vị trí
exports.getCandidatesByPosition = async (req, res) => {
  try {
    const { positionId } = req.params;
    
    // Kiểm tra vị trí có tồn tại không
    const position = await Position.findById(positionId);
    if (!position) {
      return res.status(404).json({ message: 'Không tìm thấy vị trí tuyển dụng' });
    }

    // Lấy danh sách ứng viên theo vị trí
    const candidates = await Candidate.find({ positionId })
      .sort({ createdAt: -1 });

    res.json({
      candidates
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi tải danh sách ứng viên' });
  }
};

// Thêm ứng viên mới
exports.createCandidate = async (req, res) => {
  try {
    const { positionId } = req.params;
    const candidateData = req.body;

    // Log để debug
    console.log('Request body:', req.body);
    console.log('Files:', req.files);
    console.log('Uploaded files:', req.uploadedFiles);

    // Kiểm tra vị trí có tồn tại không
    const position = await Position.findById(positionId);
    if (!position) {
      return res.status(404).json({ message: 'Không tìm thấy vị trí tuyển dụng' });
    }

    // Kiểm tra các trường bắt buộc
    if (!candidateData.name || !candidateData.email || !candidateData.phone || !candidateData.source) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
    }

    // Kiểm tra customSource khi source là 'Khác'
    if (candidateData.source === 'Khác' && !candidateData.customSource) {
      return res.status(400).json({ message: 'Vui lòng nhập nguồn khác' });
    }

    // Kiểm tra xem có ít nhất một CV được upload hoặc link CV được cung cấp
    if ((!req.uploadedFiles || req.uploadedFiles.length === 0) && !candidateData.cvLink) {
      return res.status(400).json({ message: 'Vui lòng upload ít nhất một CV hoặc cung cấp link CV' });
    }

    // Tạo mảng CV từ các file đã upload
    const cvArray = [];
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      req.uploadedFiles.forEach(file => {
        cvArray.push({
          url: file.url,
          public_id: file.public_id,
          fileName: file.fileName,
          uploadDate: new Date()
        });
      });
    }

    // Tạo ứng viên mới
    const candidate = new Candidate({
      name: candidateData.name,
      email: candidateData.email,
      phone: candidateData.phone,
      source: candidateData.source,
      customSource: candidateData.customSource,
      notes: candidateData.notes,
      positionId,
      stage: 'new',
      cv: cvArray,
      cvLink: candidateData.cvLink || ''
    });

    console.log('Candidate to save:', candidate);

    await candidate.save();

    // Không cập nhật số lượng ứng viên khi tạo mới vì ứng viên mới luôn ở trạng thái 'new'
    // Chỉ cập nhật khi ứng viên được chuyển sang trạng thái 'hired'

    res.status(201).json({
      message: 'Thêm ứng viên thành công',
      candidate
    });
  } catch (error) {
    console.error('Error creating candidate:', error);
    
    // Xử lý các loại lỗi cụ thể
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Dữ liệu không hợp lệ',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({ 
        message: 'Email đã tồn tại trong hệ thống'
      });
    }

    // Log chi tiết lỗi để debug
    console.error('Detailed error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    res.status(500).json({ 
      message: 'Có lỗi xảy ra khi tạo ứng viên',
      error: error.message 
    });
  }
};

// Cập nhật trạng thái ứng viên
exports.updateCandidateStatus = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { stage } = req.body;

    console.log('Updating candidate status:', {
      candidateId,
      stage,
      body: req.body,
      headers: req.headers
    });

    // Kiểm tra giá trị stage có hợp lệ không
    const validStages = ['new', 'reviewing', 'interview1', 'interview2', 'offer', 'hired', 'rejected', 'archived'];
    if (!stage) {
      return res.status(400).json({ 
        message: 'Trường stage là bắt buộc',
        validStages
      });
    }

    if (!validStages.includes(stage)) {
      return res.status(400).json({ 
        message: 'Trạng thái không hợp lệ',
        receivedStage: stage,
        validStages
      });
    }

    // Tìm candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Không tìm thấy ứng viên' });
    }

    console.log('Current candidate:', candidate);

    // Lưu trạng thái cũ để kiểm tra
    const oldStage = candidate.stage;
    
    // Cập nhật trạng thái mới
    candidate.stage = stage;
    
    try {
      // Sử dụng findOneAndUpdate để cập nhật trường stage
      const updatedCandidate = await Candidate.findOneAndUpdate(
        { _id: candidateId },
        { $set: { stage: stage } },
        { new: true }
      );

      console.log('Updated candidate:', updatedCandidate);

      // Cập nhật số lượng ứng viên của vị trí dựa trên trạng thái
      const position = await Position.findById(candidate.positionId);
      if (position) {
        // Nếu chuyển từ trạng thái khác sang 'hired', tăng số lượng
        if (oldStage !== 'hired' && stage === 'hired') {
          position.applicants = (position.applicants || 0) + 1;
        } 
        // Nếu chuyển từ 'hired' sang trạng thái khác, giảm số lượng
        else if (oldStage === 'hired' && stage !== 'hired') {
          position.applicants = Math.max(0, (position.applicants || 0) - 1);
        }
        
        await position.save();

        // Kiểm tra và cập nhật trạng thái vị trí nếu đã đủ số lượng
        const application = await Application.findOne({ position: position.title, department: position.department });
        if (application) {
          if (position.applicants >= application.quantity) {
            position.status = 'Đã đủ';
          } else if (position.status === 'Đã đủ' && position.applicants < application.quantity) {
            position.status = 'Còn tuyển';
          }
          await position.save();
        }
      }

      res.json({
        message: 'Cập nhật trạng thái ứng viên thành công',
        candidate: updatedCandidate
      });
    } catch (updateError) {
      console.error('Error updating candidate:', updateError);
      res.status(500).json({ 
        message: 'Có lỗi xảy ra khi cập nhật trạng thái ứng viên',
        error: updateError.message 
      });
    }
  } catch (error) {
    console.error('Error updating candidate status:', error);
    res.status(500).json({ 
      message: 'Có lỗi xảy ra khi cập nhật trạng thái ứng viên',
      error: error.message 
    });
  }
};

// Xóa ứng viên
exports.deleteCandidate = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Không tìm thấy ứng viên' });
    }

    // Xóa file trên Cloudinary
    if (candidate.cv.public_id) {
      await cloudinary.uploader.destroy(candidate.cv.public_id);
    }

    // Cập nhật số lượng ứng viên của vị trí nếu ứng viên đang ở trạng thái 'hired'
    const position = await Position.findById(candidate.positionId);
    if (position && candidate.stage === 'hired') {
      position.applicants = Math.max(0, (position.applicants || 0) - 1);
      await position.save();
      
      // Kiểm tra và cập nhật trạng thái vị trí
      const application = await Application.findOne({ position: position.title, department: position.department });
      if (application && position.applicants < application.quantity) {
        position.status = 'Còn tuyển';
        await position.save();
      }
    }

    await candidate.deleteOne();

    res.json({
      message: 'Xóa ứng viên thành công'
    });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi xóa ứng viên' });
  }
};

// Cập nhật thông tin ứng viên
exports.updateCandidate = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const candidateData = req.body;

    // Log để debug
    console.log('Update candidate request:', {
      candidateId,
      body: req.body,
      files: req.files,
      uploadedFiles: req.uploadedFiles
    });

    // Tìm ứng viên
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Không tìm thấy ứng viên' });
    }

    // Xử lý xóa CV cũ nếu có yêu cầu
    if (candidateData.deleteExistingCV === 'true' && candidate.cv && candidate.cv.length > 0) {
      console.log('Deleting existing CVs:', candidate.cv);
      
      // Xóa các file cũ trên Cloudinary
      for (const file of candidate.cv) {
        if (file.public_id) {
          try {
            await cloudinary.uploader.destroy(file.public_id);
            console.log('Deleted file from Cloudinary:', file.public_id);
          } catch (error) {
            console.error('Error deleting file from Cloudinary:', error);
          }
        }
      }
      
      // Xóa mảng CV cũ
      candidate.cv = [];
    }

    // Thêm CV mới nếu có
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      console.log('Adding new CVs:', req.uploadedFiles);
      
      const newCVs = req.uploadedFiles.map(file => ({
        url: file.url,
        public_id: file.public_id,
        fileName: file.fileName,
        uploadDate: new Date()
      }));

      // Nếu đã xóa CV cũ, thêm mới hoàn toàn
      if (candidateData.deleteExistingCV === 'true') {
        candidate.cv = newCVs;
      } else {
        // Nếu không, thêm vào mảng CV hiện tại
        candidate.cv = [...candidate.cv, ...newCVs];
      }
    }

    // Cập nhật các thông tin khác
    candidate.name = candidateData.name || candidate.name;
    candidate.email = candidateData.email || candidate.email;
    candidate.phone = candidateData.phone || candidate.phone;
    candidate.source = candidateData.source || candidate.source;
    candidate.customSource = candidateData.customSource;
    candidate.notes = candidateData.notes;
    candidate.cvLink = candidateData.cvLink || candidate.cvLink;

    // Lưu thay đổi
    const updatedCandidate = await candidate.save();
    console.log('Updated candidate:', updatedCandidate);

    res.json({
      message: 'Cập nhật thông tin ứng viên thành công',
      candidate: updatedCandidate
    });
  } catch (error) {
    console.error('Error updating candidate:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Dữ liệu không hợp lệ',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ 
      message: 'Có lỗi xảy ra khi cập nhật thông tin ứng viên',
      error: error.message 
    });
  }
};

// Lấy tất cả ứng viên
exports.getAllCandidates = async (req, res) => {
  try {
    let pipeline = [
      {
        $lookup: {
          from: 'positions',
          localField: 'positionId',
          foreignField: '_id',
          as: 'position'
        }
      },
      {
        $unwind: {
          path: '$position',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // Nếu là trưởng phòng ban (không phải HR), chỉ lấy ứng viên của phòng mình
    if (req.user.role === 'department_head' && req.user.department !== 'hr') {
      pipeline.push({
        $match: {
          'position.department': req.user.department
        }
      });
    }

    pipeline.push({
      $sort: { createdAt: -1 }
    });

    const candidates = await Candidate.aggregate(pipeline);

    // Kiểm tra quyền gửi email
    const canSendEmail = req.user.role === 'ceo' || req.user.role === 'hr' || 
      (req.user.role === 'department_head' && req.user.department === 'hr');

    res.json({
      candidates: candidates.map(candidate => ({
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        positionId: candidate.position ? {
          _id: candidate.position._id,
          title: candidate.position.title,
          department: candidate.position.department
        } : null,
        stage: candidate.stage,
        source: candidate.source,
        customSource: candidate.customSource,
        cv: candidate.cv,
        notes: candidate.notes,
        emailStatus: candidate.emailStatus,
        createdAt: candidate.createdAt
      })),
      permissions: {
        canSendEmail
      }
    });
  } catch (error) {
    console.error('Error in getAllCandidates:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi tải danh sách ứng viên' });
  }
};

// Lấy chi tiết ứng viên
exports.getCandidateById = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const candidate = await Candidate.findById(candidateId)
      .populate({
        path: 'positionId',
        select: 'title type mode level experience salary department'
      });

    if (!candidate) {
      return res.status(404).json({ message: 'Không tìm thấy ứng viên' });
    }

    // Format dữ liệu để phù hợp với frontend
    const formattedCandidate = {
      _id: candidate._id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      position: candidate.positionId ? candidate.positionId.title : 'N/A',
      type: candidate.positionId ? candidate.positionId.type : 'N/A',
      mode: candidate.positionId ? candidate.positionId.mode : 'N/A',
      level: candidate.positionId ? candidate.positionId.level : 'N/A',
      experience: candidate.positionId ? candidate.positionId.experience : 'N/A',
      salary: candidate.positionId ? candidate.positionId.salary : 'N/A',
      department: candidate.positionId ? candidate.positionId.department : 'N/A',
      stage: candidate.stage,
      source: candidate.source,
      customSource: candidate.customSource,
      cv: candidate.cv,
      notes: candidate.notes,
      createdAt: candidate.createdAt
    };

    res.json({
      candidate: formattedCandidate
    });
  } catch (error) {
    console.error('Error fetching candidate details:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi tải thông tin ứng viên' });
  }
};

// Lấy danh sách ứng viên cho calendar
exports.getCandidatesForCalendar = async (req, res) => {
  try {
    const candidates = await Candidate.find({
      stage: { $nin: ['rejected', 'hired'] }
    })
    .populate('positionId', 'name')
    .select('name email phone stage positionId')
    .sort({ createdAt: -1 });

    const formattedCandidates = candidates.map(candidate => ({
      _id: candidate._id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      position: candidate.positionId?.name || 'Chưa có vị trí',
      stage: candidate.stage
    }));

    res.json({
      candidates: formattedCandidates
    });
  } catch (error) {
    console.error('Error fetching candidates for calendar:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi tải danh sách ứng viên' });
  }
};

// Cập nhật trạng thái email của ứng viên
exports.updateCandidateEmailStatus = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { emailStatus } = req.body;

    console.log('Starting email status update:', {
      candidateId,
      emailStatus,
      body: req.body,
      headers: req.headers
    });

    // Kiểm tra ứng viên có tồn tại không
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      console.log('Candidate not found:', candidateId);
      return res.status(404).json({ message: 'Không tìm thấy ứng viên' });
    }

    console.log('Found candidate:', candidate);

    // Cập nhật trạng thái email
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      { $set: { emailStatus: emailStatus } },
      { new: true }
    );

    console.log('Updated candidate:', updatedCandidate);

    if (!updatedCandidate) {
      console.log('Update failed - candidate not found after update');
      return res.status(500).json({ message: 'Cập nhật thất bại' });
    }

    res.json({
      message: 'Cập nhật trạng thái email thành công',
      candidate: updatedCandidate
    });
  } catch (error) {
    console.error('Error updating candidate email status:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Có lỗi xảy ra khi cập nhật trạng thái email',
      error: error.message 
    });
  }
};

const sendEmail = async (req, res) => {
  try {
    // Kiểm tra quyền gửi mail
    if (req.user.role === 'department_head' && req.user.department !== 'hr') {
      return res.status(403).json({ 
        message: 'Bạn không có quyền thực hiện chức năng này'
      });
    }

    // ... existing code for sending email ...
  } catch (error) {
    console.error('Error in sendEmail:', error);
    res.status(500).json({ message: 'Lỗi khi gửi email' });
  }
};

// Lấy thống kê ứng viên theo nguồn
exports.getCandidateSourceStats = async (req, res) => {
  try {
    // Lấy tất cả ứng viên
    const candidates = await Candidate.find({});
    
    // Tính toán số lượng ứng viên theo nguồn
    const sourceStats = {};
    let totalCandidates = candidates.length;
    
    candidates.forEach(candidate => {
      const source = candidate.source;
      if (!sourceStats[source]) {
        sourceStats[source] = 0;
      }
      sourceStats[source]++;
    });
    
    // Tính phần trăm cho mỗi nguồn
    const sourceStatsWithPercentage = Object.keys(sourceStats).map(source => {
      const count = sourceStats[source];
      const percentage = totalCandidates > 0 ? Math.round((count / totalCandidates) * 100) : 0;
      
      // Gán màu sắc cho từng nguồn
      let color;
      switch (source) {
        case 'Facebook':
          color = '#8884d8';
          break;
        case 'Email':
          color = '#82ca9d';
          break;
        case 'JobsGo':
          color = '#ff7c43';
          break;
        case 'Khác':
          color = '#d3d3d3';
          break;
        default:
          color = '#8884d8';
      }
      
      return {
        name: source,
        value: percentage,
        count: count,
        color: color
      };
    });
    
    res.json({
      message: 'Lấy thống kê ứng viên theo nguồn thành công',
      data: sourceStatsWithPercentage
    });
  } catch (error) {
    console.error('Error getting candidate source stats:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi lấy thống kê ứng viên theo nguồn' });
  }
}; 