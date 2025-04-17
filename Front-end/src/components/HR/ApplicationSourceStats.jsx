import React from 'react';
import { Progress } from 'antd';

const sourceColors = {
  'Facebook': '#1890ff',
  'Email': '#52c41a',
  'JobsGO': '#722ed1',
  'TopCV': '#faad14',
  'Khác': '#f5222d'
};

export default function ApplicationSourceStats({ data = [] }) {
  return (
    <div className="bg-white p-6 rounded-[20px] shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Tỷ lệ ứng viên đạt theo nguồn</h2>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">{item.source}</span>
              <span className="font-medium">{item.percentage}%</span>
            </div>
            <Progress 
              percent={parseFloat(item.percentage)} 
              showInfo={false}
              strokeColor={sourceColors[item.source] || sourceColors['Khác']}
              trailColor="#f0f0f0"
              size={8}
            />
          </div>
        ))}
      </div>
    </div>
  );
} 