const Interview = require('../models/Interview');
const asyncHandler = require('express-async-handler');

// @desc    Get all interviews
// @route   GET /api/interviews
// @access  Private
const getInterviews = asyncHandler(async (req, res) => {
  const interviews = await Interview.find()
    .populate('candidate', 'name position')
    .populate('attendees', 'username email fullName');
  res.json(interviews);
});

// @desc    Get interview by ID
// @route   GET /api/interviews/:id
// @access  Private
const getInterviewById = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id)
    .populate('candidate', 'name position')
    .populate('attendees', 'username email fullName')
    .populate('createdBy', 'username fullName');

  if (!interview) {
    res.status(404);
    throw new Error('Không tìm thấy cuộc phỏng vấn');
  }

  res.json(interview);
});

// @desc    Create new interview
// @route   POST /api/interviews
// @access  Private
const createInterview = asyncHandler(async (req, res) => {
  const {
    title,
    date,
    startTime,
    endTime,
    eventType,
    location,
    description,
    candidate,
    attendees,
    beforeEvent
  } = req.body;

  const interview = await Interview.create({
    title,
    date,
    startTime,
    endTime,
    type: 'interview',
    eventType,
    location,
    description,
    candidate,
    attendees,
    createdBy: req.user._id,
    beforeEvent: beforeEvent || 5
  });

  const populatedInterview = await Interview.findById(interview._id)
    .populate('candidate', 'name position')
    .populate('attendees', 'username email')
    .populate('createdBy', 'username');

  res.status(201).json(populatedInterview);
});

const updateInterview = async (req, res) => {
  try {
    const updatedInterview = await Interview.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedInterview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteInterview = async (req, res) => {
  try {
    await Interview.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Interview deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get upcoming interviews by candidate ID
const getUpcomingInterviewsByCandidate = async (req, res) => {
  try {
    const { candidateId } = req.params;
    
    // Tìm tất cả interview sắp tới của ứng viên
    const interviews = await Interview.find({
      candidate: candidateId,
      date: { $gt: new Date() }
    })
    .populate('attendees', 'fullName role email department')
    .populate('createdBy', 'fullName role email department')
    .populate('candidate', 'name email phone positionId')
    .sort({ date: 1 });

    res.json(interviews);
  } catch (error) {
    console.error('Error in getUpcomingInterviewsByCandidate:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy thông tin phỏng vấn',
      error: error.message 
    });
  }
};

module.exports = {
  getInterviews,
  getInterviewById,
  createInterview,
  updateInterview,
  deleteInterview,
  getUpcomingInterviewsByCandidate
};