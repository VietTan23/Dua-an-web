import React from 'react';
import { Pie } from '@ant-design/plots';

const ApplicationSources = ({ sources }) => {
  const config = {
    appendPadding: 10,
    data: sources,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name}: {percentage}',
    },
    interactions: [
      {
        type: 'pie-legend-active',
      },
      {
        type: 'element-active',
      },
    ],
  };

  return (
    <div style={{ height: 400 }}>
      <Pie {...config} />
    </div>
  );
};

export default ApplicationSources; 