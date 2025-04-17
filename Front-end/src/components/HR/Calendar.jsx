import React from 'react';
import { Calendar as AntCalendar, Badge } from 'antd';
import 'dayjs/locale/vi';

const interviews = [
  {
    time: '09:30 AM',
    candidate: 'Marketing Executive - Trần Quang Huy',
    status: 'Phỏng vấn'
  },
  {
    time: '10:30 AM',
    candidate: 'Giáo Viên FE - Nguyễn Huy Hoàng',
    status: 'Phỏng vấn'
  },
  {
    time: '2:00 PM',
    candidate: 'Giáo Viên Kaiwa - Trương Lê Kim Ngân',
    status: 'Phỏng vấn'
  },
  {
    time: '3:30 PM',
    candidate: 'Giáo Viên Sơ Cấp - Trần Thiện Minh',
    status: 'Phỏng vấn'
  }
];

const Calendar = () => {
  return (
    <div className="bg-white p-6 rounded-[20px] shadow-sm min-h-[310px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Lịch</h2>
        <span className="text-gray-400">...</span>
      </div>

      <div className="bg-[#F8F7FF] rounded-xl p-3 mb-4">
        <AntCalendar
          fullscreen={false}
          headerRender={({ value, onChange }) => (
            <div className="flex justify-between items-center px-2">
              <div className="text-base font-medium">
                Tháng {value.format('M')}, {value.year()}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onChange(value.clone().subtract(1, 'month'))}
                  className="px-2"
                >
                  ‹
                </button>
                <button
                  onClick={() => onChange(value.clone().add(1, 'month'))}
                  className="px-2"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        />
      </div>

      <div className="space-y-3">
        {interviews.map((interview, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="text-sm text-gray-500 w-20">{interview.time}</div>
            <div className="flex-1 bg-[#F8F7FF] rounded-xl p-3">
              <div className="text-sm font-medium">{interview.candidate}</div>
              <div className="text-xs text-gray-500">{interview.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar; 