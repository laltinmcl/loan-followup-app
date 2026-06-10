import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Bell, CheckCircle } from 'lucide-react';

export default function RemindersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => api.get('/reminders', { params: { completed: false } }).then((r) => r.data),
  });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : data?.reminders?.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">No pending reminders</div>
      ) : (
        <div className="space-y-3">
          {data?.reminders?.map((r: any) => (
            <div key={r.id} className="card p-4 flex items-start gap-3">
              <Bell className={`w-5 h-5 mt-0.5 ${r.completed ? 'text-green-500' : 'text-blue-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium">{r.title}</p>
                {r.loan && <p className="text-sm text-gray-500">{r.loan.memberName} · {r.loan.accountNo}</p>}
                <p className="text-xs text-gray-400 mt-0.5">
                  Due: {new Date(r.dueDate).toLocaleDateString()}
                  {r.type && ` · ${r.type.replace(/_/g, ' ')}`}
                </p>
              </div>
              {r.completed && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
