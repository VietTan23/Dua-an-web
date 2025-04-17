const express = require('express');
const router = express.Router();
const { protect, authorizeAdminHR } = require('../middlewares/authMiddleware');
const {
  getPositions,
  getPositionById,
  createPosition,
  updatePosition,
  deletePosition,
  downloadJD,
  getActivePositions
} = require('../controllers/positionController');
const { handleCVUpload } = require('../middlewares/uploadMiddleware');
const candidateController = require('../controllers/candidateController');

// Lấy danh sách vị trí tuyển dụng đang active
router.get('/active', protect, getActivePositions);

// Public routes
router.get('/', protect, authorizeAdminHR('view'), getPositions);
router.get('/:id', protect, authorizeAdminHR('view'), getPositionById);
router.get('/:id/download-jd', protect, authorizeAdminHR('view'), downloadJD);

// Protected routes - Chỉ HR và CEO mới có quyền thêm/sửa/xóa
router.post('/', protect, (req, res, next) => {
  if (req.user.role === 'department_head' && req.user.department !== 'hr') {
    return res.status(403).json({ message: 'Bạn không có quyền thực hiện chức năng này' });
  }
  authorizeAdminHR('create')(req, res, next);
}, createPosition);

router.put('/:id', protect, (req, res, next) => {
  if (req.user.role === 'department_head' && req.user.department !== 'hr') {
    return res.status(403).json({ message: 'Bạn không có quyền thực hiện chức năng này' });
  }
  authorizeAdminHR('update')(req, res, next);
}, updatePosition);

router.delete('/:id', protect, (req, res, next) => {
  if (req.user.role === 'department_head' && req.user.department !== 'hr') {
    return res.status(403).json({ message: 'Bạn không có quyền thực hiện chức năng này' });
  }
  authorizeAdminHR('delete')(req, res, next);
}, deletePosition);

// Candidate routes
router.get('/:positionId/candidates', protect, authorizeAdminHR('view'), candidateController.getCandidatesByPosition);
router.post('/:positionId/candidates', protect, authorizeAdminHR('create'), handleCVUpload, candidateController.createCandidate);

module.exports = router; 