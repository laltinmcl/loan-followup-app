import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Phone, MapPin, Bell, Clock, AlertTriangle } from 'lucide-react';

const stageColors: Record<string, string> = {
  import: 'bg-gray-100 text-gray-700',
  soft_call: 'bg-blue-100 text-blue-700',
  notice: 'bg-yellow-100 text-yellow-700',
  field_visit: 'bg-orange-100 text-orange-700',
  promise_paid: 'bg-green-100 text-green-700',
  escalate: 'bg-red-100 text-red-700',
  legal: 'bg-purple-100 text-purple-700',
  manager_review: 'bg-indigo-100 text-indigo-700',
  written_off: 'bg-gray-100 text-gray-500',
  resolved: 'bg-green-100 text-green-700',
};

export default function LoanDetailPage() {
  const { id } = useParams();
  const { data: loan, isLoading } = useQuery({
    queryKey: ['loan', id],
    queryFn: () => api.get(`/loans/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!loan) return <div className="text-center py-12 text-gray-400">Loan not found</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="card p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{loan.memberName}</h2>
            <p className="text-sm text-gray-500">{loan.accountNo} · {loan.memberCode}</p>
          </div>
          {loan.followupStage && (
            <span className={`badge text-sm ${stageColors[loan.followupStage.currentStage] || 'bg-gray-100'}`}>
              {loan.followupStage.currentStage.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="card p-4">
        <h3 className="font-medium mb-3">Loan Details</h3>
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          <div><span className="text-gray-500">Category</span><p className="font-medium">{loan.loanCategory}</p></div>
          <div><span className="text-gray-500">Disbursed</span><p className="font-medium">₹{loan.disburseAmount?.toLocaleString()}</p></div>
          <div><span className="text-gray-500">Principal Due</span><p className="font-medium">₹{loan.principalDue?.toLocaleString()}</p></div>
          <div><span className="text-gray-500">Interest</span><p className="font-medium">₹{loan.interestTotal?.toLocaleString()}</p></div>
          <div><span className="text-gray-500">Due Count</span><p className="font-medium">{loan.dueCount}</p></div>
          <div>
            <span className="text-gray-500">Total Due</span>
            <p className={`font-medium ${loan.dueCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹{loan.totalDue?.toLocaleString()}
            </p>
          </div>
          <div><span className="text-gray-500">Mobile</span><p className="font-medium">{loan.mobileNo || '—'}</p></div>
          <div><span className="text-gray-500">Expiry</span><p className="font-medium">{loan.loanExpiryDate ? new Date(loan.loanExpiryDate).toLocaleDateString() : '—'}</p></div>
        </div>
      </div>

      {/* Stage History */}
      {loan.followupStage?.stageHistory?.length > 0 && (
        <div className="card p-4">
          <h3 className="font-medium mb-3">Stage History</h3>
          <div className="space-y-2">
            {loan.followupStage.stageHistory.map((h: any) => (
              <div key={h.id} className="flex items-start gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p>
                    <span className="capitalize font-medium">{h.fromStage?.replace(/_/g, ' ')}</span>
                    {' → '}
                    <span className="capitalize font-medium">{h.toStage.replace(/_/g, ' ')}</span>
                  </p>
                  <p className="text-gray-500 text-xs">{new Date(h.createdAt).toLocaleString()}{h.note ? ` — ${h.note}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Field Visits */}
      {loan.fieldVisits?.length > 0 && (
        <div className="card p-4">
          <h3 className="font-medium mb-3">Field Visits</h3>
          <div className="space-y-2">
            {loan.fieldVisits.map((v: any) => (
              <div key={v.id} className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium capitalize">{v.status.replace(/_/g, ' ')}</p>
                  <p className="text-gray-500 text-xs">{new Date(v.visitDate).toLocaleDateString()}{v.notes ? ` — ${v.notes}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reminders */}
      {loan.reminders?.length > 0 && (
        <div className="card p-4">
          <h3 className="font-medium mb-3">Reminders</h3>
          <div className="space-y-2">
            {loan.reminders.map((r: any) => (
              <div key={r.id} className="flex items-start gap-2 text-sm">
                <Bell className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-gray-500 text-xs">{new Date(r.dueDate).toLocaleDateString()}{r.completed ? ' ✓ Completed' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Log */}
      {loan.activityLogs?.length > 0 && (
        <div className="card p-4">
          <h3 className="font-medium mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {loan.activityLogs.map((a: any) => (
              <div key={a.id} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{a.action.replace(/_/g, ' ')}</p>
                  <p className="text-gray-500 text-xs">{a.description} · {new Date(a.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
