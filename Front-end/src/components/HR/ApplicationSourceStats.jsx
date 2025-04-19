import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { Spin } from 'antd';
import { getCandidateSourceStats } from '../../services/positionService';

// Fallback data in case API fails
const fallbackData = [
  { name: 'Facebook', value: 40, color: '#8884d8' },
  { name: 'Email', value: 15, color: '#82ca9d' },
  { name: 'JobsGO', value: 30, color: '#ff7c43' },
  { name: 'Khác', value: 10, color: '#d3d3d3' }
];

const ApplicationSourceStats = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSourceStats = async () => {
      try {
        setLoading(true);
        const response = await getCandidateSourceStats();
        if (response && response.data) {
          // Ensure each item has a color property
          const dataWithColors = response.data.map(item => {
            // If the item already has a color, use it
            if (item.color) {
              return item;
            }
            
            // Otherwise, assign a color based on the source name
            let color;
            switch (item.name) {
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
              ...item,
              color
            };
          });
          
          setData(dataWithColors);
        } else {
          setData(fallbackData);
        }
      } catch (err) {
        console.error('Error fetching candidate source stats:', err);
        setError('Không thể tải dữ liệu thống kê nguồn ứng viên');
        setData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchSourceStats();
  }, []);

  return (
    <div className="bg-white p-6 rounded-[20px] shadow-sm min-h-[310px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Tỷ lệ ứng viên đạt theo nguồn</h2>
        <span className="text-gray-400">...</span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Spin size="large" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center p-4">{error}</div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default ApplicationSourceStats; 