import React from 'react';
import { Table, Tag } from 'antd';

const JobPositions = ({ positions }) => {
  const columns = [
    {
      title: 'Vị trí',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'Full-time' ? 'blue' : 'orange'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Hình thức',
      dataIndex: 'workMode',
      key: 'workMode',
      render: (mode) => (
        <Tag color={mode === 'Remote' ? 'purple' : 'green'}>
          {mode}
        </Tag>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Mức lương',
      dataIndex: 'salary',
      key: 'salary',
      render: (salary) => (
        <span>{salary ? `${salary.toLocaleString()} VND` : 'Thỏa thuận'}</span>
      ),
    },
  ];

  return (
    <Table
      dataSource={positions}
      columns={columns}
      rowKey="id"
      pagination={false}
      scroll={{ y: 400 }}
    />
  );
};

export default JobPositions; 