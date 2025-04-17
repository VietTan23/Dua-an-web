require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cloudinary = require('cloudinary').v2;
const path = require('path');
require('./utils/cronJobs');

// Import models
const User = require('./models/User');
const JobPosition = require('./models/JobPosition');
const Application = require('./models/Application');
const Interview = require('./models/Interview');
const Offer = require('./models/Offer');
const Notification = require('./models/Notification');
const Position = require('./models/Position');
const Comment = require('./models/Comment');

// Import routes
const authRoutes = require('./routes/authRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const positionRoutes = require('./routes/positionRoutes');
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const offerRoutes = require('./routes/offerRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const emailRoutes = require('./routes/emailRoutes');
const commentRoutes = require('./routes/commentRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const recruitmentNotificationRoutes = require('./routes/recruitmentNotificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();

// Trust proxy - cần thiết khi chạy trên Render
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://*.netlify.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  trustProxy: true // Trust the X-Forwarded-For header
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/candidates', commentRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/recruitment-notifications', recruitmentNotificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Có lỗi xảy ra!',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    const PORT = process.env.PORT || 8000;
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Xử lý graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      // Đóng server HTTP
      server.close(() => {
        console.log('HTTP server closed');
      });

      // Đóng kết nối MongoDB
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
      }

      // Đợi tất cả các kết nối được đóng
      setTimeout(() => {
        console.log('Graceful shutdown completed');
        process.exit(0);
      }, 1000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

//Error Handler - Đặt ở cuối middleware stack
const errorHandler = require('./utils/errorHandler');
app.use(errorHandler);