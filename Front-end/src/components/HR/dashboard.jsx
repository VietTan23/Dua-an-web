import React, { useState, useEffect } from 'react';
import { Layout, Button, Select, message, Spin } from 'antd';
import { FileTextOutlined, UserOutlined, TeamOutlined, CloseCircleOutlined, CodeOutlined } from '@ant-design/icons';
import axios from 'axios';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import StatCard from './StatCard';
import JobCard from './JobCard';
import BarChart from './BarChart';
import PositionStats from './PositionStats';
import EmployeeStats from './EmployeeStats';
import Calendar from './Calendar';
import ApplicationSourceStats from './ApplicationSourceStats';

const { Content } = Layout;
const { Option } = Select;

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    applicationTrend: '0',
    totalInterviews: 0,
    interviewTrend: '0',
    totalHired: 0,
    hiredTrend: '0',
    totalRejected: 0,
    rejectedTrend: '0',
    sourceStats: [],
    activePositions: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/api/dashboard/stats', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setStats(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Hồ sơ ứng tuyển',
      count: stats.totalApplications,
      trend: 'So với tháng trước',
      trendValue: stats.applicationTrend,
      icon: UserOutlined,
      iconColor: 'bg-blue-500'
    },
    {
      title: 'Phỏng vấn',
      count: stats.totalInterviews,
      trend: 'So với tháng trước',
      trendValue: stats.interviewTrend,
      icon: FileTextOutlined,
      iconColor: 'bg-green-500'
    },
    {
      title: 'Tuyển',
      count: stats.totalHired,
      trend: 'So với tháng trước',
      trendValue: stats.hiredTrend,
      icon: UserOutlined,
      iconColor: 'bg-cyan-500'
    },
    {
      title: 'Từ chối',
      count: stats.totalRejected,
      trend: 'So với tháng trước',
      trendValue: stats.rejectedTrend,
      icon: CloseCircleOutlined,
      iconColor: 'bg-red-500'
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <Sidebar />
      <Layout style={{ marginLeft: 282 }}>
        <Topbar />
        <Content style={{ margin: '80px 16px 24px', padding: 24, minHeight: 280 }}>
          {loading ? (
            <Spin spinning={true}>
              <div className="flex justify-center items-center h-[500px]">
                <div>Đang tải dữ liệu...</div>
              </div>
            </Spin>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="col-span-1">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {statCards.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                  ))}
                </div>

                {/* Job Positions Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Vị trí tuyển dụng ({stats.activePositions.length})</h2>
                  <Button type="link" className="text-[#7152F3] font-medium p-0">
                    Tất cả
                  </Button>
                </div>

                {/* Job Positions Cards */}
                <div className="space-y-2">
                  {stats.activePositions.map((job, index) => (
                    <div key={index} className="bg-white px-4 py-3 rounded-[10px] shadow-sm">
                      <JobCard {...job} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Center Column */}
              <div className="col-span-1 space-y-6">
                {/* Applications Chart */}
                <div className="bg-white p-6 rounded-[20px] shadow-sm min-h-[362px]">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Hồ sơ ứng tuyển</h2>
                    <Select defaultValue="7" className="w-32" size="large" variant="borderless">
                      <Option value="7">7 tháng nay</Option>
                      <Option value="30">30 ngày qua</Option>
                      <Option value="90">90 ngày qua</Option>
                    </Select>
                  </div>
                  <BarChart />
                </div>

                {/* Position Stats */}
                <div className="bg-white p-6 rounded-[20px] shadow-sm min-h-[362px]">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Hồ sơ theo vị trí tuyển dụng</h2>
                    <Select defaultValue="now" className="w-32" size="large" variant="borderless">
                      <Option value="now">Nay</Option>
                      <Option value="week">Tuần này</Option>
                      <Option value="month">Tháng này</Option>
                    </Select>
                  </div>
                  <PositionStats />
                </div>

                {/* Employee Stats */}
                <div className="bg-white p-6 rounded-[20px] shadow-sm min-h-[362px]">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Chức danh nhân viên</h2>
                    <Button type="text" className="text-gray-400">...</Button>
                  </div>
                  <EmployeeStats />
                </div>
              </div>

              {/* Right Column */}
              <div className="col-span-1 space-y-6">
                <Calendar />
                <ApplicationSourceStats data={stats.sourceStats} />
              </div>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}