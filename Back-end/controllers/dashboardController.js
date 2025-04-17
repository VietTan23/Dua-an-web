const Candidate = require('../models/Candidate');
const Position = require('../models/Position');
const RecruitmentRequest = require('../models/RecruitmentRequest');
const moment = require('moment');

// Helper function để tính % thay đổi
const calculateTrend = (currentValue, previousValue) => {
  if (previousValue === 0) return '0.00';
  const change = ((currentValue - previousValue) / previousValue) * 100;
  return change.toFixed(2);
};

// Lấy thống kê cho dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const now = moment();
    const startOfThisWeek = moment().startOf('week');
    const startOfLastWeek = moment().subtract(1, 'weeks').startOf('week');
    const endOfLastWeek = moment().subtract(1, 'weeks').endOf('week');

    // Lấy thống kê ứng viên theo trạng thái
    const candidateStats = await Candidate.aggregate([
      {
        $facet: {
          'thisWeek': [
            {
              $match: {
                createdAt: { $gte: startOfThisWeek.toDate() }
              }
            },
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          'lastWeek': [
            {
              $match: {
                createdAt: {
                  $gte: startOfLastWeek.toDate(),
                  $lte: endOfLastWeek.toDate()
                }
              }
            },
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          'sourceStats': [
            {
              $group: {
                _id: '$source',
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    // Xử lý dữ liệu thống kê ứng viên
    const getCount = (stats, status) => {
      const found = stats.find(item => item._id === status);
      return found ? found.count : 0;
    };

    const thisWeekStats = candidateStats[0].thisWeek;
    const lastWeekStats = candidateStats[0].lastWeek;
    const sourceStats = candidateStats[0].sourceStats;

    // Tuần này
    const thisWeekApplications = getCount(thisWeekStats, 'new');
    const thisWeekInterviews = getCount(thisWeekStats, 'interviewing');
    const thisWeekHired = getCount(thisWeekStats, 'hired');
    const thisWeekRejected = getCount(thisWeekStats, 'rejected');

    // Tuần trước
    const lastWeekApplications = getCount(lastWeekStats, 'new');
    const lastWeekInterviews = getCount(lastWeekStats, 'interviewing');
    const lastWeekHired = getCount(lastWeekStats, 'hired');
    const lastWeekRejected = getCount(lastWeekStats, 'rejected');

    // Xử lý thống kê nguồn ứng viên
    const totalCandidates = sourceStats.reduce((sum, item) => sum + item.count, 0);
    const sourcePercentages = sourceStats.map(item => ({
      source: item._id || 'Khác',
      percentage: ((item.count / totalCandidates) * 100).toFixed(1)
    }));

    // Lấy danh sách vị trí tuyển dụng từ recruitment requests
    const activePositions = await RecruitmentRequest.find({ status: 'approved' })
      .populate('position', 'title type workMode salary department')
      .select('position quantity')
      .limit(5)
      .lean();

    const formattedPositions = activePositions.map(req => ({
      title: req.position.title,
      type: req.position.type || 'Full-time',
      workMode: req.position.workMode || 'On-site',
      salary: req.position.salary || 'Thỏa thuận',
      department: req.position.department,
      quantity: req.quantity
    }));

    const stats = {
      totalApplications: thisWeekApplications,
      applicationTrend: calculateTrend(thisWeekApplications, lastWeekApplications),
      
      totalInterviews: thisWeekInterviews,
      interviewTrend: calculateTrend(thisWeekInterviews, lastWeekInterviews),
      
      totalHired: thisWeekHired,
      hiredTrend: calculateTrend(thisWeekHired, lastWeekHired),
      
      totalRejected: thisWeekRejected,
      rejectedTrend: calculateTrend(thisWeekRejected, lastWeekRejected),

      sourceStats: sourcePercentages,
      activePositions: formattedPositions
    };

    res.json(stats);
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ error: 'Không thể lấy thống kê dashboard' });
  }
}; 