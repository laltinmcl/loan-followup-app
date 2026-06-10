import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Search, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function LoansPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['loans', search, page],
    queryFn: () => api.get('/loans', { params: { search, page, limit: 20 } }).then((r) => r.data),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by member name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="card divide-y divide-gray-100">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : data?.loans?.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No loans found</div>
        ) : (
          data?.loans?.map((loan: any) => (
            <Link
              key={loan.id}
              to={`/loans/${loan.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{loan.memberName}</p>
                <p className="text-sm text-gray-500">
                  {loan.accountNo} · {loan.loanCategory}
                </p>
                <div className="flex gap-2 mt-1">
                  <span className={`badge ${loan.dueCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {loan.dueCount} due{loan.dueCount !== 1 ? 's' : ''}
                  </span>
                  {loan.followupStage && (
                    <span className="badge bg-blue-100 text-blue-700 capitalize">
                      {loan.followupStage.currentStage.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="font-medium">₹{(loan.totalDue ?? 0).toLocaleString()}</p>
                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto mt-1" />
              </div>
            </Link>
          ))
        )}
      </div>

      {data?.total > 20 && (
        <div className="flex justify-center gap-2">
          <button
            className="btn-secondary text-sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 self-center">
            Page {page} of {Math.ceil(data.total / 20)}
          </span>
          <button
            className="btn-secondary text-sm"
            disabled={page >= Math.ceil(data.total / 20)}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
