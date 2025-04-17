import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';

const data = [
  { name: 'Facebook', value: 40, color: '#8884d8' },
  { name: 'Email', value: 15, color: '#82ca9d' },
  { name: 'Ybox', value: 30, color: '#ffc658' },
  { name: 'JobsGO', value: 30, color: '#ff7c43' },
  { name: 'Khác', value: 10, color: '#d3d3d3' }
];

const ApplicationSourceStats = () => {
  return (
    <div className="bg-white p-6 rounded-[20px] shadow-sm min-h-[310px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Tỷ lệ ứng viên đạt theo nguồn</h2>
        <span className="text-gray-400">...</span>
      </div>

      <div className="flex justify-center mb-4">
        <PieChart width={180} height={180}>
          <Pie
            data={data}
            cx={90}
            cy={90}
            innerRadius={60}
            outerRadius={75}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <div className="text-sm font-medium">
              {item.name} ({item.value}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApplicationSourceStats; 