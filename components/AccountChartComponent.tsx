'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Transaction {
  type: string;
  amount: string;
  createdAt: Date;
}

export default function AccountChartComponent({ currentBalance, transactions }: { currentBalance: number; transactions: Transaction[] }) {
  const data: { date: string; balance: number }[] = [];
  let balance = currentBalance;

  for (let i = transactions.length - 1; i >= 0; i--) {
    const t = transactions[i];
    if (t.type === 'DEPOSIT') {
      balance -= parseFloat(t.amount);
    } else if (t.type === 'TRANSFER') {
      balance += parseFloat(t.amount);
    }
    data.push({
      date: new Date(t.createdAt).toLocaleDateString(),
      balance: balance,
    });
  }

  data.push({
    date: 'Now',
    balance: currentBalance,
  });

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          <Line type="monotone" dataKey="balance" stroke="#1e40af" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
