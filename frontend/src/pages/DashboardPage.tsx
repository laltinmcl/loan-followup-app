import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Users, DollarSign, AlertTriangle, FileText } from 'lucide-react';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get('/dashboard/summary').then((r) => r.data),
  });

  const { data: aging } = useQuery({
    queryKey: ['dashboard-aging'],
    queryFn: () => api.get('/dashboard/aging').then((r) => r.data),
  });

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  const cards = [
    { label: 'Total Loans', value: data?.totalLoans ?? 0, icon: FileText, color: 'text-blue-600 bg-blue-100' },
    { label: 'Active Loans', value: data?.activeLoans ?? 0, icon: Users, color: 'text-green-600 bg-green-100' },
    { label: 'Overdue Amount', value: `₹${(data?.overdueLoans ?? 0).toLocaleString()}`, icon: DollarSign, color: 'text-red-600 bg-red-100' },
    { label: 'Portfolio', value: `₹${(data?.totalPortfolio ?? 0).toLocaleString()}`, icon: AlertTriangle, color: 'text-purple-600 bg-purple-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-lg font-semibold truncate">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-4">
          <h3 className="font-medium mb-3">Stage Distribution</h3>
          <div className="space-y-2">
            {data?.stageCounts?.map((s: any) => (
              <div key={s.stage} className="flex items-center justify-between text-sm">
                <span className="capitalize text-gray-600">{s.stage.replace(/_/g, ' ')}</span>
                <span className="font-medium">{s.count}</span>
              </div>
            ))}
            {(!data?.stageCounts || data.stageCounts.length === 0) && (
              <p className="text-sm text-gray-400">No data yet</p>
            )}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-medium mb-3">Aging (Due Count)</h3>
          <div className="space-y-2">
            {aging?.map((b: any) => (
              <div key={b.dueCount} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{b.dueCount} due{b.dueCount !== 1 ? 's' : ''}</span>
                <span className="font-medium">{b._count} loans — ₹{(b._sum?.totalDue ?? 0).toLocaleString()}</span>
              </div>
            ))}
            {(!aging || aging.length === 0) && (
              <p className="text-sm text-gray-400">No aging data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
