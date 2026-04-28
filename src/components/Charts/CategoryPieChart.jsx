import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const CategoryPieChart = ({ data }) => {
  const COLORS = ['#10B981', '#DC2626', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#6B7280'];
  
  const chartData = Object.entries(data || {}).map(([name, value]) => ({
    name,
    value: value || 0
  }));

  if (chartData.length === 0 || chartData.every(d => d.value === 0)) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
        No expense data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => ${name} %}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={cell-} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => ?} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CategoryPieChart;
