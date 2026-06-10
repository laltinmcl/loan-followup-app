import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { MoveRight } from 'lucide-react';

const stageOrder = ['import', 'soft_call', 'notice', 'field_visit', 'promise_paid', 'escalate', 'legal', 'manager_review', 'written_off', 'resolved'];

const stageColors: Record<string, string> = {
  import: 'bg-gray-200', soft_call: 'bg-blue-200', notice: 'bg-yellow-200',
  field_visit: 'bg-orange-200', promise_paid: 'bg-green-200', escalate: 'bg-red-200',
  legal: 'bg-purple-200', manager_review: 'bg-indigo-200', written_off: 'bg-gray-300', resolved: 'bg-emerald-200',
};

const stageLabels: Record<string, string> = {
  import: 'Import', soft_call: 'Soft Call', notice: 'Notice',
  field_visit: 'Field Visit', promise_paid: 'Promise/Paid', escalate: 'Escalate',
  legal: 'Legal', manager_review: 'Mgr Review', written_off: 'Written Off', resolved: 'Resolved',
};

const validTransitions: Record<string, string[]> = {
  import: ['soft_call', 'notice'],
  soft_call: ['field_visit', 'promise_paid', 'escalate'],
  notice: ['field_visit', 'promise_paid', 'legal'],
  field_visit: ['promise_paid', 'escalate', 'resolved'],
  promise_paid: ['field_visit', 'resolved', 'soft_call'],
  escalate: ['field_visit', 'legal', 'manager_review'],
  legal: ['escalate', 'written_off', 'resolved'],
  manager_review: ['escalate', 'field_visit', 'resolved'],
  written_off: ['resolved'],
  resolved: [],
};

export default function StageBoardPage() {
  const queryClient = useQueryClient();
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const [toStage, setToStage] = useState('');
  const [note, setNote] = useState('');

  const { data: board, isLoading } = useQuery({
    queryKey: ['stage-board'],
    queryFn: () => api.get('/stages/board').then((r) => r.data),
  });

  const transition = useMutation({
    mutationFn: ({ loanId, toStage, note }: { loanId: string; toStage: string; note?: string }) =>
      api.post(`/stages/${loanId}/transition`, { toStage, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stage-board'] });
      setSelectedLoan(null);
      setToStage('');
      setNote('');
      toast.success('Stage updated');
    },
    onError: () => toast.error('Transition failed'),
  });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {stageOrder.map((stage) => {
            const items = board?.[stage] || [];
            return (
              <div key={stage} className="card min-w-[200px]">
                <div className={`px-3 py-2 rounded-t-xl font-medium text-sm ${stageColors[stage]}`}>
                  {stageLabels[stage]}
                  <span className="ml-2 text-xs opacity-60">{items.length}</span>
                </div>
                <div className="p-2 space-y-2 max-h-[70vh] overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No loans</p>
                  ) : (
                    items.map((s: any) => (
                      <div
                        key={s.id}
                        className="bg-gray-50 rounded-lg p-2 text-sm cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setSelectedLoan(s.loanId);
                          const allowed = validTransitions[s.currentStage] || [];
                          setToStage(allowed[0] || '');
                        }}
                      >
                        <p className="font-medium truncate">{s.loan?.memberName}</p>
                        <p className="text-xs text-gray-500">{s.loan?.accountNo}</p>
                        {s.loan?.totalDue && (
                          <p className="text-xs font-medium mt-1">₹{(s.loan.totalDue as number).toLocaleString()}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transition modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedLoan(null)}>
          <div className="bg-white rounded-xl p-4 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-medium">Move Loan</h3>
            <div>
              <label className="text-sm text-gray-600">To Stage</label>
              <select className="input mt-1" value={toStage} onChange={(e) => setToStage(e.target.value)}>
                {validTransitions[board?.[selectedLoan]?.[0]?.currentStage || '']?.map((s: string) => (
                  <option key={s} value={s}>{stageLabels[s] || s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Note (optional)</label>
              <textarea className="input mt-1" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setSelectedLoan(null)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={() => transition.mutate({ loanId: selectedLoan, toStage, note })}
                disabled={!toStage || transition.isPending}
              >
                {transition.isPending ? 'Moving...' : 'Move'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
