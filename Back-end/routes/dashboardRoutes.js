const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

// Lấy thống kê tổng quan cho dashboard
router.get('/stats', protect, dashboardController.getDashboardStats);

module.exports = router; 