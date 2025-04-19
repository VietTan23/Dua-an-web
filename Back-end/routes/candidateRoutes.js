const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { protect, authorizeAdminHR } = require('../middlewares/authMiddleware');
const { handleCVUpload } = require('../middlewares/uploadMiddleware');

// Lấy thống kê ứng viên theo nguồn
router.get('/source-stats', protect, authorizeAdminHR('view'), candidateController.getCandidateSourceStats);

// Lấy danh sách ứng viên cho calendar
router.get('/calendar/candidates', protect, authorizeAdminHR('view'), candidateController.getCandidatesForCalendar);

// Lấy danh sách ứng viên theo vị trí
router.get('/positions/:positionId/candidates', protect, authorizeAdminHR('view'), candidateController.getCandidatesByPosition);

// Thêm ứng viên mới
router.post('/positions/:positionId/candidates', protect, authorizeAdminHR('create'), handleCVUpload, candidateController.createCandidate);

// Lấy tất cả ứng viên
router.get('/', protect, authorizeAdminHR('view'), candidateController.getAllCandidates);

// Lấy chi tiết ứng viên
router.get('/:candidateId', protect, authorizeAdminHR('view'), candidateController.getCandidateById);

// Cập nhật trạng thái ứng viên
router.patch('/:candidateId/status', protect, authorizeAdminHR('update'), candidateController.updateCandidateStatus);

// Cập nhật thông tin ứng viên
router.patch('/:candidateId', protect, authorizeAdminHR('update'), handleCVUpload, candidateController.updateCandidate);

// Xóa ứng viên
router.delete('/:candidateId', protect, authorizeAdminHR('delete'), candidateController.deleteCandidate);

// Cập nhật trạng thái email của ứng viên
router.patch('/:candidateId/email-status', protect, authorizeAdminHR('update'), candidateController.updateCandidateEmailStatus);

module.exports = router; 