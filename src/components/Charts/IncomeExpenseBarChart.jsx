import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const IncomeExpenseBarChart = ({ income, expenses }) => {
  const data = [
    { name: 'Income', amount: income || 0, color: '#10B981' },
    { name: 'Expenses', amount: expenses || 0, color: '#DC2626' }
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={(value) => ?k} />
        <Tooltip formatter={(value) => ?} />
        <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={cell-} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default IncomeExpenseBarChart;
